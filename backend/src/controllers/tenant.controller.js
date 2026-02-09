// backend/src/controllers/tenant.controller.js
const { prisma } = require('../lib/prisma.js');
const { hashPassword, validatePasswordStrength } = require('../utils/password.util.js');
const { generateTokenPair } = require('../utils/jwt.util.js');
const logger = require('../utils/logger.js');

/**
 * Register new tenant (company signup)
 */
const registerTenant = async (req, res) => {
  try {
    const {
      companyName,
      slug,
      domain,
      adminName,
      adminEmail,
      adminPassword
    } = req.body;

    // Validate input
    if (!companyName || !slug || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'All fields are required'
      });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid slug format',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(adminPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        error: 'Slug already taken',
        message: 'This company slug is already in use'
      });
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: adminEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        message: 'This email is already associated with an account'
      });
    }

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          domain: domain || null,
          isActive: true
        }
      });

      // Hash admin password
      const passwordHash = await hashPassword(adminPassword);

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: adminName,
          email: adminEmail,
          role: 'ADMIN',
          passwordHash,
          isActive: true
        }
      });

      // Create default kitchen
      const defaultKitchen = await tx.kitchen.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Kitchen',
          building: 'Main Building',
          floor: 1,
          isActive: true
        }
      });

      return { tenant, adminUser, defaultKitchen };
    });

    // Generate tokens for auto-login
    const tokens = generateTokenPair({
      userId: result.adminUser.id,
      tenantId: result.tenant.id,
      role: result.adminUser.role,
      email: result.adminUser.email
    });

    // Create auth session
    await prisma.authSession.create({
      data: {
        tenantId: result.tenant.id,
        userId: result.adminUser.id,
        refreshTokenHash: tokens.refreshToken,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        tenantId: result.tenant.id,
        actorUserId: result.adminUser.id,
        action: 'CREATE',
        entity: 'Tenant',
        entityId: result.tenant.id,
        metaJson: JSON.stringify({
          companyName,
          adminEmail
        })
      }
    });

    // Return success
    const { passwordHash, ...adminWithoutPassword } = result.adminUser;

    // Log tenant creation
    logger.tenant.create('Self-Registration', companyName, adminEmail, true);

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant: result.tenant,
        admin: adminWithoutPassword,
        defaultKitchen: result.defaultKitchen,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });
  } catch (error) {
    console.error('Tenant registration error:', error);
    logger.tenant.create('Self-Registration', req.body?.companyName || 'Unknown', req.body?.adminEmail || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during tenant registration'
    });
  }
};

/**
 * Get tenant details (admin only)
 */
const getTenantDetails = async (req, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'No tenant context'
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        _count: {
          select: {
            users: true,
            kitchens: true,
            rooms: true,
            menuItems: true,
            orders: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Get tenant details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenant details'
    });
  }
};

/**
 * Update tenant details (admin only)
 */
const updateTenant = async (req, res) => {
  try {
    console.log('📥 Update tenant request from user:', req.user);
    console.log('📥 Request body:', req.body);

    if (!req.user?.tenantId) {
      console.log('❌ No tenant context');
      return res.status(400).json({
        success: false,
        error: 'No tenant context'
      });
    }

    const {
      name,
      domain,
      enableOrderHistory,
      autoClearHistoryEnabled,
      autoClearHistoryInterval
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (enableOrderHistory !== undefined) updateData.enableOrderHistory = enableOrderHistory;
    if (autoClearHistoryEnabled !== undefined) updateData.autoClearHistoryEnabled = autoClearHistoryEnabled;
    if (autoClearHistoryInterval !== undefined) updateData.autoClearHistoryInterval = autoClearHistoryInterval;

    console.log('📝 Update data:', updateData);

    const updatedTenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: updateData
    });

    console.log('✅ Tenant updated successfully');

    // Log audit event
    await prisma.auditLog.create({
      data: {
        tenantId: req.user.tenantId,
        actorUserId: req.user.userId,
        action: 'UPDATE',
        entity: 'Tenant',
        entityId: updatedTenant.id,
        metaJson: JSON.stringify(updateData)
      }
    });

    res.json({
      success: true,
      data: updatedTenant
    });
  } catch (error) {
    console.error('❌ Update tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tenant',
      message: error.message
    });
  }
};

/**
 * Check if slug is available
 */
const checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug is required'
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true }
    });

    res.json({
      success: true,
      data: {
        available: !tenant,
        slug
      }
    });
  } catch (error) {
    console.error('Check slug availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check slug availability'
    });
  }
};

/**
 * Get tenant statistics (admin only)
 */
const getTenantStats = async (req, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'No tenant context'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalKitchens,
      totalRooms,
      totalMenuItems,
      totalOrders,
      todayOrders,
      activeOrders
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId: req.user.tenantId } }),
      prisma.kitchen.count({ where: { tenantId: req.user.tenantId } }),
      prisma.room.count({ where: { tenantId: req.user.tenantId } }),
      prisma.menuItem.count({ where: { tenantId: req.user.tenantId } }),
      prisma.order.count({ where: { tenantId: req.user.tenantId } }),
      prisma.order.count({
        where: {
          tenantId: req.user.tenantId,
          createdAt: { gte: today }
        }
      }),
      prisma.order.count({
        where: {
          tenantId: req.user.tenantId,
          status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        kitchens: totalKitchens,
        rooms: totalRooms,
        menuItems: totalMenuItems,
        orders: {
          total: totalOrders,
          today: todayOrders,
          active: activeOrders
        }
      }
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenant statistics'
    });
  }
};

module.exports = {
  registerTenant,
  getTenantDetails,
  updateTenant,
  checkSlugAvailability,
  getTenantStats
};