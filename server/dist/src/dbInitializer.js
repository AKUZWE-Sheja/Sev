"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function initializeDatabase() {
    try {
        console.log('Initializing database...');
        // Create admin user if not exists
        const adminEmail = 'user@admin.com';
        const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!adminExists) {
            const hashedPassword = await bcrypt_1.default.hash('Admin123', 10);
            await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin',
                    isVerified: true,
                },
            });
            console.log('Admin user created');
        }
        // Seed sample parking slot
        const slotExists = await prisma.parkingSlot.findFirst();
        if (!slotExists) {
            await prisma.parkingSlot.create({
                data: {
                    slotNumber: 'A1',
                    size: 'small',
                    vehicleType: 'car',
                    location: 'West Wing',
                    status: 'available',
                },
            });
            console.log('Sample parking slot created');
        }
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Database initialization error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
initializeDatabase();
