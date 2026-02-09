// backend/src/controllers/auth.controller.js
const { prisma } = require('../lib/prisma.js');
const { comparePassword } = require('../utils/password.util.js');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt.util.js');
const logger = require('../utils/logger.js');

/**
 * Login handler
 */
const login = async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;

    console.log('🔐 Login attempt:', { email, tenantSlug });

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Find tenant (if slug provided)
    let tenant = null;
    if (tenantSlug) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
          message: 'Invalid tenant slug'
        });
      }

      if (!tenant.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Tenant inactive',
          message: 'This account has been deactivated'
        });
      }
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(tenant && { tenantId: tenant.id })
      },
      include: {
        tenant: true,
        kitchen: true
      }
    });

    if (!user) {
      console.log('❌ User not found with email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    console.log('✅ User found:', { name: user.name, email: user.email, role: user.role, tenant: user.tenant.slug });

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is not active');
      return res.status(403).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('❌ Email not verified');
      return res.status(403).json({
        success: false,
        error: 'Email not verified',
        message: 'Please verify your email address first. Check your inbox for the activation link.'
      });
    }

    console.log('✅ User is active and verified');

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    console.log('✅ Password is valid');

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    });

    // Create auth session
    await prisma.authSession.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        refreshTokenHash: tokens.refreshToken,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = user;

    console.log('✅ Login successful! Returning user data');

    // Log successful login
    logger.auth.login(user.role, user.email, user.tenant.name, true);

    res.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          tenantName: user.tenant.name,
          tenantSlug: user.tenant.slug,
          kitchenName: user.kitchen?.name || null,
          kitchenNumber: user.kitchen?.kitchenNumber || null
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    logger.auth.login('Unknown', req.body?.email || 'Unknown', req.body?.tenantSlug || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Logout handler
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Revoke the session
    await prisma.authSession.updateMany({
      where: {
        refreshTokenHash: refreshToken,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    // Log logout (we don't have user info here, but we log it anyway)
    logger.auth.logout('User', 'Unknown', 'Unknown');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

/**
 * Refresh token handler
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Check if session exists and is not revoked
    const session = await prisma.authSession.findFirst({
      where: {
        refreshTokenHash: refreshToken,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            tenant: true
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session not found or expired'
      });
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: session.user.id,
      tenantId: session.user.tenantId,
      role: session.user.role,
      email: session.user.email
    });

    // Update session with new refresh token
    await prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        tenant: true,
        kitchen: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        ...userWithoutPassword,
        tenantName: user.tenant.name,
        tenantSlug: user.tenant.slug,
        kitchenName: user.kitchen?.name || null,
        kitchenNumber: user.kitchen?.kitchenNumber || null
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
};

/**
 * Force password change for first-time login
 */
const forcePasswordChange = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const { comparePassword } = require('../utils/password.util.js');
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const { hashPassword } = require('../utils/password.util.js');
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password and mark as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null
      }
    });

    console.log('✅ Password changed successfully for:', user.email);

    // Log password change
    const userWithTenant = await prisma.user.findUnique({
      where: { id: user.id },
      include: { tenant: true }
    });
    logger.user.passwordChange(user.email, userWithTenant?.tenant?.name || 'Unknown', true);

    res.json({
      success: true,
      message: 'Password changed successfully. You can now use the system.'
    });
  } catch (error) {
    console.error('Force password change error:', error);
    logger.user.passwordChange(req.user?.email || 'Unknown', 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
};

module.exports = {
  login,
  logout,
  refreshToken,
  getCurrentUser,
  forcePasswordChange
};