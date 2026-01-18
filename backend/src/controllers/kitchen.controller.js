// backend/src/controllers/kitchen.controller.js
const { prisma } = require('../lib/prisma');

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

    res.status(201).json({
      success: true,
      message: 'Kitchen created successfully',
      data: kitchen
    });
  } catch (error) {
    console.error('Error creating kitchen:', error);
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

    res.json({
      success: true,
      message: 'Kitchen updated successfully',
      data: updatedKitchen
    });
  } catch (error) {
    console.error('Error updating kitchen:', error);
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

    // Check if kitchen exists
    const existingKitchen = await req.tenantPrisma.kitchen.findUnique({
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

    if (!existingKitchen) {
      return res.status(404).json({
        success: false,
        message: 'Kitchen not found'
      });
    }

    // Check if kitchen has associated users or rooms
    if (existingKitchen._count.users > 0 || existingKitchen._count.rooms > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete kitchen with associated users or rooms'
      });
    }

    // Delete kitchen
    await req.tenantPrisma.kitchen.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Kitchen deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting kitchen:', error);
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
