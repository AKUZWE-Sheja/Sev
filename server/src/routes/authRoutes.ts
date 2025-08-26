import { Router } from 'express';
import { register, login, verifyOtp, resendOtp } from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user with OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fname: 
 *                 type: string
 *                 example: John
 *               lname: 
 *                 type: string
 *                 example: Doe
 *               email: 
 *                 type: string
 *                 example: user@example.com
 *               password: 
 *                 type: string
 *                 example: Password123
 *               role: 
 *                 type: enum
 *                 enum: [DONOR, ACCEPTOR]
 *                 example: DONOR
 *               address: 
 *                 type: string
 *                 example: 123 Main St, City, Country
 *     responses:
 *       201:
 *         description: User registered, OTP sent
 *       400:
 *         description: Invalid input or email exists
 *       500:
 *         description: Server error
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for user registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: 
 *                 type: integer
 *                 example: 1
 *               otpCode: 
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP for user registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: 
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: User not found or already verified
 *       500:
 *         description: Server error
 */
router.post('/resend-otp', resendOtp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: 
 *                 type: string
 *                 example: user@example.com
 *               password: 
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: 
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: 
 *                       type: integer
 *                     name: 
 *                       type: string
 *                     email: 
 *                       type: string
 *                     role: 
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified
 *       500:
 *         description: Server error
 */
router.post('/login', login);

export default router;