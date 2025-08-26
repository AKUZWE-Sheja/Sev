import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../utils/email';
import { z } from 'zod';

// Making a prisma client to navigate the DB
const prisma = new PrismaClient();

// Using Zod for input validation

// Input validation schemas
const registerSchema = z.object({
  fname: z.string().min(1, 'First name is required'),
  lname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().min(1, 'Address is required'),
  role: z.enum(['DONOR', 'ACCEPTOR']),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  userId: z.number().int().positive('Invalid user ID'),
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
});

// registering a new user and sending OTP
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // validating request body
    const { fname, lname, email, password, role, address } = registerSchema.parse(req.body);

    // checking if emmial is already taken
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    // Hashing password and generating OTP on random digs
    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // using prisma to save user to DB
    const user = await prisma.user.create({
      data: {
        fname,
        lname,
        email,
        password: hashedPassword,
        otp: otpCode,
        otpExpiresAt,
        address,
        role
      },
    });

    // sending OTP email
    await sendOtpEmail(email, otpCode);
    res.status(201).json({ message: 'User registered, OTP sent', userId: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // validation error sending
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error(error); // logging errors
    res.status(500).json({ error: 'Server error' });
  }
};

// user must verify OTP to complete registration so here it is
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    // validating request body
    const { userId, otpCode } = otpSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isVerified) {
      res.status(400).json({ error: 'User not found or already verified' });
      return;
    }

    // check if OTP is correct & if it hasn't expired yet
    if (user.otp !== otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }

    // Now mark user as verified and clear OTP from DB
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, otp: null, otpExpiresAt: null },
    });

    res.json({ message: 'OTP verified, registration complete' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error(error); // logging errors
    res.status(500).json({ error: 'Server error' });
  }
};

// Resending OTP if needed
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    // validating request body
    const { userId } = z.object({ userId: z.number().int().positive('Invalid user ID') }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isVerified) {
      res.status(400).json({ error: 'User not found or already verified' });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { otp: otpCode, otpExpiresAt },
    });

    await sendOtpEmail(user.email, otpCode);
    res.json({ message: 'OTP resent' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error(error); // logging errors
    res.status(500).json({ error: 'Server error' });
  }
};

// Log in user, issue JWT
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // validating request body
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // checking if user is verifyOtped
    if (!user.isVerified) {
      res.status(403).json({ error: 'Account not verified' });
      return;
    }

    // verify password then generate JWT
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h',
    });

      // Send token and user info
    res.json({
      token,
      user: { id: user.id, name: `${user.fname} ${user.lname}`, email: user.email, role: user.role },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error(error); // logging errors
    res.status(500).json({ error: 'Server error' });
  }
};