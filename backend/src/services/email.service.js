// backend/src/services/email.service.js
const nodemailer = require('nodemailer');

// ============================================
// EMAIL CONFIGURATION
// ============================================

// Create reusable transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('⚠️  Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Force IPv4 to avoid IPv6 connection issues
    family: 4,
    // Increase timeout for slower connections
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
};

// ============================================
// EMAIL TEMPLATES
// ============================================

const getEmailTemplate = (type, data) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Determine activation URL based on user type
  const getActivationUrl = (userType, token) => {
    switch (userType) {
      case 'super-admin':
        return `${baseUrl}/super-admin/activate?token=${token}`;
      case 'admin':
        return `${baseUrl}/tenant/admin/activate?token=${token}`;
      case 'tea-boy':
        return `${baseUrl}/tenant/tea-boy/activate?token=${token}`;
      default:
        return `${baseUrl}/tenant/admin/activate?token=${token}`;
    }
  };

  const templates = {
    // Account Activation Email (for Super Admin)
    activation: {
      subject: 'Activate Your Account - Tea Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tea Management System!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>Your account has been created successfully. Please activate your account by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${getActivationUrl(data.userType || 'super-admin', data.verificationToken)}" class="button">Activate Account</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${getActivationUrl(data.userType || 'super-admin', data.verificationToken)}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't request this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Tea Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    // Password Reset Email
    passwordReset: {
      subject: 'Reset Your Password - Tea Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              <p style="text-align: center;">
                <a href="${baseUrl}/reset-password?token=${data.resetToken}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #f5576c;">${baseUrl}/reset-password?token=${data.resetToken}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Tea Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    // Welcome Email for New Admin
    welcomeAdmin: {
      subject: 'Welcome to Tea Management System - Admin Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
            .password-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tea Management System!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>An administrator account has been created for you in the Tea Management System.</p>

              <div class="info-box">
                <p><strong>Organization:</strong> ${data.organizationName}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Role:</strong> Administrator</p>
              </div>

              ${data.tempPassword ? `
              <div class="password-box">
                <p><strong>⚠️ Your Temporary Login Credentials:</strong></p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${data.tempPassword}</code></p>
                <p style="color: #856404; margin-top: 10px;"><em>You will be required to set a new password when you activate your account.</em></p>
              </div>
              ` : ''}

              <p>Please activate your account and set your password by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${getActivationUrl('admin', data.verificationToken)}" class="button">Activate Account & Set Password</a>
              </p>

              <p>After activation, you will be able to:</p>
              <ul>
                <li>Manage rooms and kitchens</li>
                <li>Create and manage menu items</li>
                <li>View and track orders</li>
                <li>Manage tea boy accounts</li>
              </ul>

              <p>This activation link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Tea Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },

    // New User Notification (for Tea Boys, etc.)
    newUser: {
      subject: 'Your Account Has Been Created - Tea Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #4facfe; margin: 15px 0; }
            .password-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tea Management System!</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>A new Tea Boy account has been created for you in the Tea Management System.</p>

              <div class="info-box">
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Role:</strong> ${data.role}</p>
                ${data.kitchenName ? `<p><strong>Kitchen:</strong> ${data.kitchenName}</p>` : ''}
              </div>

              ${data.tempPassword ? `
              <div class="password-box">
                <p><strong>⚠️ Your Login Credentials:</strong></p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${data.tempPassword}</code></p>
                <p style="color: #856404; margin-top: 10px;"><em>Please keep this password safe. Your admin has set this for you.</em></p>
              </div>
              ` : ''}

              <p>Please activate your account by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${getActivationUrl(data.userType || 'tea-boy', data.verificationToken)}" class="button">Activate Account</a>
              </p>

              <p><strong>Important:</strong> You must activate your account before you can login. Your password ${data.tempPassword ? 'is shown above' : 'has been set by your admin'}.</p>

              <p>This activation link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Tea Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[type] || null;
};

// ============================================
// SEND EMAIL FUNCTION
// ============================================

const sendEmail = async (to, type, data) => {
  try {
    const transporter = createTransporter();

    // If email is not configured, log and return success (for development)
    if (!transporter) {
      console.log('📧 Email would be sent to:', to);
      console.log('📧 Email type:', type);
      console.log('📧 Email data:', JSON.stringify(data, null, 2));
      return { success: true, message: 'Email service not configured (dev mode)' };
    }

    const template = getEmailTemplate(type, data);

    if (!template) {
      throw new Error(`Email template '${type}' not found`);
    }

    const mailOptions = {
      from: `"Tea Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SPECIFIC EMAIL FUNCTIONS
// ============================================

const sendActivationEmail = async (user) => {
  return await sendEmail(user.email, 'activation', {
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken
  });
};

const sendPasswordResetEmail = async (user) => {
  return await sendEmail(user.email, 'passwordReset', {
    name: user.name,
    resetToken: user.resetToken
  });
};

const sendWelcomeAdminEmail = async (user, organizationName, tempPassword = null) => {
  return await sendEmail(user.email, 'welcomeAdmin', {
    name: user.name,
    email: user.email,
    organizationName,
    verificationToken: user.verificationToken,
    tempPassword
  });
};

const sendNewUserEmail = async (user, role, kitchenName = null, tempPassword = null) => {
  return await sendEmail(user.email, 'newUser', {
    name: user.name,
    email: user.email,
    role,
    kitchenName,
    verificationToken: user.verificationToken,
    tempPassword
  });
};

module.exports = {
  sendEmail,
  sendActivationEmail,
  sendPasswordResetEmail,
  sendWelcomeAdminEmail,
  sendNewUserEmail
};
