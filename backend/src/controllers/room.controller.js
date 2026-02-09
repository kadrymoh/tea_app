// backend/src/controllers/room.controller.js
const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const logger = require('../utils/logger.js');

// ============================================
// GET ALL ROOMS
// ============================================

const getAllRooms = async (req, res) => {
  try {
    const { kitchenId } = req.query;

    const where = {};
    if (kitchenId) where.kitchenId = kitchenId;

    const rooms = await req.tenantPrisma.room.findMany({
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
      data: rooms
    });
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rooms',
      error: error.message
    });
  }
};

// ============================================
// GET ROOM BY ID
// ============================================

const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await req.tenantPrisma.room.findUnique({
      where: { id },
      include: {
        kitchen: true
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room',
      error: error.message
    });
  }
};

// ============================================
// CREATE ROOM
// ============================================

const createRoom = async (req, res) => {
  try {
    const { name, kitchenId, building, floor, capacity } = req.body;

    // Validation
    if (!name || !kitchenId) {
      return res.status(400).json({
        success: false,
        message: 'Room name and kitchen ID are required'
      });
    }

    // Check if kitchen exists
    const kitchen = await req.tenantPrisma.kitchen.findUnique({
      where: { id: kitchenId }
    });

    if (!kitchen) {
      return res.status(404).json({
        success: false,
        message: 'Kitchen not found'
      });
    }

    // Generate unique room token with room_ prefix
    const accessToken = crypto.randomBytes(32).toString('hex');
    const roomToken = `room_${accessToken}`;

    // Create room
    const room = await req.tenantPrisma.room.create({
      data: {
        name,
        kitchenId,
        building: building || null,
        floor: floor || null,
        capacity: capacity || null,
        roomToken,
        isActive: true
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

    // Log room creation
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.room.create(adminEmail, tenantName, name, kitchen.kitchenNumber, true);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    console.error('Error creating room:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.room.create(adminEmail, tenantName, req.body?.name || 'Unknown', 0, false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
};

// ============================================
// UPDATE ROOM
// ============================================

const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, kitchenId, building, floor, capacity, isActive } = req.body;

    // Check if room exists
    const existingRoom = await req.tenantPrisma.room.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // If kitchenId is being updated, check if kitchen exists
    if (kitchenId && kitchenId !== existingRoom.kitchenId) {
      const kitchen = await req.tenantPrisma.kitchen.findUnique({
        where: { id: kitchenId }
      });

      if (!kitchen) {
        return res.status(404).json({
          success: false,
          message: 'Kitchen not found'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (kitchenId !== undefined) updateData.kitchenId = kitchenId;
    if (building !== undefined) updateData.building = building || null;
    if (floor !== undefined) updateData.floor = floor || null;
    if (capacity !== undefined) updateData.capacity = capacity || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update room
    const updatedRoom = await req.tenantPrisma.room.update({
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

    // Log room update
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.room.update(adminEmail, tenantName, existingRoom.name, updateData, true);

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Error updating room:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.room.update(adminEmail, tenantName, req.params?.id || 'Unknown', {}, false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
};

// ============================================
// DELETE ROOM
// ============================================

const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room exists
    const existingRoom = await req.tenantPrisma.room.findUnique({
      where: { id },
      include: {
        orders: true,
        devices: true
      }
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Delete related data first (due to foreign key constraints)
    // 1. Delete order items for orders in this room
    if (existingRoom.orders.length > 0) {
      const orderIds = existingRoom.orders.map(o => o.id);
      await req.tenantPrisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // 2. Delete orders for this room
      await req.tenantPrisma.order.deleteMany({
        where: { roomId: id }
      });
    }

    // 3. Delete room devices
    if (existingRoom.devices.length > 0) {
      await req.tenantPrisma.roomDevice.deleteMany({
        where: { roomId: id }
      });
    }

    // 4. Finally delete the room
    await req.tenantPrisma.room.delete({
      where: { id }
    });

    // Log room deletion
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.room.delete(adminEmail, tenantName, existingRoom.name, true);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    const adminEmail = req.user?.email || 'System';
    const tenantName = req.tenantName || 'Unknown';
    logger.room.delete(adminEmail, tenantName, req.params?.id || 'Unknown', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
};

// ============================================
// GENERATE NEW ROOM TOKEN
// ============================================

const generateRoomToken = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room exists
    const existingRoom = await req.tenantPrisma.room.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Generate new token with room_ prefix
    const accessToken = crypto.randomBytes(32).toString('hex');
    const roomToken = `room_${accessToken}`;

    // Update room
    const updatedRoom = await req.tenantPrisma.room.update({
      where: { id },
      data: { roomToken }
    });

    res.json({
      success: true,
      message: 'Room token generated successfully',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Error generating room token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room token',
      error: error.message
    });
  }
};

// ============================================
// ROOM LOGIN (for meeting room devices)
// ============================================

const roomLogin = async (req, res) => {
  try {
    const { roomToken } = req.body;

    if (!roomToken) {
      return res.status(400).json({
        success: false,
        message: 'Room token is required'
      });
    }

    // Find room by token
    const room = await prisma.room.findUnique({
      where: { roomToken },
      include: {
        kitchen: true,
        tenant: true
      }
    });

    if (!room) {
      return res.status(401).json({
        success: false,
        message: 'Invalid room token'
      });
    }

    if (!room.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Room is not active'
      });
    }

    if (!room.tenant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tenant is not active'
      });
    }

    // Return room data
    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          building: room.building,
          floor: room.floor,
          capacity: room.capacity,
          kitchenId: room.kitchenId,
          tenantId: room.tenantId
        },
        kitchen: {
          id: room.kitchen.id,
          name: room.kitchen.name,
          kitchenNumber: room.kitchen.kitchenNumber
        },
        tenant: {
          id: room.tenant.id,
          name: room.tenant.name,
          slug: room.tenant.slug
        },
        token: roomToken
      }
    });
  } catch (error) {
    console.error('Room login error:', error);
    res.status(500).json({
      success: false,
      message: 'Room login failed',
      error: error.message
    });
  }
};

// ============================================
// GET ROOM MENU (for meeting room devices)
// ============================================

const getRoomMenu = async (req, res) => {
  try {
    const { kitchenId, tenantId } = req.room;

    console.log('🍽️ Getting menu for room:', {
      roomId: req.room.id,
      roomName: req.room.name,
      tenantId,
      kitchenId
    });

    // Get menu items for this room's kitchen
    const menuItems = await prisma.menuItem.findMany({
      where: {
        tenantId: tenantId,
        kitchenId: kitchenId,
        available: true // Only show available items
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📋 Found ${menuItems.length} menu items for kitchen: ${kitchenId}`);

    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error('❌ Error getting room menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu',
      error: error.message
    });
  }
};

// ============================================
// GET ROOM ORDERS (for meeting room devices)
// ============================================

const getRoomOrders = async (req, res) => {
  try {
    const { id: roomId, tenantId } = req.room;
    const { date } = req.query;

    // Get tenant settings to check if order history is enabled
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        enableOrderHistory: true,
        autoClearHistoryEnabled: true,
        autoClearHistoryInterval: true
      }
    });

    console.log(`📋 Loading orders for room ${roomId}:`);
    console.log(`   - Tenant settings:`, tenant);

    let whereClause = {
      roomId: roomId,
      tenantId: tenantId
    };

    // Filter by date if provided
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      whereClause.createdAt = {
        gte: today,
        lt: tomorrow
      };
    }

    // If order history is disabled, only show non-delivered orders
    if (!tenant?.enableOrderHistory) {
      console.log(`🚫 Order history disabled for tenant ${tenantId} - filtering out DELIVERED orders`);
      whereClause.status = {
        not: 'DELIVERED'
      };
    }

    console.log(`   - Where clause:`, JSON.stringify(whereClause, null, 2));

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   - Found ${orders.length} orders`);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error getting room orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

// ============================================
// CREATE ROOM ORDER (for meeting room devices)
// ============================================

const createRoomOrder = async (req, res) => {
  try {
    const { id: roomId, tenantId, kitchenId } = req.room;
    const { items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Validate all menu items exist
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: item.menuItemId,
          tenantId: tenantId,
          kitchenId: kitchenId // Only items for this room's kitchen
        }
      });

      if (!menuItem) {
        console.log(`❌ Menu item not found: ${item.menuItemId} for kitchen: ${kitchenId}`);
        return res.status(400).json({
          success: false,
          message: `Menu item not found or not available for this room's kitchen`
        });
      }

      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${menuItem.name} is not available`
        });
      }

      // Convert sugar level from string to int (0-4)
      let sugarLevel = 2; // default medium
      if (item.sugar) {
        const sugarMap = { 'NONE': 0, 'LOW': 1, 'NORMAL': 2, 'HIGH': 3 };
        sugarLevel = sugarMap[item.sugar] !== undefined ? sugarMap[item.sugar] : 2;
      }

      // Convert ice level from boolean/int to int (0-3)
      let iceLevel = null;
      if (item.ice !== undefined && item.ice !== null) {
        if (typeof item.ice === 'boolean') {
          iceLevel = item.ice ? 2 : 0; // true = medium ice, false = no ice
        } else {
          iceLevel = item.ice; // already a number
        }
      }

      validatedItems.push({
        tenantId: tenantId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        sugar: sugarLevel,
        ice: iceLevel,
        notes: item.notes || ''
      });
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        tenantId: tenantId,
        roomId: roomId,
        kitchenId: kitchenId,
        status: 'PENDING',
        notes: notes || '',
        items: {
          create: validatedItems
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        room: true
      }
    });

    // 🔔 Emit socket event for new order (real-time notification)
    if (req.app.locals.io) {
      // Notify the specific room
      req.app.locals.io.to(`room-${roomId}`).emit('order-update', order);

      // Notify the kitchen
      req.app.locals.io.to(`kitchen-${kitchenId}`).emit('new-order', order);

      console.log(`🔔 Real-time notification sent for new order ${order.id}`);
    }

    // Log order creation
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const kitchen = await prisma.kitchen.findUnique({ where: { id: kitchenId } });
    logger.order.create(order.room?.name || 'Unknown', tenant?.name || 'Unknown', kitchen?.kitchenNumber || 0, validatedItems.length, order.id.slice(0, 8), true);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating room order:', error);
    logger.order.create(req.room?.name || 'Unknown', 'Unknown', 0, 0, 'N/A', false, error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// ============================================
// CLEAR ROOM ORDER HISTORY
// ============================================

const clearRoomOrderHistory = async (req, res) => {
  try {
    const { id: roomId, tenantId } = req.room;

    console.log(`🗑️ Clearing order history for room: ${roomId}`);

    // Delete all DELIVERED and CANCELLED orders for this room
    const result = await prisma.order.deleteMany({
      where: {
        roomId: roomId,
        tenantId: tenantId,
        status: { in: ['DELIVERED', 'CANCELLED'] }
      }
    });

    console.log(`✅ Deleted ${result.count} delivered/cancelled orders`);

    // Log clear history
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    logger.order.clearHistory(room?.name || 'Unknown', tenant?.name || 'Unknown', result.count);

    res.json({
      success: true,
      message: `Cleared ${result.count} order(s) from history`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error clearing order history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear order history',
      error: error.message
    });
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  generateRoomToken,
  roomLogin,
  getRoomMenu,
  getRoomOrders,
  createRoomOrder,
  clearRoomOrderHistory
};
