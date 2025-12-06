const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return null;
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  if (process.env.EMAIL_SERVICE === 'smtp') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return null;
    }
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  return null;
};

const sendOtpEmail = async (email, otpCode, purpose = 'email_verification') => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    let subject = 'Your OTP Code';
    let htmlContent = '';

    if (purpose === 'email_verification') {
      subject = 'Verify Your Email - OTP Code';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Email Verification</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Thank you for registering! Please use the OTP code below to verify your email address:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h2 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">${otpCode}</h2>
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 2 hours.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `;
    } else if (purpose === 'password_reset') {
      subject = 'Reset Your Password - OTP Code';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">You requested to reset your password. Please use the OTP code below:</p>
            <div style="background: white; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h2 style="color: #f5576c; font-size: 36px; letter-spacing: 5px; margin: 0;">${otpCode}</h2>
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 2 hours.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail
};
