"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectRequest = exports.approveRequest = exports.deleteRequest = exports.updateRequest = exports.getRequests = exports.createRequest = void 0;
const client_1 = require("@prisma/client");
const email_1 = require("../utils/email");
const prisma = new client_1.PrismaClient();
const createRequest = async (req, res) => {
    const userId = req.user?.id;
    const { vehicleId } = req.body;
    if (typeof userId !== 'number') {
        res.status(401).json({ error: 'Unauthorized: user ID missing' });
        return;
    }
    try {
        const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }
        const request = await prisma.slotRequest.create({
            data: {
                userId,
                vehicleId,
                requestStatus: 'pending',
            },
        });
        await prisma.log.create({
            data: { userId, action: `Slot request ${request.id} created for vehicle ${vehicle.plateNumber}` },
        });
        res.status(201).json(request);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.createRequest = createRequest;
const getRequests = async (req, res) => {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const searchQuery = `%${search}%`;
    try {
        const where = isAdmin
            ? {
                OR: [
                    { vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } },
                    { vehicle: { vehicleType: { contains: search, mode: 'insensitive' } } },
                ],
            }
            : {
                userId,
                OR: [
                    { vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } },
                    { vehicle: { vehicleType: { contains: search, mode: 'insensitive' } } },
                ],
            };
        const [requests, totalItems] = await Promise.all([
            prisma.slotRequest.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { id: 'asc' },
                include: {
                    vehicle: { select: { plateNumber: true, vehicleType: true } },
                    user: { select: { email: true } },
                },
            }),
            prisma.slotRequest.count({ where }),
        ]);
        await prisma.log.create({
            data: { userId, action: 'Slot requests list viewed' },
        });
        res.json({
            data: requests.map(r => ({
                ...r,
                plateNumber: r.vehicle.plateNumber,
                vehicleType: r.vehicle.vehicleType,
            })),
            meta: {
                totalItems,
                currentPage: pageNum,
                totalPages: Math.ceil(totalItems / limitNum),
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getRequests = getRequests;
const updateRequest = async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { vehicleId } = req.body;
    try {
        const request = await prisma.slotRequest.findFirst({
            where: { id: parseInt(id, 10), userId, requestStatus: 'pending' },
        });
        if (!request) {
            res.status(404).json({ error: 'Request not found or not editable' });
            return;
        }
        const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }
        const updatedRequest = await prisma.slotRequest.update({
            where: { id: parseInt(id, 10) },
            data: { vehicleId },
        });
        await prisma.log.create({
            data: { userId, action: `Slot request ${id} updated` },
        });
        res.json(updatedRequest);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateRequest = updateRequest;
const deleteRequest = async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    try {
        const request = await prisma.slotRequest.findFirst({
            where: { id: parseInt(id, 10), userId, requestStatus: 'pending' },
        });
        if (!request) {
            res.status(404).json({ error: 'Request not found or not deletable' });
            return;
        }
        await prisma.slotRequest.delete({ where: { id: parseInt(id, 10) } });
        await prisma.log.create({
            data: { userId, action: `Slot request ${id} deleted` },
        });
        res.json({ message: 'Request deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteRequest = deleteRequest;
const approveRequest = async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    try {
        const request = await prisma.slotRequest.findFirst({
            where: { id: parseInt(id, 10), requestStatus: 'pending' },
            include: { vehicle: true, user: true },
        });
        if (!request) {
            res.status(404).json({ error: 'Request not found or already processed' });
            return;
        }
        const slot = await prisma.parkingSlot.findFirst({
            where: {
                status: 'available',
                vehicleType: request.vehicle.vehicleType,
                size: request.vehicle.size,
            },
        });
        if (!slot) {
            res.status(400).json({ error: 'No compatible slots available' });
            return;
        }
        const updatedRequest = await prisma.slotRequest.update({
            where: { id: parseInt(id, 10) },
            data: {
                requestStatus: 'approved',
                slotId: slot.id,
                slotNumber: slot.slotNumber,
                approvedAt: new Date(),
            },
        });
        await prisma.parkingSlot.update({
            where: { id: slot.id },
            data: { status: 'occupied' },
        });
        const emailStatus = await (0, email_1.sendApprovalEmail)(request.user.email, slot.slotNumber);
        await prisma.log.create({
            data: { userId, action: `Slot request ${id} approved for slot ${slot.slotNumber}` },
        });
        res.json({ message: 'Request approved', slot, emailStatus });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.approveRequest = approveRequest;
const rejectRequest = async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;
    try {
        const request = await prisma.slotRequest.findFirst({
            where: { id: parseInt(id, 10), requestStatus: 'pending' },
            include: { user: true },
        });
        if (!request) {
            res.status(404).json({ error: 'Request not found or already processed' });
            return;
        }
        if (!reason) {
            res.status(400).json({ error: 'Rejection reason required' });
            return;
        }
        const updatedRequest = await prisma.slotRequest.update({
            where: { id: parseInt(id, 10) },
            data: { requestStatus: 'rejected' },
        });
        const emailStatus = await (0, email_1.sendRejectionEmail)(request.user.email, reason);
        await prisma.log.create({
            data: { userId, action: `Slot request ${id} rejected` },
        });
        res.json({ message: 'Request rejected', request: updatedRequest, emailStatus });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.rejectRequest = rejectRequest;
