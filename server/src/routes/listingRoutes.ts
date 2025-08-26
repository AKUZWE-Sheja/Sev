import { Router } from 'express';
import { createListing, getListings, getListingById, updateListing, deleteListing } from '../controllers/listingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Helper to wrap async route handlers
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
	Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create a new listing (Donor or Acceptor only)
 *     tags: [Listings]
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
 *               longitude: { type: number, minimum: -180, maximum: 180 }
 *               latitude: { type: number, minimum: -90, maximum: 90 }
 *     responses:
 *       201:
 *         description: Listing created
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
 *                 status: { type: string }
 *                 updatedAt: { type: string, format: date-time }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       500: { description: Server error }
 */
router.post('/', authenticate, asyncHandler(createListing));

/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: List all active listings with optional filtering
 *     tags: [Listings]
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
 *         description: List of active listings
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
router.get('/', asyncHandler(getListings));

/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Get a listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing details
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
 *       404: { description: Listing not found }
 *       500: { description: Server error }
 */
router.get('/:id', asyncHandler(getListingById));

/**
 * @swagger
 * /api/listings/{id}:
 *   put:
 *     summary: Update a listing (Owner or Admin only)
 *     tags: [Listings]
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
 *               status: { type: string, enum: [ACTIVE, CLAIMED, COMPLETED] }
 *               longitude: { type: number, minimum: -180, maximum: 180 }
 *               latitude: { type: number, minimum: -90, maximum: 90 }
 *     responses:
 *       200:
 *         description: Listing updated
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
 *                 status: { type: string }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Listing not found }
 *       500: { description: Server error }
 */
router.put('/:id', authenticate, asyncHandler(updateListing));

/**
 * @swagger
 * /api/listings/{id}:
 *   delete:
 *     summary: Delete a listing (Owner or Admin only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204: { description: Listing deleted }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Listing not found }
 *       500: { description: Server error }
 */
router.delete('/:id', authenticate, asyncHandler(deleteListing));

export default router;