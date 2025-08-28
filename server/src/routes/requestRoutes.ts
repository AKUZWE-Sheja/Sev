import { Router, Request, Response, NextFunction } from 'express';
import { createRequest, getRequests, getRequestById, updateRequest, deleteRequest } from '../controllers/requestsController';
import { authenticate, isAcceptor } from '../middleware/auth';

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
 *               title: { type: string, description: 'Title of the request' }
 *               description: { type: string, description: 'Optional description of the request' }
 *               category: { type: string, enum: [CLOTHING, ELECTRONICS, FOOD, FURNITURE, BOOKS, HOUSEHOLD, SPECIAL_REQUEST], description: 'Category of the request' }
 *               quantity: { type: integer, minimum: 1, description: 'Optional quantity needed' }
 *               longitude: { type: number, minimum: -180, maximum: 180, description: 'Optional longitude for request location' }
 *               latitude: { type: number, minimum: -90, maximum: 90, description: 'Optional latitude for request location' }
 *     responses:
 *       201:
 *         description: Request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, description: 'Request ID' }
 *                 userId: { type: integer, description: 'ID of the user who created the request' }
 *                 title: { type: string, description: 'Title of the request' }
 *                 description: { type: string, description: 'Description of the request' }
 *                 category: { type: string, description: 'Category of the request' }
 *                 quantity: { type: integer, description: 'Quantity needed' }
 *                 status: { type: string, description: 'Status of the request (OPEN, FULFILLED, CLOSED)' }
 *                 createdAt: { type: string, format: date-time, description: 'Creation timestamp' }
 *                 updatedAt: { type: string, format: date-time, description: 'Last update timestamp' }
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude for geospatial filtering (optional, requires longitude; uses profile location if omitted)
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude for geospatial filtering (optional, requires latitude; uses profile location if omitted)
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           minimum: 0
 *           default: 10000
 *         description: Radius in meters for geospatial filtering (optional; requires latitude/longitude or profile location)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [CLOTHING, ELECTRONICS, FOOD, FURNITURE, BOOKS, HOUSEHOLD, SPECIAL_REQUEST]
 *         description: Filter by category (optional)
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
 *         description: Number of items per page
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
 *                       id: { type: integer, description: 'Request ID' }
 *                       userId: { type: integer, description: 'ID of the user who created the request' }
 *                       title: { type: string, description: 'Title of the request' }
 *                       description: { type: string, description: 'Description of the request' }
 *                       category: { type: string, description: 'Category of the request' }
 *                       quantity: { type: integer, description: 'Quantity needed' }
 *                       status: { type: string, description: 'Status of the request' }
 *                       location: { type: string, description: 'Location as WKT string (e.g., POINT(longitude latitude)), included for geospatial queries' }
 *                       createdAt: { type: string, format: date-time, description: 'Creation timestamp' }
 *                       updatedAt: { type: string, format: date-time, description: 'Last update timestamp' }
 *                       user:
 *                         type: object
 *                         properties:
 *                           fname: { type: string, description: 'First name of the user' }
 *                           lname: { type: string, description: 'Last name of the user' }
 *                           email: { type: string, description: 'Email of the user' }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer, description: 'Total number of requests' }
 *                     currentPage: { type: integer, description: 'Current page number' }
 *                     totalPages: { type: integer, description: 'Total number of pages' }
 *                     limit: { type: integer, description: 'Items per page' }
 *                     usingUserLocation: { type: boolean, description: 'Whether the user’s profile location was used' }
 *                     searchLatitude: { type: number, description: 'Latitude used for search (if applicable)' }
 *                     searchLongitude: { type: number, description: 'Longitude used for search (if applicable)' }
 *                     radius: { type: number, description: 'Radius used for search (if applicable)' }
 *       400: { description: Invalid query parameters (e.g., radius provided without latitude/longitude and no profile location) }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.get('/', authenticate, asyncHandler(getRequests));

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
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, description: 'Request ID' }
 *                 userId: { type: integer, description: 'ID of the user who created the request' }
 *                 title: { type: string, description: 'Title of the request' }
 *                 description: { type: string, description: 'Description of the request' }
 *                 category: { type: string, description: 'Category of the request' }
 *                 quantity: { type: integer, description: 'Quantity needed' }
 *                 status: { type: string, description: 'Status of the request' }
 *                 location: { type: string, description: 'Location as WKT string (e.g., POINT(longitude latitude))' }
 *                 createdAt: { type: string, format: date-time, description: 'Creation timestamp' }
 *                 updatedAt: { type: string, format: date-time, description: 'Last update timestamp' }
 *                 user:
 *                   type: object
 *                   properties:
 *                     fname: { type: string, description: 'First name of the user' }
 *                     lname: { type: string, description: 'Last name of the user' }
 *                     email: { type: string, description: 'Email of the user' }
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
 *         description: Request ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, description: 'Title of the request' }
 *               description: { type: string, description: 'Optional description of the request' }
 *               category: { type: string, enum: [CLOTHING, ELECTRONICS, FOOD, FURNITURE, BOOKS, HOUSEHOLD, SPECIAL_REQUEST], description: 'Category of the request' }
 *               quantity: { type: integer, minimum: 1, description: 'Optional quantity needed' }
 *               status: { type: string, enum: [OPEN, FULFILLED, CLOSED], description: 'Status of the request' }
 *               longitude: { type: number, minimum: -180, maximum: 180, description: 'Optional longitude for request location' }
 *               latitude: { type: number, minimum: -90, maximum: 90, description: 'Optional latitude for request location' }
 *     responses:
 *       200:
 *         description: Request updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, description: 'Request ID' }
 *                 userId: { type: integer, description: 'ID of the user who created the request' }
 *                 title: { type: string, description: 'Title of the request' }
 *                 description: { type: string, description: 'Description of the request' }
 *                 category: { type: string, description: 'Category of the request' }
 *                 quantity: { type: integer, description: 'Quantity needed' }
 *                 status: { type: string, description: 'Status of the request' }
 *                 createdAt: { type: string, format: date-time, description: 'Creation timestamp' }
 *                 updatedAt: { type: string, format: date-time, description: 'Last update timestamp' }
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
 *         description: Request ID
 *     responses:
 *       204: { description: Request deleted }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.delete('/:id', authenticate, asyncHandler(deleteRequest));

export default router;