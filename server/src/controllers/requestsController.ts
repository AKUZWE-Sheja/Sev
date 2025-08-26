import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

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
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).default(10000), // Default 10km
  category: z.enum(['CLOTHING', 'ELECTRONICS', 'FOOD', 'FURNITURE', 'BOOKS', 'HOUSEHOLD', 'SPECIAL_REQUEST']).optional(),
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

    // Set location if provided
    if (longitude && latitude) {
      await prisma.$executeRaw`
        UPDATE "Request"
        SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        WHERE id = ${request.id}
      `;
    }

    // Log the action
    await prisma.log.create({
      data: {
        userId: user.id,
        action:`Created request: ${title}`,
      },
    });

    res.status(StatusCodes.CREATED).json(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create request' });
  }
};

// Get requests (with optional geospatial and category filtering)
export const getRequests = async (req: Request, res: Response) => {
  try {
    const validated = getRequestsSchema.parse(req.query);
    const { latitude, longitude, radius, category } = validated;

    let requests;
    if (latitude && longitude) {
      requests = await prisma.$queryRaw`
        SELECT id, userId, title, description, category, quantity, status, createdAt, updatedAt, ST_AsText(location) as location
        FROM "Request"
        WHERE ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${radius}
        )
        ${category ? `AND category = ${category}::"Category"` : ''}
        AND status = 'OPEN'
      `;
    } else {
      requests = await prisma.request.findMany({
        where: { status: 'OPEN', ...(category && { category }) },
        include: { user: { select: { fname: true, lname: true, email: true } } },
      });
    }

    res.status(StatusCodes.OK).json(requests);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
    }
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
    
    // Fetch location as WKT (Well-Known Text)
    const locationResult = await prisma.$queryRaw<
      Array<{ location: string | null }>
    >`SELECT ST_AsText(location) as location FROM "Listing" WHERE id = ${request.id}`;
    const location = locationResult[0]?.location ?? null;  

    res.status(StatusCodes.OK).json({
      ...request,
      location
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

    // Update location if provided
    if (longitude && latitude) {
      await prisma.$executeRaw`
        UPDATE "Request"
        SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        WHERE id = ${updatedRequest.id}
      `;
    }

    // Log the action
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

    // Log the action
    await prisma.log.create({
      data: {
        userId: user.id,
        action:`Deleted request: ${request.title}`,
      },
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete request' });
  }
};