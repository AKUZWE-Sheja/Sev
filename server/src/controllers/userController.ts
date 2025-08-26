import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '10', search = '' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  const searchQuery = search as string;

  try {
    const where = {
      OR: [
        { fname: { contains: searchQuery, mode: 'insensitive' as const } },
        { lname: { contains: searchQuery, mode: 'insensitive' as const } },
        { email: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    };

    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: 'asc' },
        select: { id: true, fname: true, lname: true, email: true, role: true, isVerified: true },
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id, 10) } });
    await prisma.log.create({
      data: { userId: req.user?.id, action: `User ${id} deleted` },
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};