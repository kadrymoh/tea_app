// backend/src/routes/room.routes.js
const express = require('express');
const {
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
} = require('../controllers/room.controller');
const { requireRole } = require('../middleware/auth.middleware');
const { authenticateRoom } = require('../middleware/room-auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/room/login
 * @desc    Room device login
 * @access  Public
 */
router.post('/login', roomLogin);

/**
 * @route   GET /api/room/menu
 * @desc    Get menu items for room's kitchen
 * @access  Room Token
 */
router.get('/menu', authenticateRoom, getRoomMenu);

/**
 * @route   GET /api/room/orders
 * @desc    Get orders for this room
 * @access  Room Token
 */
router.get('/orders', authenticateRoom, getRoomOrders);

/**
 * @route   POST /api/room/orders
 * @desc    Create order from room
 * @access  Room Token
 */
router.post('/orders', authenticateRoom, createRoomOrder);

/**
 * @route   DELETE /api/room/orders/history
 * @desc    Clear order history (delete delivered orders)
 * @access  Room Token
 */
router.delete('/orders/history', authenticateRoom, clearRoomOrderHistory);

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms
 * @access  Protected (All authenticated users)
 */
router.get('/', ...requireRole('ADMIN', 'TEA_BOY'), getAllRooms);

/**
 * @route   GET /api/rooms/:id
 * @desc    Get room by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', ...requireRole('ADMIN', 'TEA_BOY'), getRoomById);

/**
 * @route   POST /api/rooms
 * @desc    Create new room
 * @access  Protected (Admin only)
 */
router.post('/', ...requireRole('ADMIN'), createRoom);

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update room
 * @access  Protected (Admin only)
 */
router.put('/:id', ...requireRole('ADMIN'), updateRoom);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete room
 * @access  Protected (Admin only)
 */
router.delete('/:id', ...requireRole('ADMIN'), deleteRoom);

/**
 * @route   POST /api/rooms/:id/generate-token
 * @desc    Generate new room token
 * @access  Protected (Admin only)
 */
router.post('/:id/generate-token', ...requireRole('ADMIN'), generateRoomToken);

module.exports = router;
