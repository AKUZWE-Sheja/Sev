import { Router, Request, Response, NextFunction } from 'express';
import { getUsers, updateUser, updateUserLocation, changePassword, deleteUser } from '../controllers/userController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users with pagination and search (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           default: ''
 *         description: Search term for fname, lname, or email
 *     responses:
 *       200:
 *         description: List of users
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
 *                       id: { type: integer, description: 'User ID' }
 *                       fname: { type: string, description: 'First name' }
 *                       lname: { type: string, description: 'Last name' }
 *                       email: { type: string, description: 'Email address' }
 *                       address: { type: string, description: 'User address' }
 *                       role: { type: string, enum: [DONOR, ACCEPTOR, ADMIN], description: 'User role' }
 *                       isVerified: { type: boolean, description: 'Verification status' }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer, description: 'Total number of users' }
 *                     currentPage: { type: integer, description: 'Current page number' }
 *                     totalPages: { type: integer, description: 'Total number of pages' }
 *                     limit: { type: integer, description: 'Items per page' }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.get('/', authenticate, isAdmin, asyncHandler(getUsers));

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update authenticated user's information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fname: { type: string, description: 'First name' }
 *               lname: { type: string, description: 'Last name' }
 *               email: { type: string, description: 'Email address' }
 *               address: { type: string, description: 'User address' }
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, description: 'User ID' }
 *                 fname: { type: string, description: 'First name' }
 *                 lname: { type: string, description: 'Last name' }
 *                 email: { type: string, description: 'Email address' }
 *                 address: { type: string, description: 'User address' }
 *                 role: { type: string, enum: [DONOR, ACCEPTOR, ADMIN], description: 'User role' }
 *                 isVerified: { type: boolean, description: 'Verification status' }
 *       400: { description: Invalid input or email already in use }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.put('/me', authenticate, asyncHandler(updateUser));

/**
 * @swagger
 * /api/users/me/location:
 *   put:
 *     summary: Update the authenticated user's location
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [longitude, latitude]
 *             properties:
 *               longitude: { type: number, minimum: -180, maximum: 180, description: 'Longitude for user location' }
 *               latitude: { type: number, minimum: -90, maximum: 90, description: 'Latitude for user location' }
 *     responses:
 *       200:
 *         description: Location updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, description: 'Success message' }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.put('/me/location', authenticate, asyncHandler(updateUserLocation));

/**
 * @swagger
 * /api/users/me/change-password:
 *   post:
 *     summary: Initiate or complete password change with OTP
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, description: 'Current password' }
 *               newPassword: { type: string, description: 'New password (minimum 8 characters)' }
 *     responses:
 *       200:
 *         description: OTP sent or password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, description: 'Success message' }
 *       400: { description: Invalid input, invalid current password, or invalid/expired OTP }
 *       401: { description: Unauthorized }
 *       404: { description: User not found }
 *       500: { description: Server error }
 */
router.post('/me/change-password', authenticate, asyncHandler(changePassword));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, description: 'Success message' }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.delete('/:id', authenticate, isAdmin, asyncHandler(deleteUser));

export default router;