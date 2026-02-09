// backend/src/controllers/kitchen.controller.js
const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger.js');

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
    const { name, building, floor } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Kitchen name is required'
      });
    }

    // Get the next kitchen number
    const lastKitchen = await req.tenantPrisma.kitchen.findFirst({
      orderBy: { kitchenNumber: 'desc' }
    });

    const kitchenNumber = lastKitchen ? lastKitchen.kitchenNumber + 1 : 1;

    // Create kitchen
    const kitchen = await req.tenantPrisma.kitchen.create({
      data: {
        name,
        kitchenNumber,
        building: building || null,
        floor: floor || null,
        isActive: true
      }
    });

    // Log kitchen creation
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.create(adminEmail, tenantName, name, kitchenNumber, true);

    res.status(201).json({
      success: true,
      message: 'Kitchen created successfully',
      data: kitchen
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
    const { name, building, floor, isActive } = req.body;

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

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (building !== undefined) updateData.building = building || null;
    if (floor !== undefined) updateData.floor = floor || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update kitchen
    const updatedKitchen = await req.tenantPrisma.kitchen.update({
      where: { id },
      data: updateData
    });

    // Log kitchen update
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.kitchen.update(adminEmail, tenantName, existingKitchen.name, updateData, true);

    res.json({
      success: true,
      message: 'Kitchen updated successfully',
      data: updatedKitchen
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
