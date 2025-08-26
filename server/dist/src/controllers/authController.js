"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.resendOtp = exports.verifyOtp = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../utils/email");
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                otp: otpCode,
                otpExpiresAt,
            },
        });
        await (0, email_1.sendOtpEmail)(email, otpCode);
        res.status(201).json({ message: 'User registered, OTP sent', userId: user.id });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.register = register;
const verifyOtp = async (req, res) => {
    const { userId, otpCode } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.isVerified) {
            res.status(400).json({ error: 'User not found or already verified' });
            return;
        }
        if (user.otp !== otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            res.status(400).json({ error: 'Invalid or expired OTP' });
            return;
        }
        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true, otp: null, otpExpiresAt: null },
        });
        res.json({ message: 'OTP verified, registration complete' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.verifyOtp = verifyOtp;
const resendOtp = async (req, res) => {
    const { userId } = req.body;
    try {
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
        await (0, email_1.sendOtpEmail)(user.email, otpCode);
        res.json({ message: 'OTP resent' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.resendOtp = resendOtp;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        if (!user.isVerified) {
            res.status(403).json({ error: 'Account not verified' });
            return;
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h',
        });
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
