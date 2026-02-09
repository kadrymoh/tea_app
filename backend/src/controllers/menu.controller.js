// backend/src/controllers/menu.controller.js
const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger.js');

// ============================================
// GET ALL MENU ITEMS
// ============================================

const getAllMenuItems = async (req, res) => {
  try {
    const { kitchenId, category, isAvailable } = req.query;

    const where = {};
    if (kitchenId) where.kitchenId = kitchenId;
    if (category) where.category = category;
    if (isAvailable !== undefined) where.available = isAvailable === 'true';

    const menuItems = await req.tenantPrisma.menuItem.findMany({
      where,
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
            kitchenNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error('Error getting menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu items',
      error: error.message
    });
  }
};

// ============================================
// GET MENU ITEM BY ID
// ============================================

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await req.tenantPrisma.menuItem.findUnique({
      where: { id },
      include: {
        kitchen: true
      }
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error getting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu item',
      error: error.message
    });
  }
};

// ============================================
// CREATE MENU ITEM
// ============================================

const createMenuItem = async (req, res) => {
  try {
    const { name, nameAr, category, price, imageUrl, emoji, kitchenId } = req.body;

    // Validation
    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    // Validate price is a valid number (allow 0 for free items)
    const parsedPrice = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number (0 or greater)'
      });
    }

    // Get the kitchen ID from request body or from JWT token (for kitchen login)
    let targetKitchenId = kitchenId || req.user?.kitchenId;

    if (!targetKitchenId) {
      return res.status(400).json({
        success: false,
        message: 'Kitchen ID is required'
      });
    }

    // Verify kitchen exists and is active
    const kitchen = await req.tenantPrisma.kitchen.findUnique({
      where: { id: targetKitchenId }
    });

    if (!kitchen) {
      return res.status(404).json({
        success: false,
        message: 'Kitchen not found'
      });
    }

    if (!kitchen.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Kitchen is not active'
      });
    }

    // Create the menu item only for this specific kitchen
    const menuItem = await req.tenantPrisma.menuItem.create({
      data: {
        name,
        nameAr: nameAr || null,
        category: category || 'OTHER',
        price: parsedPrice,
        imageUrl: imageUrl || null,
        emoji: emoji || '☕',
        kitchenId: targetKitchenId,
        available: true,
        hasSugar: req.body.hasSugar !== undefined ? req.body.hasSugar : true,
        isIceOnly: req.body.isIceOnly || false
      },
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
            kitchenNumber: true
          }
        }
      }
    });

    console.log(`✅ Created menu item "${name}" for kitchen ${kitchen.name}`);

    // Emit socket event for real-time menu update
    if (req.app.locals.io) {
      req.app.locals.io.emit('menu-update', {
        action: 'create',
        item: menuItem
      });
      console.log('🔔 Emitted menu-update event for new item');
    }

    // Log menu item creation
    const teaBoyEmail = req.user?.email || req.user?.username || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.menu.create(teaBoyEmail, tenantName, name, kitchen.kitchenNumber || 0, true);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    logger.menu.create(req.user?.email || 'Unknown', 'Unknown', req.body?.name || 'Unknown', 0, false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    });
  }
};

// ============================================
// UPDATE MENU ITEM
// ============================================

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameAr, category, price, imageUrl, emoji, isAvailable } = req.body;

    // Check if menu item exists
    const existingItem = await req.tenantPrisma.menuItem.findUnique({
      where: { id },
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
            kitchenNumber: true
          }
        }
      }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr || null;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) {
      const parsedPrice = typeof price === 'number' ? price : parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid positive number (0 or greater)'
        });
      }
      updateData.price = parsedPrice;
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (isAvailable !== undefined) updateData.available = isAvailable;
    if (req.body.hasSugar !== undefined) updateData.hasSugar = req.body.hasSugar;
    if (req.body.isIceOnly !== undefined) updateData.isIceOnly = req.body.isIceOnly;

    // Update only this specific menu item (not all items with same name)
    const updatedItem = await req.tenantPrisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
            kitchenNumber: true
          }
        }
      }
    });

    console.log(`✅ Updated menu item "${existingItem.name}" for kitchen ${existingItem.kitchen?.name}`);

    // Emit socket event for real-time menu update
    if (req.app.locals.io) {
      req.app.locals.io.emit('menu-update', {
        action: 'update',
        item: updatedItem
      });
      console.log('🔔 Emitted menu-update event for updated item');
    }

    // Log menu item update
    const teaBoyEmail = req.user?.email || req.user?.username || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.menu.update(teaBoyEmail, tenantName, existingItem.name, updateData, true);

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    logger.menu.update(req.user?.email || 'Unknown', 'Unknown', req.params?.id || 'Unknown', {}, false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
};

// ============================================
// DELETE MENU ITEM
// ============================================

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if menu item exists
    const existingItem = await req.tenantPrisma.menuItem.findUnique({
      where: { id },
      include: {
        kitchen: {
          select: {
            id: true,
            name: true,
            kitchenNumber: true
          }
        }
      }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Delete only this specific menu item (not all items with same name)
    await req.tenantPrisma.menuItem.delete({
      where: { id }
    });

    console.log(`✅ Deleted menu item "${existingItem.name}" from kitchen ${existingItem.kitchen?.name}`);

    // Emit socket event for real-time menu update
    if (req.app.locals.io) {
      req.app.locals.io.emit('menu-update', {
        action: 'delete',
        itemId: id,
        itemName: existingItem.name
      });
      console.log('🔔 Emitted menu-update event for deleted item');
    }

    // Log menu item deletion
    const teaBoyEmail = req.user?.email || req.user?.username || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.menu.delete(teaBoyEmail, tenantName, existingItem.name, true);

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    logger.menu.delete(req.user?.email || 'Unknown', 'Unknown', req.params?.id || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
};

// ============================================
// TOGGLE MENU ITEM AVAILABILITY
// ============================================

const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if menu item exists
    const existingItem = await req.tenantPrisma.menuItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Toggle availability
    const updatedItem = await req.tenantPrisma.menuItem.update({
      where: { id },
      data: {
        available: !existingItem.available
      }
    });

    // Emit socket event for real-time menu update
    if (req.app.locals.io) {
      req.app.locals.io.emit('menu-item-update', {
        action: 'availability',
        item: updatedItem
      });
      console.log('🔔 Emitted menu-item-update event for availability change');
    }

    // Log availability toggle
    const teaBoyEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.menu.toggleAvailability(teaBoyEmail, tenantName, existingItem.name, updatedItem.available);

    res.json({
      success: true,
      message: `Menu item ${updatedItem.available ? 'enabled' : 'disabled'} successfully`,
      data: updatedItem
    });
  } catch (error) {
    console.error('Error toggling menu item availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle menu item availability',
      error: error.message
    });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
};
