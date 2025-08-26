"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getLogs = async (req, res) => {
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const searchQuery = search;
    try {
        const where = {
            OR: [
                { action: { contains: searchQuery, mode: 'insensitive' } },
                // Only add userId filter if search is a valid number
                ...(isNaN(Number(searchQuery)) ? [] : [{ userId: Number(searchQuery) }]),
            ],
        };
        const [logs, totalItems] = await Promise.all([
            prisma.log.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { id: 'asc' },
            }),
            prisma.log.count({ where }),
        ]);
        res.json({
            data: logs,
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
exports.getLogs = getLogs;
