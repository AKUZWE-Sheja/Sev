import { Router } from 'express';
import { createRequest, getRequests, getRequestById, updateRequest, deleteRequest } from '../controllers/requestsController';
import { authenticate, isAdmin, isAcceptor } from '../middleware/auth';

const router = Router();

// Helper to wrap async route handlers
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
	Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new request (Acceptor only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string, enum: [CLOTHING, ELECTRONICS, FOOD, FURNITURE, BOOKS, HOUSEHOLD, SPECIAL_REQUEST] }
 *               quantity: { type: integer, minimum: 1 }
 *               longitude: { type: number, minimum: -180, maximum: 180 }
 *               latitude: { type: number, minimum: -90, maximum: 90 }
 *     responses:
 *       201:
 *         description: Request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 userId: { type: integer }
 *                 title: { type: string }
 *                 description: { type: string }
 *                 category: { type: string }
 *                 quantity: { type: integer }
 *                 status: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Server error }
 */
router.post('/', authenticate, isAcceptor, asyncHandler(createRequest));

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: List all open requests with optional filtering
 *     tags: [Requests]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10000
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [CLOTHING, ELECTRONICS, FOOD, FURNITURE, BOOKS, HOUSEHOLD, SPECIAL_REQUEST]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of open requests
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
 *                       id: { type: integer }
 *                       userId: { type: integer }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       category: { type: string }
 *                       quantity: { type: integer }
 *                       status: { type: string }
 *                       location: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *                       updatedAt: { type: string, format: date-time }
 *                       user:
 *                         type: object
 *                         properties:
 *                           fname: { type: string }
 *                           lname: { type: string }
 *                           email: { type: string }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer }
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     limit: { type: integer }
 *       400: { description: Invalid query parameters }
 *       500: { description: Server error }
 */
router.get('/', asyncHandler(getRequests));

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get a request by ID
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 userId: { type: integer }
 *                 title: { type: string }
 *                 description: { type: string }
 *                 category: { type: string }
 *                 quantity: { type: integer }
 *                 status: { type: string }
 *                 location: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *                 user:
 *                   type: object
 *                   properties:
 *                     fname: { type: string }
 *                     lname: { type: string }
 *                     email: { type: string }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.get('/:id', asyncHandler(getRequestById));

/**
 * @swagger
 * /api/requests/{id}:
 *   put:
 *     summary: Update a request (Acceptor or Admin only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string, enum: [CLOTHING, ELECTRONICS, FOOD, FURNITURE, BOOKS, HOUSEHOLD, SPECIAL_REQUEST] }
 *               quantity: { type: integer, minimum: 1 }
 *               status: { type: string, enum: [OPEN, FULFILLED, CLOSED] }
 *               longitude: { type: number, minimum: -180, maximum: 180 }
 *               latitude: { type: number, minimum: -90, maximum: 90 }
 *     responses:
 *       200:
 *         description: Request updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 userId: { type: integer }
 *                 title: { type: string }
 *                 description: { type: string }
 *                 category: { type: string }
 *                 quantity: { type: integer }
 *                 status: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.put('/:id', authenticate, asyncHandler(updateRequest));

/**
 * @swagger
 * /api/requests/{id}:
 *   delete:
 *     summary: Delete a request (Acceptor or Admin only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204: { description: Request deleted }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.delete('/:id', authenticate, asyncHandler(deleteRequest));

export default router;