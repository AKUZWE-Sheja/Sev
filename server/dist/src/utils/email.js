"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = exports.sendRejectionEmail = exports.sendApprovalEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});
const sendApprovalEmail = async (to, slotNumber) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to,
            subject: 'Parking Slot Request Approved',
            text: `Your request has been approved. Assigned slot: ${slotNumber}`,
        });
        return 'sent';
    }
    catch (error) {
        console.error('Email error:', error);
        return 'failed';
    }
};
exports.sendApprovalEmail = sendApprovalEmail;
const sendRejectionEmail = async (to, reason) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to,
            subject: 'Parking Slot Request Rejected',
            text: `Your request was rejected. Reason: ${reason}`,
        });
        return 'sent';
    }
    catch (error) {
        console.error('Email error:', error);
        return 'failed';
    }
};
exports.sendRejectionEmail = sendRejectionEmail;
const sendOtpEmail = async (to, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
        });
        return 'sent';
    }
    catch (error) {
        console.error('Email error:', error);
        return 'failed';
    }
};
exports.sendOtpEmail = sendOtpEmail;
