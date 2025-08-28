import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

// Validation schemas
const sendMessageSchema = z.object({
  receiverId: z.number().int().positive('Receiver ID must be a positive integer'),
  content: z.string().min(1, 'Message content is required'),
  listingId: z.number().int().positive('Listing ID must be a positive integer').optional(),
  requestId: z.number().int().positive('Request ID must be a positive integer').optional(),
});

const getMessagesSchema = z.object({
  listingId: z.number().int().positive('Listing ID must be a positive integer').optional(),
  requestId: z.number().int().positive('Request ID must be a positive integer').optional(),
  page: z.string().optional().default('1').transform((val) => parseInt(val, 10)),
  limit: z.string().optional().default('10').transform((val) => parseInt(val, 10)),
});

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sender = req.user as { id: number; role: string };
    const validated = sendMessageSchema.parse(req.body);
    const { receiverId, content, listingId, requestId } = validated;

    // Prevent sending message to self
    if (sender.id === receiverId) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: 'Cannot send message to yourself' });
        return;
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
        res.status(StatusCodes.NOT_FOUND).json({ error: 'Receiver not found' });
        return;
    }

    // Validate listingId if provided
    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) {
          res.status(StatusCodes.NOT_FOUND).json({ error: 'Listing not found' });
          return;
      }
    }

    // Validate requestId if provided
    if (requestId) {
      const request = await prisma.request.findUnique({ where: { id: requestId } });
      if (!request) {
          res.status(StatusCodes.NOT_FOUND).json({ error: 'Request not found' });
          return;
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: sender.id,
        receiverId,
        content,
        listingId,
        requestId,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        listingId: true,
        requestId: true,
        createdAt: true,
        sender: { select: { id: true, fname: true, lname: true, email: true } },
        receiver: { select: { id: true, fname: true, lname: true, email: true } },
      },
    });

    await prisma.log.create({
      data: {
        userId: sender.id,
        action: `Sent message to user ${receiverId}${listingId ? ` for listing ${listingId}` : ''}${requestId ? ` for request ${requestId}` : ''}`,
      },
    });

    res.status(StatusCodes.CREATED).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
        return;
    }
    console.error('Error sending message:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to send message' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user as { id: number; role: string };
    const { listingId, requestId, page, limit } = getMessagesSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
      ],
      ...(listingId ? { listingId } : {}),
      ...(requestId ? { requestId } : {}),
    };

    const [messages, totalItems] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          listingId: true,
          requestId: true,
          createdAt: true,
          sender: { select: { id: true, fname: true, lname: true, email: true } },
          receiver: { select: { id: true, fname: true, lname: true, email: true } },
        },
      }),
      prisma.message.count({ where }),
    ]);

    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Viewed messages${listingId ? ` for listing ${listingId}` : ''}${requestId ? ` for request ${requestId}` : ''}`,
      },
    });

    res.status(StatusCodes.OK).json({
      data: messages,
      meta: {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        limit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
        return;
    }
    console.error('Error retrieving messages:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to retrieve messages' });
  }
};