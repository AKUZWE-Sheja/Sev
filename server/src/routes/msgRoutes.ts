import { Router, Request, Response, NextFunction } from 'express';
import { sendMessage, getMessages } from '../controllers/msgsController';
import { authenticate } from '../middleware/auth';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message to another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, content]
 *             properties:
 *               receiverId: { type: integer, description: 'ID of the recipient user' }
 *               content: { type: string, description: 'Message content' }
 *               listingId: { type: integer, description: 'Optional ID of the associated listing' }
 *               requestId: { type: integer, description: 'Optional ID of the associated request' }
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, description: 'Message ID' }
 *                 senderId: { type: integer, description: 'Sender user ID' }
 *                 receiverId: { type: integer, description: 'Receiver user ID' }
 *                 content: { type: string, description: 'Message content' }
 *                 listingId: { type: integer, nullable: true, description: 'Associated listing ID' }
 *                 requestId: { type: integer, nullable: true, description: 'Associated request ID' }
 *                 createdAt: { type: string, format: date-time, description: 'Message creation timestamp' }
 *                 sender: 
 *                   type: object
 *                   properties:
 *                     id: { type: integer, description: 'Sender ID' }
 *                     fname: { type: string, description: 'Sender first name' }
 *                     lname: { type: string, description: 'Sender last name' }
 *                     email: { type: string, description: 'Sender email' }
 *                 receiver:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, description: 'Receiver ID' }
 *                     fname: { type: string, description: 'Receiver first name' }
 *                     lname: { type: string, description: 'Receiver last name' }
 *                     email: { type: string, description: 'Receiver email' }
 *       400: { description: Invalid input, cannot message self, or invalid listing/request ID }
 *       401: { description: Unauthorized }
 *       404: { description: Receiver or listing/request not found }
 *       500: { description: Server error }
 */
router.post('/', authenticate, asyncHandler(sendMessage));

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Retrieve authenticated user's messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: listingId
 *         schema:
 *           type: integer
 *         description: Filter messages by listing ID
 *       - in: query
 *         name: requestId
 *         schema:
 *           type: integer
 *         description: Filter messages by request ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer, description: 'Message ID' }
 *                       senderId: { type: integer, description: 'Sender user ID' }
 *                       receiverId: { type: integer, description: 'Receiver user ID' }
 *                       content: { type: string, description: 'Message content' }
 *                       listingId: { type: integer, nullable: true, description: 'Associated listing ID' }
 *                       requestId: { type: integer, nullable: true, description: 'Associated request ID' }
 *                       createdAt: { type: string, format: date-time, description: 'Message creation timestamp' }
 *                       sender:
 *                         type: object
 *                         properties:
 *                           id: { type: integer, description: 'Sender ID' }
 *                           fname: { type: string, description: 'Sender first name' }
 *                           lname: { type: string, description: 'Sender last name' }
 *                           email: { type: string, description: 'Sender email' }
 *                       receiver:
 *                         type: object
 *                         properties:
 *                           id: { type: integer, description: 'Receiver ID' }
 *                           fname: { type: string, description: 'Receiver first name' }
 *                           lname: { type: string, description: 'Receiver last name' }
 *                           email: { type: string, description: 'Receiver email' }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer, description: 'Total number of messages' }
 *                     currentPage: { type: integer, description: 'Current page number' }
 *                     totalPages: { type: integer, description: 'Total number of pages' }
 *                     limit: { type: integer, description: 'Messages per page' }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.get('/', authenticate, asyncHandler(getMessages));

export default router;