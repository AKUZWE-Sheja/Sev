import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string };
    }
  }
}

const prisma = new PrismaClient();

// Validation schemas
const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['CLOTHING', 'ELECTRONICS', 'FOOD', 'FURNITURE', 'BOOKS', 'HOUSEHOLD', 'SPECIAL_REQUEST']),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
});

const updateListingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['CLOTHING', 'ELECTRONICS', 'FOOD', 'FURNITURE', 'BOOKS', 'HOUSEHOLD', 'SPECIAL_REQUEST']).optional(),
  status: z.enum(['ACTIVE', 'CLAIMED', 'COMPLETED']).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
});

const getListingsSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).default(10000).optional(), // Default 10km
  category: z.enum(['CLOTHING', 'ELECTRONICS', 'FOOD', 'FURNITURE', 'BOOKS', 'HOUSEHOLD', 'SPECIAL_REQUEST']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});

// Create a listing (Donor or Acceptor only)
export const createListing = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string }; // From JWT middleware
    if (user.role === 'ADMIN') {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Admins cannot create listings' });
    }

    const validated = createListingSchema.parse(req.body);
    const { title, description, category, longitude, latitude } = validated;

    const listing = await prisma.listing.create({
      data: {
        userId: user.id,
        title,
        description,
        category,
        
      },
    });

    // Set location if provided
    if (longitude && latitude || user) {
      await prisma.$executeRaw`
        UPDATE "Listing"
        SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        WHERE id = ${listing.id}
      `;
    }

    // Log the action
    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Created listing: ${title}`,
      },
    });

    res.status(StatusCodes.CREATED).json(listing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create listing' });
  }
};

// Get listings (with optional geospatial and category filtering)
export const getListings = async (req: Request, res: Response) => {
  try {
    const validated = getListingsSchema.parse(req.query);
    const { latitude, longitude, radius, category, page, limit } = validated;
    const skip = (page - 1) * limit;

    let listings;
    let totalItems;

    if (latitude && longitude && radius) {
      // Geospatial query with radius
      listings = await prisma.$queryRaw`
        SELECT id, userId, title, description, category, status, createdAt, updatedAt, ST_AsText(location) as location
        FROM "Listing"
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${radius}
        )
        ${category ? `AND category = ${category}::"Category"` : ''}
        AND status = 'ACTIVE'
        ORDER BY createdAt DESC
        OFFSET ${skip} LIMIT ${limit}
      `;
      const totalItemsResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM "Listing"
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${radius}
        )
        ${category ? `AND category = ${category}::"Category"` : ''}
        AND status = 'ACTIVE'
      `;
      totalItems = Number(totalItemsResult[0]?.count ?? 0);
    } else {
      // Non-geospatial query
      listings = await prisma.listing.findMany({
        where: { status: 'ACTIVE', ...(category && { category }) },
        include: { user: { select: { fname: true, lname: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      totalItems = await prisma.listing.count({
        where: { status: 'ACTIVE', ...(category && { category }) },
      });
    }

    res.status(StatusCodes.OK).json({
      data: listings,
      meta: {
        totalItems: Number(totalItems),
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    console.error('Error fetching listings:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch listings' });
  }
};

// Get a single listing by ID
export const getListingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { fname: true, lname: true, email: true } } },
    });

    if (!listing) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Listing not found' });
    }

    // Fetch location as WKT (Well-Known Text)
    const locationResult = await prisma.$queryRaw<
      Array<{ location: string | null }>
    >`SELECT ST_AsText(location) as location FROM "Listing" WHERE id = ${listing.id}`;
    const location = locationResult[0]?.location ?? null;

    res.status(StatusCodes.OK).json({
      ...listing,
      location,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch listing' });
  }
};

// Update a listing (Donor/Acceptor for own listings, Admin for any)
export const updateListing = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    const { id } = req.params;
    const validated = updateListingSchema.parse(req.body);
    const { title, description, category, status, longitude, latitude } = validated;

    const listing = await prisma.listing.findUnique({ where: { id: parseInt(id) } });
    if (!listing) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Listing not found' });
    }
    if (user.role !== 'ADMIN' && listing.userId !== user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Unauthorized to update this listing' });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: parseInt(id) },
      data: { title, description, category, status },
    });

    // Update location if provided
    if (longitude && latitude) {
      await prisma.$executeRaw`
        UPDATE "Listing"
        SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        WHERE id = ${updatedListing.id}
      `;
    }

    // Log the action
    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Updated listing: ${title || listing.title}`,
      },
    });

    res.status(StatusCodes.OK).json(updatedListing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update listing' });
  }
};

// Delete a listing (Donor/Acceptor for own listings, Admin for any)
export const deleteListing = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id: parseInt(id) } });
    if (!listing) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Listing not found' });
    }
    if (user.role !== 'ADMIN' && listing.userId !== user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Unauthorized to delete this listing' });
    }

    await prisma.listing.delete({ where: { id: parseInt(id) } });

    // Log the action
    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Deleted listing: ${listing.title}`,
      },
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete listing' });
  }
};