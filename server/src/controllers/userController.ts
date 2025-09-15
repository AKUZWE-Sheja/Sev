import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { sendOtpEmail } from '../utils/email';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

// Validation schemas
const updateUserSchema = z.object({
  fname: z.string().min(1, 'First name is required').optional(),
  lname: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email').optional(),
  address: z.string().min(1, 'Address is required').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const updateLocationSchema = z.object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  });

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        fname: true,
        lname: true,
        email: true,
        role: true,
        address: true,
        createdAt: true,
        isVerified: true
      },
    });

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
      return;
    }

    const locationResult = await prisma.$queryRaw<
          Array<{ location: string | null }>
        >`SELECT ST_AsText(location) as location FROM "User" WHERE id = ${user.id}`;
        let location: { longitude: number; latitude: number } | null = null;
        const locStr = locationResult[0]?.location;
        if (locStr) {
          const match = locStr.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
          if (match) {
            location = { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
       }
    }
    
    res.json({
      ...user,
      location,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '10', search = '' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  const searchQuery = search as string;

  try {
    const where = {
      OR: [
        { fname: { contains: searchQuery, mode: 'insensitive' as const } },
        { lname: { contains: searchQuery, mode: 'insensitive' as const } },
        { email: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    };

    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: 'asc' },
        select: { id: true, fname: true, lname: true, email: true, role: true, isVerified: true },
      }),
      prisma.user.count({ where }),
    ]);

    // Fetch locations for these users
    const userIds = users.map(u => u.id);
    const locationsRaw = await prisma.$queryRaw<Array<{ id: number; location: string | null }>>`
      SELECT id, ST_AsText(location) as location FROM "User" WHERE id IN (${Prisma.join(userIds)})
    `;

    // Map userId to parsed location
    const locationMap: Record<number, { longitude: number; latitude: number } | null> = {};
    locationsRaw.forEach(({ id, location }) => {
      if (location) {
        const match = location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
        if (match) {
          locationMap[id] = {
            longitude: parseFloat(match[1]),
            latitude: parseFloat(match[2]),
          };
        } else {
          locationMap[id] = null;
        }
      } else {
        locationMap[id] = null;
      }
    });

    // Attach location to each user
    const usersWithLocation = users.map(u => ({
      ...u,
      location: locationMap[u.id] || null,
    }));

    await prisma.log.create({
      data: { userId: req.user?.id, action: 'Users list viewed' },
    });

    res.json({
      data: usersWithLocation,
      meta: {
        totalItems,
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id, 10) } });
    await prisma.log.create({
      data: { userId: req.user?.id, action: `User ${id} deleted` },
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user as { id: number; role: string };
  const validated = updateUserSchema.parse(req.body);
  const { fname, lname, email, address } = validated;

  try {
    // Fetch current user data
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fname: true, lname: true, email: true, address: true },
    });
    if (!dbUser) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
      return;
    }

    // Check if provided fields are identical to current values
    const noChanges =
      (!fname || fname === dbUser.fname) &&
      (!lname || lname === dbUser.lname) &&
      (!email || email === dbUser.email) &&
      (!address || address === dbUser.address);

    if (noChanges) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'No changes provided to update' });
      return;
    }

    // Check email uniqueness if email is provided and different
    if (email && email !== dbUser.email) {
      const existingUser = await prisma.user.findFirst({ where: { email, NOT: { id: user.id } } });
      if (existingUser) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: 'Email already in use' });
        return;
      }
    }
    // Perform update
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { fname, lname, email, address },
      select: { id: true, fname: true, lname: true, email: true, role: true, isVerified: true, address: true },
    });

    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Updated user info: ${JSON.stringify({ fname, lname, email, address })}`,
      },
    });

    res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
      return;
    }
    console.error('Error updating user:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update user' });
  }
};

export const updateUserLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user as { id: number; role: string };

  const { longitude, latitude } = updateLocationSchema.parse(req.body);
  try {
    await prisma.$executeRaw`
      UPDATE "User"
      SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      WHERE id = ${user.id}
    `;

    await prisma.log.create({
      data: {
        userId: user.id,
        action: `Updated user location: POINT(${longitude} ${latitude})`,
      },
    });

    res.status(StatusCodes.OK).json({ message: 'Location updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
      return;
    }
    console.error('Error updating user location:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update location' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user as { id: number; role: string };
    const validated = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validated;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isPasswordValid) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid current password' });
      return;
    }

    // Check if new password is the same as current password
    const isSamePassword = await bcrypt.compare(newPassword, dbUser.password);
    if (isSamePassword) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'New password must be different from the current password' });
      return;
    }

    // Generate and store OTP, set isVerified to false
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword ,otp: otpCode, otpExpiresAt: expiresAt, isVerified: false },
    });

    // Send OTP email
    await sendOtpEmail(dbUser.email, otpCode);

    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'Password change OTP generated, isVerified set to false',
      },
    });

    res.status(StatusCodes.OK).json({ message: 'OTP sent', userId: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.errors });
      return;
    }
    console.error('Error initiating password change:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to initiate password change' });
  }
};