import nodemailer, { Transporter } from 'nodemailer';

// Validate environment variables
if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
  throw new Error('Missing SMTP configuration in environment variables');
}

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendOtpEmail = async (to: string, otp: string): Promise<string> => {
  try {
    await transporter.sendMail({
      from: `"Parking System" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Your OTP code is <strong>${otp}</strong>.</p>
          <p>It expires in 10 minutes.</p>
          <p style="color: #666;">Thank you for using our parking system.</p>
        </div>
      `,
    });
    console.log(`OTP email sent to ${to}`);
    return 'sent';
  } catch (error) {
    console.error(`Failed to send OTP email to ${to}:`, error);
    return 'failed';
  }
};
