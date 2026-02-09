// backend/src/controllers/user.controller.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendNewUserEmail } = require('../services/email.service');
const logger = require('../utils/logger.js');

// ============================================
// GET CURRENT USER PROFILE
// ============================================

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await req.tenantPrisma.user.findUnique({
      where: { id: userId },
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
        kitchen: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// ============================================
// UPDATE USER PROFILE
// ============================================

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    // Build update data (email cannot be changed here)
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;

    const updatedUser = await req.tenantPrisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// ============================================
// CHANGE PASSWORD (for authenticated user)
// ============================================

const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
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

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Get user with password hash
    const user = await req.tenantPrisma.user.findUnique({
      where: { id: userId }
    });

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
    await req.tenantPrisma.user.update({
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
// GET ALL USERS (Admin only)
// ============================================

const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, kitchenId } = req.query;

    // Build where clause
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (kitchenId) where.kitchenId = kitchenId;

    const users = await req.tenantPrisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        kitchen: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// ============================================
// CREATE USER (Admin only)
// ============================================

const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, kitchenId } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    // Check if email already exists in this tenant
    const existingUser = await req.tenantPrisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await req.tenantPrisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        kitchenId: kitchenId || null,
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
        createdAt: true,
        verificationToken: true,
        kitchen: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Send activation email
    console.log('📧 Sending activation email to:', user.email);
    const emailResult = await sendNewUserEmail(
      {
        name: user.name,
        email: user.email,
        verificationToken: user.verificationToken
      },
      role,
      user.kitchen?.name || null,
      password // Send the plain password for Tea Boy (will be shown in email)
    );
    console.log('📧 Email send result:', emailResult);

    // Remove verification token from response
    const { verificationToken: _, ...userData } = user;

    // Log user creation
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.user.create(adminEmail, tenantName, email, role, true);

    res.status(201).json({
      success: true,
      message: 'User created successfully. Activation email sent.',
      data: userData
    });
  } catch (error) {
    console.error('Error creating user:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.user.create(adminEmail, tenantName, req.body?.email || 'Unknown', req.body?.role || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// ============================================
// UPDATE USER (Admin only)
// ============================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, kitchenId, isActive } = req.body;

    // Check if user exists
    const existingUser = await req.tenantPrisma.user.findUnique({
      where: { id },
      include: {
        kitchen: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trying to change role between ADMIN and TEA_BOY
    if (role && role !== existingUser.role) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change user role between Admin and Tea Boy. Please create a new user instead.'
      });
    }

    // Track if email is being changed
    const emailChanged = email && email !== existingUser.email;

    // Check if email is taken by another user
    if (emailChanged) {
      const emailTaken = await req.tenantPrisma.user.findFirst({
        where: {
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
    // Role change is not allowed, so we don't update it
    if (kitchenId !== undefined) updateData.kitchenId = kitchenId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If email changed, generate new verification token and reset verification status
    let newVerificationToken = null;
    if (emailChanged) {
      newVerificationToken = crypto.randomBytes(32).toString('hex');
      updateData.emailVerified = false;
      updateData.emailVerifiedAt = null;
      updateData.verificationToken = newVerificationToken;
    }

    // Update user
    const updatedUser = await req.tenantPrisma.user.update({
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
        updatedAt: true,
        verificationToken: true,
        kitchen: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // If email changed, send new activation email
    if (emailChanged && newVerificationToken) {
      console.log('📧 Sending new activation email to changed email:', email);
      const emailResult = await sendNewUserEmail(
        {
          name: updatedUser.name,
          email: updatedUser.email,
          verificationToken: newVerificationToken
        },
        updatedUser.role,
        updatedUser.kitchen?.name || null,
        null // No password in update
      );
      console.log('📧 Email send result:', emailResult);
    }

    // Remove verification token from response
    const { verificationToken: _, ...userData } = updatedUser;

    // Log user update
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.user.update(adminEmail, tenantName, existingUser.email, updateData, true);

    res.json({
      success: true,
      message: emailChanged
        ? 'User updated successfully. A new activation email has been sent to the new email address.'
        : 'User updated successfully',
      data: userData
    });
  } catch (error) {
    console.error('Error updating user:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.user.update(adminEmail, tenantName, req.params?.id || 'Unknown', {}, false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// ============================================
// DELETE USER (Admin only)
// ============================================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await req.tenantPrisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Hard delete - permanently remove from database
    await req.tenantPrisma.user.delete({
      where: { id }
    });

    // Log user deletion
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.user.delete(adminEmail, tenantName, existingUser.email, true);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.user.delete(adminEmail, tenantName, req.params?.id || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

module.exports = {
  // Profile management
  getUserProfile,
  updateUserProfile,
  changeUserPassword,

  // User management (Admin only)
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
