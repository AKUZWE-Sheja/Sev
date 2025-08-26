import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// Kick things off with a Prisma client to talk to the DB
const prisma = new PrismaClient();

// Extend the Request type to include user info (ID and role)
interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

// Main function to grab logs, async 'cause DB calls take time
export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  // Pull query params for page, limit, and search (defaults to page 1, 10 items)
  const { page = '1', limit = '10', search = '' } = req.query;
  const pageNum = parseInt(page as string, 10); // Convert page to number
  const limitNum = parseInt(limit as string, 10); // Convert limit to number
  const skip = (pageNum - 1) * limitNum; // Calculate how many records to skip
  const searchQuery = search as string; // Grab search string

  try {
    // Set up search conditions: look for action containing search term (case-insensitive)
    const where = {
      OR: [
        { action: { contains: searchQuery, mode: 'insensitive' as const } },
        // If search is a number, also filter by userId
        ...(isNaN(Number(searchQuery)) ? [] : [{ userId: Number(searchQuery) }]),
      ],
    };

    // Run two DB queries at once: get logs and count total matching records
    const [logs, totalItems] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: limitNum, // Limit number of records
        orderBy: { id: 'asc' }, // Sort by ID, ascending
      }),
      prisma.log.count({ where }), // Count total logs matching filter
    ]);

    // Send back JSON with logs and pagination info
    res.json({
      data: logs,
      meta: {
        totalItems,
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum), // Calculate total pages
        limit: limitNum,
      },
    });
  } catch (error) {
    // Oops, something broke—log it and send a 500 error
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};