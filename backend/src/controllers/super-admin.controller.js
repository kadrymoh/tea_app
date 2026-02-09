// backend/src/controllers/super-admin.controller.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const { sendActivationEmail, sendWelcomeAdminEmail, sendPasswordResetEmail } = require('../services/email.service');
const { generateTokenPair } = require('../utils/jwt.util');
const logger = require('../utils/logger.js');

// ============================================
// CREATE SUPER ADMIN
// ============================================

const createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if email already exists
    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create Super Admin (requires email verification)
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: false,
        emailVerifiedAt: null,
        isActive: true,
        verificationToken
      }
    });

    // Send activation email
    await sendActivationEmail({
      name: superAdmin.name,
      email: superAdmin.email,
      verificationToken: superAdmin.verificationToken
    });

    // Remove sensitive data
    const { passwordHash: _, verificationToken: __, resetToken: ___, ...adminData } = superAdmin;

    res.status(201).json({
      success: true,
      message: 'Super Admin created successfully. Activation email sent.',
      data: adminData
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Super Admin',
      error: error.message
    });
  }
};

// ============================================
// GET ALL SUPER ADMINS
// ============================================

const getAllSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await prisma.superAdmin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: superAdmins
    });
  } catch (error) {
    console.error('Error getting super admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Super Admins',
      error: error.message
    });
  }
};

// ============================================
// UPDATE SUPER ADMIN
// ============================================

const updateSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, isActive } = req.body;

    // Check if super admin exists
    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { id }
    });

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Check if email is taken by another super admin
    if (email && email !== existingAdmin.email) {
      const emailTaken = await prisma.superAdmin.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle password update
    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update super admin
    const updatedAdmin = await prisma.superAdmin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Super Admin updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Super Admin',
      error: error.message
    });
  }
};

// ============================================
// DELETE SUPER ADMIN (PERMANENT DELETE)
// ============================================

const deleteSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if super admin exists
    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { id }
    });

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Prevent deleting yourself (optional safety check)
    if (req.user && req.user.userId === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Permanent delete from database
    await prisma.superAdmin.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Super Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Super Admin',
      error: error.message
    });
  }
};

// ============================================
// GET ALL ORGANIZATION ADMINS (across all tenants)
// ============================================

const getAllAdmins = async (req, res) => {
  try {
    const { tenantId, isActive, search } = req.query;

    // Build where clause
    const where = {
      role: 'ADMIN'
    };

    if (tenantId) where.tenantId = tenantId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const admins = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Error getting admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Admins',
      error: error.message
    });
  }
};

// ============================================
// CREATE ADMIN FOR ORGANIZATION
// ============================================

const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, tenantId } = req.body;

    // Validation
    if (!name || !email || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and tenantId are required'
      });
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if email already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        email
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists in this organization'
      });
    }

    // Generate random temporary password (will be replaced on activation)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: 'ADMIN',
        tenantId,
        passwordHash,
        isActive: true,
        emailVerified: false,
        verificationToken
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        tenantId: true,
        verificationToken: true,
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    // Send welcome email to new admin (no password in email)
    console.log('📧 Sending welcome admin email to:', admin.email);
    const emailResult = await sendWelcomeAdminEmail(
      {
        name: admin.name,
        email: admin.email,
        verificationToken: admin.verificationToken
      },
      admin.tenant.name,
      null // No temporary password - admin will set password on activation
    );
    console.log('📧 Email send result:', emailResult);

    // Remove verification token from response
    const { verificationToken: _, ...adminData } = admin;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully. Welcome email sent.',
      data: adminData
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Admin',
      error: error.message
    });
  }
};

// ============================================
// UPDATE ADMIN
// ============================================

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, isActive } = req.body;

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingAdmin || existingAdmin.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if email is taken by another user in same tenant
    if (email && email !== existingAdmin.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          tenantId: existingAdmin.tenantId,
          email,
          id: { not: id }
        }
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update password if provided
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      updateData.passwordHash = passwordHash;
    }

    // Update admin
    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Admin',
      error: error.message
    });
  }
};

// ============================================
// DELETE ADMIN (PERMANENT DELETE)
// ============================================

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingAdmin || existingAdmin.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Permanent delete from database
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Admin',
      error: error.message
    });
  }
};

// ============================================
// CHANGE PASSWORD (for both Super Admin and Admin)
// ============================================

const changePassword = async (req, res) => {
  try {
    const { userId, userType } = req.params; // userType: 'super-admin' or 'admin'
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    let user;
    let model;

    // Get user based on type
    if (userType === 'super-admin') {
      user = await prisma.superAdmin.findUnique({
        where: { id: userId }
      });
      model = prisma.superAdmin;
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
      model = prisma.user;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await model.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// ============================================
// GENERATE PASSWORD RESET TOKEN
// ============================================

const generateResetToken = async (req, res) => {
  try {
    const { email, userType } = req.body; // userType: 'super-admin' or 'admin'

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email and user type are required'
      });
    }

    let user;
    let model;

    // Find user based on type
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
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If the email exists, a reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token
    await model.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send password reset email
    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetToken
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Error generating reset token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reset token',
      error: error.message
    });
  }
};

// ============================================
// SUPER ADMIN LOGIN
// ============================================

const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find Super Admin by email
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check if email is verified
    if (!superAdmin.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address first. Check your inbox for the activation link.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: superAdmin.id,
      role: 'SUPER_ADMIN',
      email: superAdmin.email
    });

    // Note: lastLoginAt field doesn't exist in SuperAdmin model
    // If needed, add it to schema.prisma first

    // Remove sensitive data
    const { passwordHash, verificationToken, resetToken, ...adminData } = superAdmin;

    // Log successful Super Admin login
    logger.auth.superAdminLogin(email, true);

    res.json({
      success: true,
      data: {
        user: {
          ...adminData,
          role: 'SUPER_ADMIN'
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });
  } catch (error) {
    console.error('Super Admin login error:', error);
    logger.auth.superAdminLogin(req.body?.email || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// ============================================
// UPDATE THEME PREFERENCE
// ============================================

const updateThemePreference = async (req, res) => {
  try {
    const { theme } = req.body;
    const userId = req.user.userId; // من الـ JWT token

    // Validation
    if (!theme || (theme !== 'dark' && theme !== 'light')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Must be "dark" or "light"'
      });
    }

    // Update theme preference
    const updatedAdmin = await prisma.superAdmin.update({
      where: { id: userId },
      data: { theme }
    });

    res.json({
      success: true,
      message: 'Theme preference updated successfully',
      data: {
        theme: updatedAdmin.theme
      }
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theme preference',
      error: error.message
    });
  }
};

// ============================================
// GET CURRENT USER PROFILE (INCLUDING THEME)
// ============================================

const getCurrentProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // من الـ JWT token

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        theme: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    });

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    res.json({
      success: true,
      data: superAdmin
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

module.exports = {
  // Super Admin management
  createSuperAdmin,
  getAllSuperAdmins,
  updateSuperAdmin,
  deleteSuperAdmin,
  loginSuperAdmin,

  // Organization Admin management
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,

  // Password management
  changePassword,
  generateResetToken,

  // User preferences
  updateThemePreference,
  getCurrentProfile
};
