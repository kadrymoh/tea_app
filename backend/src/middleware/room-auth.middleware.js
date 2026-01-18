// backend/src/middleware/room-auth.middleware.js
const { prisma } = require('../lib/prisma.js');

/**
 * Middleware to authenticate meeting room devices using room token
 * Usage: Add this to routes that should be accessed by room devices
 */
const authenticateRoom = async (req, res, next) => {
  try {
    console.log('🔐 Room authentication middleware called');

    // Extract token from Authorization header or query parameter
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1] || req.query.roomToken;

    console.log('🔑 Room token received:', token ? token.substring(0, 20) + '...' : 'NONE');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Room token is required'
      });
    }

    // Find room by token
    console.log('🔍 Searching for room with token...');
    const room = await prisma.room.findUnique({
      where: { roomToken: token },
      include: {
        kitchen: true,
        tenant: true
      }
    });

    console.log('📦 Room found:', room ? `${room.name} (${room.id})` : 'NOT FOUND');

    if (!room) {
      console.log('❌ Room not found with this token');
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Room token is invalid or expired'
      });
    }

    if (!room.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Room inactive',
        message: 'This room has been deactivated'
      });
    }

    if (!room.tenant.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Tenant inactive',
        message: 'The tenant account is inactive'
      });
    }

    // Attach room info to request
    req.room = room;
    req.user = {
      id: room.id,
      tenantId: room.tenantId,
      kitchenId: room.kitchenId,
      role: 'ROOM',
      type: 'room'
    };

    next();
  } catch (error) {
    console.error('Room authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Failed to authenticate room'
    });
  }
};

module.exports = {
  authenticateRoom
};
