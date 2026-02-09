// backend/src/controllers/activation.controller.js
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger.js');

// ============================================
// VERIFY EMAIL WITH TOKEN
// ============================================

const verifyEmail = async (req, res) => {
  try {
    const { token, userType } = req.body; // userType: 'user' or 'super-admin'

    if (!token || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Token and user type are required'
      });
    }

    let user;
    let model;

    // Find user by verification token
    if (userType === 'super-admin') {
      user = await prisma.superAdmin.findFirst({
        where: { verificationToken: token }
      });
      model = prisma.superAdmin;
    } else {
      user = await prisma.user.findFirst({
        where: { verificationToken: token }
      });
      model = prisma.user;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true
      });
    }

    // Mark email as verified
    await model.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null // Clear the token after use
      }
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'SUPER_ADMIN' // Include role for redirect logic
      }
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
};

// ============================================
// ACTIVATE ACCOUNT & SET PASSWORD
// ============================================

const activateAccount = async (req, res) => {
  try {
    const { token, password, userType } = req.body;

    // Validation
    if (!token || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Token and user type are required'
      });
    }

    let user;
    let model;

    // Find user by verification token
    if (userType === 'super-admin') {
      user = await prisma.superAdmin.findFirst({
        where: { verificationToken: token }
      });
      model = prisma.superAdmin;
    } else {
      user = await prisma.user.findFirst({
        where: { verificationToken: token },
        include: { tenant: true }
      });
      model = prisma.user;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired activation token'
      });
    }

    // Check user role
    const isTeaBoy = user.role === 'TEA_BOY';
    const isAdmin = user.role === 'ADMIN' || userType === 'super-admin';

    // For Tea Boy: Only activate (password already set by admin)
    // For Admin/Super Admin: Require new password
    if (isAdmin && !password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for admin accounts',
        requiresPasswordChange: true
      });
    }

    if (isAdmin && password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Prepare update data
    const updateData = {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      isActive: true
    };

    // For Admin/Super Admin: Set new password
    if (isAdmin && password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateData.passwordHash = passwordHash;
    }

    // Activate account
    const updatedUser = await model.update({
      where: { id: user.id },
      data: updateData
    });

    // Log activation
    const tenantName = user.tenant?.name || 'Super Admin';
    logger.user.activate(user.email, tenantName, true);

    res.json({
      success: true,
      message: isTeaBoy
        ? 'Account activated successfully. You can now login with your password.'
        : 'Account activated successfully. Please login with your new password.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        role: updatedUser.role || 'SUPER_ADMIN'
      }
    });
  } catch (error) {
    console.error('Error activating account:', error);
    logger.user.activate(req.body?.token?.slice(0, 8) || 'Unknown', 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to activate account',
      error: error.message
    });
  }
};

// ============================================
// RESET PASSWORD WITH TOKEN
// ============================================

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, userType } = req.body;

    // Validation
    if (!token || !newPassword || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Token, new password, and user type are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    let user;
    let model;

    // Find user by reset token
    if (userType === 'super-admin') {
      user = await prisma.superAdmin.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gte: new Date() // Token must not be expired
          }
        }
      });
      model = prisma.superAdmin;
    } else {
      user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gte: new Date()
          }
        }
      });
      model = prisma.user;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await model.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================

const resendVerification = async (req, res) => {
  try {
    const { email, userType } = req.body;
    const { sendActivationEmail } = require('../services/email.service');
    const crypto = require('crypto');

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email and user type are required'
      });
    }

    let user;
    let model;

    // Find user
    if (userType === 'super-admin') {
      user = await prisma.superAdmin.findUnique({
        where: { email }
      });
      model = prisma.superAdmin;
    } else {
      user = await prisma.user.findFirst({
        where: { email }
      });
      model = prisma.user;
    }

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If the email exists, a verification link will be sent'
      });
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update user with new token
    await model.update({
      where: { id: user.id },
      data: { verificationToken }
    });

    // Send verification email
    await sendActivationEmail({
      name: user.name,
      email: user.email,
      verificationToken
    });

    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
};

module.exports = {
  verifyEmail,
  activateAccount,
  resetPassword,
  resendVerification
};
