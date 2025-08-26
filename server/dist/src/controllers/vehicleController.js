"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicles = exports.createVehicle = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createVehicle = async (req, res) => {
    const userId = req.user?.id;
    const { plateNumber, vehicleType, size, otherAttributes } = req.body;
    if (typeof userId !== 'number') {
        res.status(400).json({ error: 'User ID is required' });
        return;
    }
    try {
        const vehicle = await prisma.vehicle.create({
            data: {
                userId,
                plateNumber,
                vehicleType,
                size,
                otherAttributes: otherAttributes || {},
            },
        });
        await prisma.log.create({
            data: {
                userId,
                action: `Vehicle ${plateNumber} created`,
            },
        });
        res.status(201).json(vehicle);
    }
    catch (error) {
        res.status(400).json({ error: 'Plate number already exists or server error' });
    }
};
exports.createVehicle = createVehicle;
const getVehicles = async (req, res) => {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const searchQuery = search;
    try {
        // Use Prisma's QueryMode type for 'mode'
        const searchFilter = {
            contains: searchQuery,
            mode: 'insensitive',
        };
        const where = isAdmin
            ? {
                OR: [
                    { plateNumber: searchFilter },
                    { vehicleType: searchFilter },
                ],
            }
            : {
                userId,
                OR: [
                    { plateNumber: searchFilter },
                    { vehicleType: searchFilter },
                ],
            };
        // Remove explicit type annotation, let TypeScript infer from Prisma
        const [vehicles, totalItems] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                skip,
                take: limitNum,
                include: {
                    slotRequests: {
                        where: { requestStatus: 'approved' },
                        select: { requestStatus: true },
                        take: 1,
                    },
                },
            }),
            prisma.vehicle.count({ where }),
        ]);
        await prisma.log.create({
            data: {
                userId,
                action: 'Vehicles list viewed',
            },
        });
        res.json({
            data: vehicles.map(v => ({
                ...v,
                approvalStatus: v.slotRequests && v.slotRequests.length > 0 ? v.slotRequests[0].requestStatus : null,
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
exports.getVehicles = getVehicles;
