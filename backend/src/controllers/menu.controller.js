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
    const { name, nameAr, category, price, imageUrl, emoji } = req.body;

    // Validation
    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    // Validate price is a valid number (allow 0 for free items)
    if (typeof price !== 'number' || isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number (0 or greater)'
      });
    }

    // Get ALL active kitchens for this tenant
    const kitchens = await req.tenantPrisma.kitchen.findMany({
      where: { isActive: true }
    });

    if (kitchens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active kitchens found. Please create a kitchen first.'
      });
    }

    // Create the menu item for ALL kitchens in the tenant
    const menuItems = [];

    for (const kitchen of kitchens) {
      const menuItem = await req.tenantPrisma.menuItem.create({
        data: {
          name,
          nameAr: nameAr || null,
          category: category || 'OTHER',
          price: parseFloat(price),
          imageUrl: imageUrl || null,
          emoji: emoji || '☕',
          kitchenId: kitchen.id,
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

      menuItems.push(menuItem);
    }

    console.log(`✅ Created menu item "${name}" for ${kitchens.length} kitchens`);

    // Emit socket event for real-time menu update
    if (req.app.locals.io) {
      req.app.locals.io.emit('menu-update', {
        action: 'create',
        item: menuItems[0]
      });
      console.log('🔔 Emitted menu-update event for new item');
    }

    // Log menu item creation
    const teaBoyEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.menu.create(teaBoyEmail, tenantName, name, kitchens[0]?.kitchenNumber || 0, true);

    res.status(201).json({
      success: true,
      message: `Menu item created successfully for ${kitchens.length} kitchen(s)`,
      data: menuItems[0], // Return first one for UI compatibility
      kitchensCount: kitchens.length
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
    const { name, nameAr, category, price, imageUrl, emoji, kitchenId, isAvailable } = req.body;

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

    // Find ALL menu items with the same name across all kitchens
    const allItemsWithSameName = await req.tenantPrisma.menuItem.findMany({
      where: { name: existingItem.name }
    });

    // Update ALL items with the same name across all kitchens
    const updatePromises = allItemsWithSameName.map(item =>
      req.tenantPrisma.menuItem.update({
        where: { id: item.id },
        data: updateData
      })
    );

    await Promise.all(updatePromises);

    console.log(`✅ Updated menu item "${existingItem.name}" across ${allItemsWithSameName.length} kitchens`);

    // Get updated item to return
    const updatedItem = await req.tenantPrisma.menuItem.findUnique({
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

    // Emit socket event for real-time menu update
    if (req.app.locals.io) {
      req.app.locals.io.emit('menu-update', {
        action: 'update',
        item: updatedItem
      });
      console.log('🔔 Emitted menu-update event for updated item');
    }

    // Log menu item update
    const teaBoyEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.menu.update(teaBoyEmail, tenantName, existingItem.name, updateData, true);

    res.json({
      success: true,
      message: `Menu item updated successfully across ${allItemsWithSameName.length} kitchen(s)`,
      data: updatedItem,
      kitchensUpdated: allItemsWithSameName.length
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
      where: { id }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Find ALL menu items with the same name across all kitchens
    const allItemsWithSameName = await req.tenantPrisma.menuItem.findMany({
      where: { name: existingItem.name }
    });

    // Delete ALL items with the same name across all kitchens
    const deletePromises = allItemsWithSameName.map(item =>
      req.tenantPrisma.menuItem.delete({
        where: { id: item.id }
      })
    );

    await Promise.all(deletePromises);

    console.log(`✅ Deleted menu item "${existingItem.name}" from ${allItemsWithSameName.length} kitchens`);

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
    const teaBoyEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.menu.delete(teaBoyEmail, tenantName, existingItem.name, true);

    res.json({
      success: true,
      message: `Menu item deleted successfully from ${allItemsWithSameName.length} kitchen(s)`,
      kitchensDeleted: allItemsWithSameName.length
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
