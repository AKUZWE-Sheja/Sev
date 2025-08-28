import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string; location?: { type: 'Point'; coordinates: [number, number] } };
    }
  }
}

const prisma = new PrismaClient();

// Validation schemas
const createRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['CLOTHING', 'ELECTRONICS', 'FOOD', 'FURNITURE', 'BOOKS', 'HOUSEHOLD', 'SPECIAL_REQUEST']),
  quantity: z.number().int().min(1).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
});

const updateRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['CLOTHING', 'ELECTRONICS', 'FOOD', 'FURNITURE', 'BOOKS', 'HOUSEHOLD', 'SPECIAL_REQUEST']).optional(),
  quantity: z.number().int().min(1).optional(),
  status: z.enum(['OPEN', 'FULFILLED', 'CLOSED']).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
});

const getRequestsSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0).default(10000).optional(),
  category: z.enum(['CLOTHING', 'ELECTRONICS', 'FOOD', 'FURNITURE', 'BOOKS', 'HOUSEHOLD', 'SPECIAL_REQUEST']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
}).refine((data) => {
  if (data.radius && data.radius > 0) {
    const hasLat = data.latitude !== undefined;
    const hasLng = data.longitude !== undefined;
    return (hasLat && hasLng) || (!hasLat && !hasLng);
  }
  return true;
}, {
  message: "Either provide both latitude and longitude, or neither (to use your profile location)",
  path: ["radius"],
});

// Create a request (Acceptor only)
export const createRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    if (user.role !== 'ACCEPTOR') {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Only acceptors can create requests' });
    }

    const validated = createRequestSchema.parse(req.body);
    const { title, description, category, quantity, longitude, latitude } = validated;

    const request = await prisma.request.create({
      data: {
        userId: user.id,
        title,
        description,
        category,
        quantity,
      },
    });

    if (longitude && latitude) {
      await prisma.$executeRaw`
        UPDATE "Request"
        SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        WHERE id = ${request.id}
      `;
    }

    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Created request: ${title}`,
      },
    });

    res.status(StatusCodes.CREATED).json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    console.error('Error creating request:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create request' });
  }
};

// Get requests (with optional geospatial and category filtering)
export const getRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    const validated = getRequestsSchema.parse(req.query);
    const { latitude, longitude, radius, category, page, limit } = validated;
    const skip = (page - 1) * limit;

    let requests;
    let totalItems;
    let searchLongitude = longitude;
    let searchLatitude = latitude;
    let usingUserLocation = false;

    // If radius is provided but no coordinates, try to use user's location
    if (radius && radius > 0 && (!latitude || !longitude) && user?.id) {
      const userCoords = await prisma.$queryRaw<Array<{ longitude: number, latitude: number }>>`
        SELECT 
          ST_X(location::geometry) as longitude,
          ST_Y(location::geometry) as latitude
        FROM "User"
        WHERE id = ${user.id}
      `;
      
      if (userCoords.length > 0 && userCoords[0].longitude !== null && userCoords[0].latitude !== null) {
        searchLongitude = userCoords[0].longitude;
        searchLatitude = userCoords[0].latitude;
        usingUserLocation = true;
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          error: 'Radius provided but no location coordinates available. Either provide latitude/longitude parameters or set your profile location.' 
        });
      }
    }

    // If we have coordinates and radius
    if (searchLatitude !== undefined && searchLongitude !== undefined && radius && radius > 0) {
      requests = await prisma.$queryRaw`
        SELECT 
          id, 
          "userId", 
          title, 
          description, 
          category, 
          quantity, 
          status, 
          "createdAt", 
          "updatedAt", 
          ST_AsText(location) as location
        FROM "Request"
        WHERE ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${searchLongitude}, ${searchLatitude}), 4326)::geography,
          ${radius}
        )
        ${category ? Prisma.sql`AND category = ${category}::"Category"` : Prisma.empty}
        AND status = 'OPEN'
        ORDER BY "createdAt" DESC
        OFFSET ${skip} LIMIT ${limit}
      `;
      
      const totalItemsResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM "Request"
        WHERE ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${searchLongitude}, ${searchLatitude}), 4326)::geography,
          ${radius}
        )
        ${category ? Prisma.sql`AND category = ${category}::"Category"` : Prisma.empty}
        AND status = 'OPEN'
      `;
      totalItems = Number(totalItemsResult[0]?.count ?? 0);
    } else {
      // Non-geospatial query
      requests = await prisma.request.findMany({
        where: { 
          status: 'OPEN', 
          ...(category && { category }) 
        },
        include: { 
          user: { 
            select: { 
              fname: true, 
              lname: true, 
              email: true 
            } 
          } 
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      totalItems = await prisma.request.count({
        where: { 
          status: 'OPEN', 
          ...(category && { category }) 
        },
      });
    }

    res.status(StatusCodes.OK).json({
      data: requests,
      meta: {
        totalItems: Number(totalItems),
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit,
        usingUserLocation,
        ...(searchLatitude !== undefined && searchLongitude !== undefined && { 
          searchLatitude, 
          searchLongitude,
          radius: radius || null
        })
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    console.error('Error fetching requests:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch requests' });
  }
};

// Get a single request by ID
export const getRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await prisma.request.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { fname: true, lname: true, email: true } } },
    });

    if (!request) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Request not found' });
    }

    const locationResult = await prisma.$queryRaw<
      Array<{ location: string | null }>
    >`SELECT ST_AsText(location) as location FROM "Request" WHERE id = ${request.id}`;
    const location = locationResult[0]?.location ?? null;

    res.status(StatusCodes.OK).json({
      ...request,
      location,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch request' });
  }
};

// Update a request (Acceptor for own requests, Admin for any)
export const updateRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    const { id } = req.params;
    const validated = updateRequestSchema.parse(req.body);
    const { title, description, category, quantity, status, longitude, latitude } = validated;

    const request = await prisma.request.findUnique({ where: { id: parseInt(id) } });
    if (!request) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Request not found' });
    }
    if (user.role !== 'ADMIN' && request.userId !== user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Unauthorized to update this request' });
    }

    const updatedRequest = await prisma.request.update({
      where: { id: parseInt(id) },
      data: { title, description, category, quantity, status },
    });

    if (longitude && latitude) {
      await prisma.$executeRaw`
        UPDATE "Request"
        SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        WHERE id = ${updatedRequest.id}
      `;
    }

    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Updated request: ${title || request.title}`,
      },
    });

    res.status(StatusCodes.OK).json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update request' });
  }
};

// Delete a request (Acceptor for own requests, Admin for any)
export const deleteRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    const { id } = req.params;

    const request = await prisma.request.findUnique({ where: { id: parseInt(id) } });
    if (!request) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Request not found' });
    }
    if (user.role !== 'ADMIN' && request.userId !== user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Unauthorized to delete this request' });
    }

    await prisma.request.delete({ where: { id: parseInt(id) } });

    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Deleted request: ${request.title}`,
      },
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete request' });
  }
};