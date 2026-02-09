// backend/src/controllers/kitchen.controller.js
const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger.js');
const bcrypt = require('bcryptjs');

// ============================================
// GET ALL KITCHENS
// ============================================

const getAllKitchens = async (req, res) => {
  try {
    const kitchens = await req.tenantPrisma.kitchen.findMany({
      orderBy: {
        kitchenNumber: 'asc'
      }
    });

    res.json({
      success: true,
      data: kitchens
    });
  } catch (error) {
    console.error('Error getting kitchens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get kitchens',
      error: error.message
    });
  }
};

// ============================================
// GET KITCHEN BY ID
// ============================================

const getKitchenById = async (req, res) => {
  try {
    const { id } = req.params;

    const kitchen = await req.tenantPrisma.kitchen.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            rooms: true
          }
        }
      }
    });

    if (!kitchen) {
      return res.status(404).json({
        success: false,
        message: 'Kitchen not found'
      });
    }

    res.json({
      success: true,
      data: kitchen
    });
  } catch (error) {
    console.error('Error getting kitchen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get kitchen',
      error: error.message
    });
  }
};

// ============================================
// CREATE KITCHEN
// ============================================

const createKitchen = async (req, res) => {
  try {
    const { name, building, floor, username, password } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Kitchen name is required'
      });
    }

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required for kitchen login'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters'
      });
    }

    // Check if username already exists
    const existingUsername = await req.tenantPrisma.kitchen.findFirst({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Get the next kitchen number
    const lastKitchen = await req.tenantPrisma.kitchen.findFirst({
      orderBy: { kitchenNumber: 'desc' }
    });

    const kitchenNumber = lastKitchen ? lastKitchen.kitchenNumber + 1 : 1;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create kitchen
    const kitchen = await req.tenantPrisma.kitchen.create({
      data: {
        name,
        kitchenNumber,
        building: building || null,
        floor: floor || null,
        username,
        passwordHash,
        isActive: true
      }
    });

    // Log kitchen creation
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.create(adminEmail, tenantName, name, kitchenNumber, true);

    // Return kitchen without passwordHash
    const { passwordHash: _, ...kitchenData } = kitchen;

    res.status(201).json({
      success: true,
      message: 'Kitchen created successfully',
      data: kitchenData
    });
  } catch (error) {
    console.error('Error creating kitchen:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.create(adminEmail, tenantName, req.body?.name || 'Unknown', 0, false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create kitchen',
      error: error.message
    });
  }
};

// ============================================
// UPDATE KITCHEN
// ============================================

const updateKitchen = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, building, floor, isActive, username, password } = req.body;

    // Check if kitchen exists
    const existingKitchen = await req.tenantPrisma.kitchen.findUnique({
      where: { id }
    });

    if (!existingKitchen) {
      return res.status(404).json({
        success: false,
        message: 'Kitchen not found'
      });
    }

    // Check if new username already exists (for different kitchen)
    if (username && username !== existingKitchen.username) {
      const existingUsername = await req.tenantPrisma.kitchen.findFirst({
        where: {
          username,
          id: { not: id }
        }
      });

      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (building !== undefined) updateData.building = building || null;
    if (floor !== undefined) updateData.floor = floor || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (username !== undefined) updateData.username = username;

    // Hash new password if provided
    if (password) {
      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 4 characters'
        });
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update kitchen
    const updatedKitchen = await req.tenantPrisma.kitchen.update({
      where: { id },
      data: updateData
    });

    // Log kitchen update
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.update(adminEmail, tenantName, existingKitchen.name, updateData, true);

    // Return kitchen without passwordHash
    const { passwordHash: _, ...kitchenData } = updatedKitchen;

    res.json({
      success: true,
      message: 'Kitchen updated successfully',
      data: kitchenData
    });
  } catch (error) {
    console.error('Error updating kitchen:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.update(adminEmail, tenantName, req.params?.id || 'Unknown', {}, false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update kitchen',
      error: error.message
    });
  }
};

// ============================================
// DELETE KITCHEN
// ============================================

const deleteKitchen = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if kitchen exists with all related counts
    const existingKitchen = await req.tenantPrisma.kitchen.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            rooms: true,
            orders: true
          }
        }
      }
    });

    if (!existingKitchen) {
      return res.status(404).json({
        success: false,
        message: 'Kitchen not found'
      });
    }

    // Build detailed error message if kitchen has dependencies
    const dependencies = [];
    if (existingKitchen._count.users > 0) {
      dependencies.push(`${existingKitchen._count.users} user(s)`);
    }
    if (existingKitchen._count.rooms > 0) {
      dependencies.push(`${existingKitchen._count.rooms} room(s)`);
    }
    if (existingKitchen._count.orders > 0) {
      dependencies.push(`${existingKitchen._count.orders} order(s)`);
    }

    if (dependencies.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete kitchen with associated ${dependencies.join(', ')}. Please reassign or remove them first.`
      });
    }

    // Delete kitchen (menu items will cascade delete automatically)
    await req.tenantPrisma.kitchen.delete({
      where: { id }
    });

    // Log kitchen deletion
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.delete(adminEmail, tenantName, existingKitchen.name, true);

    res.json({
      success: true,
      message: 'Kitchen deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting kitchen:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.delete(adminEmail, tenantName, req.params?.id || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete kitchen',
      error: error.message
    });
  }
};

module.exports = {
  getAllKitchens,
  getKitchenById,
  createKitchen,
  updateKitchen,
  deleteKitchen
};
