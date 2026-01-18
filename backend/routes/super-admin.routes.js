// backend/routes/super-admin.routes.js
// UPDATED VERSION - Uses ALL new Tenant fields

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../src/lib/prisma');
const { verifyAccessToken } = require('../src/utils/jwt.util');
const { sendWelcomeAdminEmail } = require('../src/services/email.service');
const {
  createSuperAdmin,
  getAllSuperAdmins,
  updateSuperAdmin,
  deleteSuperAdmin,
  loginSuperAdmin,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  changePassword,
  generateResetToken,
  updateThemePreference,
  getCurrentProfile
} = require('../src/controllers/super-admin.controller');

// ============================================
// MIDDLEWARE
// ============================================

const requireSuperAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if user is Super Admin
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin privileges required.'
      });
    }

    // Verify Super Admin still exists and is active
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.userId }
    });

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin account not found or deactivated'
      });
    }

    // Attach user info to request
    req.user = decoded;
    req.superAdmin = superAdmin;

    next();
  } catch (error) {
    console.error('Super Admin authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// ============================================
// GET ALL TENANTS
// ============================================

router.get('/tenants', requireSuperAdmin, async (req, res) => {
  try {
    console.log('📋 Getting all tenants...');
    
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            rooms: true,
            kitchens: true,
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const tenantsWithStats = tenants.map(tenant => ({
      ...tenant,
      totalUsers: tenant._count.users,
      totalRooms: tenant._count.rooms,
      totalKitchens: tenant._count.kitchens,
      totalOrdersCount: tenant._count.orders // Rename to avoid conflict with tenant.totalOrders
    }));

    console.log(`✅ Found ${tenants.length} tenants`);

    res.json({
      success: true,
      data: tenantsWithStats
    });
  } catch (error) {
    console.error('❌ Error getting tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tenants',
      error: error.message
    });
  }
});

// ============================================
// GET TENANT BY ID
// ============================================

router.get('/tenants/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        rooms: {
          select: {
            id: true,
            name: true,
            floor: true,
            building: true,
            capacity: true
          }
        },
        kitchens: {
          select: {
            id: true,
            name: true,
            floor: true,
            building: true
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('❌ Error getting tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tenant',
      error: error.message
    });
  }
});

// ============================================
// GET TENANT STATS
// ============================================

router.get('/tenants/:id/stats', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [tenant, todayOrders] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              rooms: true,
              kitchens: true,
              orders: true,
              menuItems: true
            }
          }
        }
      }),
      prisma.order.count({
        where: {
          tenantId: id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: {
        totalOrders: tenant._count.orders,
        todayOrders,
        totalUsers: tenant._count.users,
        totalRooms: tenant._count.rooms,
        totalKitchens: tenant._count.kitchens,
        totalMenuItems: tenant._count.menuItems
      }
    });
  } catch (error) {
    console.error('❌ Error getting tenant stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stats',
      error: error.message
    });
  }
});

// ============================================
// CREATE TENANT - WITH ALL FIELDS ⭐
// ============================================

router.post('/tenants', requireSuperAdmin, async (req, res) => {
  try {
    console.log('📝 Creating new tenant...');
    console.log('Request body:', req.body);

    const {
      name,
      domain,
      adminName,
      adminEmail,
      plan = 'basic',
      contactName,
      contactEmail,
      contactPhone
    } = req.body;

    // Validation - slug is no longer required
    if (!name || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, adminEmail'
      });
    }

    // Generate slug from company name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Company name already exists (slug conflict)'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: adminEmail }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Admin email already exists'
      });
    }

    // Set plan limits
    const planLimits = {
      basic: { maxRooms: 10, maxUsers: 5, maxOrders: 1000, monthlyFee: 99 },
      pro: { maxRooms: 50, maxUsers: 20, maxOrders: 5000, monthlyFee: 299 },
      enterprise: { maxRooms: 999, maxUsers: 999, maxOrders: 99999, monthlyFee: 999 }
    };

    const limits = planLimits[plan] || planLimits.basic;

    // Generate random temporary password (will be replaced on activation)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant with ALL fields
      const tenant = await tx.tenant.create({
        data: {
          name,
          slug,
          domain: domain || null,
          plan,
          maxRooms: limits.maxRooms,
          maxUsers: limits.maxUsers,
          maxOrders: limits.maxOrders,
          monthlyFee: limits.monthlyFee,
          currency: 'USD',
          contactName: contactName || adminName || null,
          contactEmail: contactEmail || adminEmail || null,
          contactPhone: contactPhone || null,
          totalOrders: 0,
          totalRevenue: 0,
          isActive: true
        }
      });

      // Create admin user with verification token
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: adminName || 'Admin',
          email: adminEmail,
          role: 'ADMIN',
          passwordHash,
          isActive: true,
          emailVerified: false,
          verificationToken
        }
      });

      return { tenant, adminUser };
    });

    console.log('✅ Tenant created:', result.tenant.id);

    // Send welcome email to new admin with activation link (no password in email)
    console.log('📧 Sending welcome admin email to:', result.adminUser.email);
    const emailResult = await sendWelcomeAdminEmail(
      {
        name: result.adminUser.name,
        email: result.adminUser.email,
        verificationToken: verificationToken
      },
      result.tenant.name,
      null // No temporary password - admin will set password on activation
    );
    console.log('📧 Email send result:', emailResult);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully. Activation email sent to admin.',
      data: {
        ...result.tenant,
        adminEmail: result.adminUser.email
      }
    });
  } catch (error) {
    console.error('❌ Error creating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message
    });
  }
});

// ============================================
// UPDATE TENANT - WITH ALL FIELDS ⭐
// ============================================

router.put('/tenants/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      slug, 
      domain, 
      plan, 
      maxRooms, 
      maxUsers, 
      maxOrders,
      monthlyFee,
      currency,
      contactName,
      contactEmail,
      contactPhone,
      isActive 
    } = req.body;

    // Check if slug is taken by another tenant
    if (slug) {
      const existing = await prisma.tenant.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Slug already taken by another company'
        });
      }
    }

    // Build update data object
    const updateData = {};
    
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (domain !== undefined) updateData.domain = domain || null;
    if (plan) updateData.plan = plan;
    if (maxRooms) updateData.maxRooms = parseInt(maxRooms);
    if (maxUsers) updateData.maxUsers = parseInt(maxUsers);
    if (maxOrders) updateData.maxOrders = parseInt(maxOrders);
    if (monthlyFee) updateData.monthlyFee = parseFloat(monthlyFee);
    if (currency) updateData.currency = currency;
    if (contactName !== undefined) updateData.contactName = contactName || null;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail || null;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedTenant
    });
  } catch (error) {
    console.error('❌ Error updating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: error.message
    });
  }
});

// ============================================
// TOGGLE TENANT STATUS
// ============================================

router.patch('/tenants/:id/toggle-status', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        isActive: !tenant.isActive
      }
    });

    res.json({
      success: true,
      data: updatedTenant
    });
  } catch (error) {
    console.error('❌ Error toggling status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle status',
      error: error.message
    });
  }
});

// ============================================
// DELETE TENANT
// ============================================

router.delete('/tenants/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.tenant.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tenant',
      error: error.message
    });
  }
});

// ============================================
// GET SYSTEM STATS - UPDATED ⭐
// ============================================

router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      totalOrders,
      totalUsers
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count()
    ]);

    // Calculate revenue from tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { 
        monthlyFee: true,
        totalRevenue: true // Now this field exists!
      }
    });

    const monthlyRevenue = tenants.reduce((sum, t) => sum + (t.monthlyFee || 0), 0);
    const totalRevenue = tenants.reduce((sum, t) => sum + (t.totalRevenue || 0), 0);

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        totalOrders,
        totalUsers,
        monthlyRevenue,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stats',
      error: error.message
    });
  }
});

// ============================================
// AUTHENTICATION
// ============================================

// Super Admin Login (public route)
router.post('/login', loginSuperAdmin);

// ============================================
// SUPER ADMIN MANAGEMENT ROUTES
// ============================================

// Create Super Admin account
router.post('/super-admins', requireSuperAdmin, createSuperAdmin);

// Get all Super Admins
router.get('/super-admins', requireSuperAdmin, getAllSuperAdmins);

// Update Super Admin
router.put('/super-admins/:id', requireSuperAdmin, updateSuperAdmin);

// Delete/Deactivate Super Admin
router.delete('/super-admins/:id', requireSuperAdmin, deleteSuperAdmin);

// ============================================
// ORGANIZATION ADMIN MANAGEMENT ROUTES
// ============================================

// Get all organization Admins across all tenants
router.get('/admins', requireSuperAdmin, getAllAdmins);

// Create new Admin for an organization
router.post('/admins', requireSuperAdmin, createAdmin);

// Update Admin
router.put('/admins/:id', requireSuperAdmin, updateAdmin);

// Delete/Deactivate Admin
router.delete('/admins/:id', requireSuperAdmin, deleteAdmin);

// Resend Activation Email
router.post('/admins/:id/resend-activation', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { id },
      include: { tenant: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Admin account is already activated'
      });
    }

    // Generate new verification token if needed
    let verificationToken = admin.verificationToken;
    if (!verificationToken) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id },
        data: { verificationToken }
      });
    }

    // Resend activation email
    console.log('📧 Resending activation email to:', admin.email);
    const emailResult = await sendWelcomeAdminEmail(
      {
        name: admin.name,
        email: admin.email,
        verificationToken
      },
      admin.tenant.name,
      null // No password
    );
    console.log('📧 Email send result:', emailResult);

    res.json({
      success: true,
      message: 'Activation email sent successfully'
    });
  } catch (error) {
    console.error('❌ Error resending activation email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend activation email',
      error: error.message
    });
  }
});

// ============================================
// PASSWORD MANAGEMENT ROUTES
// ============================================

// Change password (for Super Admin or Admin)
router.post('/password/change/:userType/:userId', changePassword);

// Generate password reset token
router.post('/password/reset-token', generateResetToken);

// ============================================
// USER PREFERENCES & PROFILE ROUTES
// ============================================

// Get current user profile (including theme)
router.get('/profile', requireSuperAdmin, getCurrentProfile);

// Update theme preference
router.patch('/profile/theme', requireSuperAdmin, updateThemePreference);

module.exports = router;