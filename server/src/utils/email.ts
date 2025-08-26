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
      from: `"Community Sharing Platform" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: 'Your Secure Access Code 🌻 | Community Sharing Platform',
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; padding: 0; max-width: 600px; margin: auto; background-color: #F9F1E7; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background: linear-gradient(to right, #F4A261, #E67F22); padding: 25px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 600;">
              <span style="display: inline-block; vertical-align: middle; margin-right: 10px;">🌻</span>
              Sev Sharing Platform
              <span style="display: inline-block; vertical-align: middle; margin-left: 10px;">🌻</span>
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sharing with neighbors, strengthening community</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #333; margin-top: 0; font-weight: 600;">Secure Verification Code</h2>
            <p style="color: #555; margin-bottom: 20px; line-height: 1.6;">You're just one step away from joining our community of givers. Use the verification code below to complete your registration:</p>
            
            <!-- OTP Display -->
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #F9F1E7; color: #F4A261; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 30px; border-radius: 10px; border: 2px dashed #F4A261; box-shadow: 0 4px 10px rgba(244, 162, 97, 0.2);">
                ${otp}
              </div>
            </div>
            
            <!-- Community Info -->
            <div style="background-color: #F9F1E7; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h3 style="color: #E67F22; margin-top: 0;">Welcome to Our Community!</h3>
              <p style="color: #666; margin: 0; line-height: 1.6;">Our platform connects neighbors who want to give items they no longer need to others in their community who can use them - all completely free!</p>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #FFF5EB; padding: 15px; border-radius: 8px; border-left: 4px solid #F4A261; margin: 25px 0;">
              <p style="color: #E67F22; margin: 0; font-weight: 500;">⏰ This code will expire in <strong>10 minutes</strong> for security reasons.</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">If you didn't request this code, please ignore this email or contact our support team.</p>
          </div>
          
          <!-- Footer -->
          <div style="padding: 25px; text-align: center; background-color: #333; color: white; border-top: 4px solid #F4A261;">
            <h3 style="margin: 0 0 15px 0; color: #F4A261;">Building Stronger Communities Together</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Join neighbors in sharing resources and reducing waste</p>
            <p style="margin: 15px 0 5px 0; font-size: 12px; opacity: 0.7;">&copy; ${new Date().getFullYear()} Community Sharing Platform. All rights reserved.</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">Kigali, Rwanda</p>
          </div>
        </div>
      `,
    });
    console.log(`Verification email sent to ${to}`);
    return 'sent';
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    return 'failed';
  }
};