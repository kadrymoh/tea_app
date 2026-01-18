// backend/src/controllers/order.controller.js
const { prisma } = require('../lib/prisma');

// ============================================
// GET ALL ORDERS
// ============================================

const getAllOrders = async (req, res) => {
  try {
    const { status, kitchenId, roomId, startDate, endDate } = req.query;

    const where = {};
    if (status) where.status = status;
    if (kitchenId) where.kitchenId = kitchenId;
    if (roomId) where.roomId = roomId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await req.tenantPrisma.order.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true
          }
        },
        kitchen: {
          select: {
            id: true,
            name: true,
            kitchenNumber: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                emoji: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

// ============================================
// GET ORDER BY ID
// ============================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await req.tenantPrisma.order.findUnique({
      where: { id },
      include: {
        room: true,
        kitchen: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

// ============================================
// CREATE ORDER
// ============================================

const createOrder = async (req, res) => {
  try {
    const { roomId, kitchenId, items, notes } = req.body;

    // Validation
    if (!roomId || !kitchenId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Room ID, kitchen ID, and items are required'
      });
    }

    // Check if room exists
    const room = await req.tenantPrisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
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

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await req.tenantPrisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item ${item.menuItemId} not found`
        });
      }

      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${menuItem.name} is not available`
        });
      }

      const quantity = item.quantity || 1;
      const itemTotal = menuItem.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: menuItem.id,
        quantity,
        price: menuItem.price,
        subtotal: itemTotal
      });
    }

    // Create order with items
    const order = await req.tenantPrisma.order.create({
      data: {
        roomId,
        kitchenId,
        totalAmount,
        notes: notes || null,
        status: 'PENDING',
        items: {
          create: orderItems
        }
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true
          }
        },
        kitchen: {
          select: {
            id: true,
            name: true,
            kitchenNumber: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                emoji: true,
                price: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// ============================================
// UPDATE ORDER STATUS
// ============================================

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;

    // Validation
    const validStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if order exists
    const existingOrder = await req.tenantPrisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build update data
    const updateData = { status };

    if (status === 'CANCELLED' && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    // Update order
    const updatedOrder = await req.tenantPrisma.order.update({
      where: { id },
      data: updateData,
      include: {
        room: true,
        kitchen: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    // 🔔 Emit socket event for order status update (real-time notification)
    if (req.app.locals.io) {
      // Notify the specific room
      req.app.locals.io.to(`room-${updatedOrder.roomId}`).emit('order-update', updatedOrder);

      // Notify the kitchen
      req.app.locals.io.to(`kitchen-${updatedOrder.kitchenId}`).emit('order-update', updatedOrder);

      console.log(`🔔 Real-time notification sent for order status update: ${updatedOrder.id} → ${status}`);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// ============================================
// DELETE ORDER
// ============================================

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingOrder = await req.tenantPrisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Delete order (will cascade delete order items)
    await req.tenantPrisma.order.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

// ============================================
// GET ORDER STATISTICS
// ============================================

const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      req.tenantPrisma.order.count(),
      req.tenantPrisma.order.count({
        where: { createdAt: { gte: today } }
      }),
      req.tenantPrisma.order.count({
        where: { status: 'PENDING' }
      }),
      req.tenantPrisma.order.count({
        where: { status: 'DELIVERED' }
      }),
      req.tenantPrisma.order.count({
        where: { status: 'CANCELLED' }
      }),
      req.tenantPrisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        revenue: totalRevenue._sum.totalAmount || 0
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats
};
