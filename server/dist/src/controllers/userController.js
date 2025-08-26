"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getUsers = exports.updateProfile = exports.getProfile = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const getProfile = async (req, res) => {
    const userId = req.user?.id;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        await prisma.log.create({
            data: { userId, action: 'User profile viewed' },
        });
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const userId = req.user?.id;
    const { name, email, password } = req.body;
    try {
        const updates = {};
        if (name)
            updates.name = name;
        if (email)
            updates.email = email;
        if (password)
            updates.password = await bcrypt_1.default.hash(password, 10);
        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: 'No fields to update' });
            return;
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: updates,
            select: { id: true, name: true, email: true, role: true },
        });
        await prisma.log.create({
            data: { userId, action: 'Profile updated' },
        });
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Email already exists or server error' });
    }
};
exports.updateProfile = updateProfile;
const getUsers = async (req, res) => {
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const searchQuery = search;
    try {
        const where = {
            OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } },
            ],
        };
        const [users, totalItems] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { id: 'asc' },
                select: { id: true, name: true, email: true, role: true, isVerified: true },
            }),
            prisma.user.count({ where }),
        ]);
        await prisma.log.create({
            data: { userId: req.user?.id, action: 'Users list viewed' },
        });
        res.json({
            data: users,
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
exports.getUsers = getUsers;
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: parseInt(id, 10) } });
        await prisma.log.create({
            data: { userId: req.user?.id, action: `User ${id} deleted` },
        });
        res.json({ message: 'User deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
