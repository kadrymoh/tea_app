// backend/src/routes/order.routes.js
const express = require('express');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats
} = require('../controllers/order.controller');
const { requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Protected (Admin only)
 */
router.get('/stats', ...requireRole('ADMIN'), getOrderStats);

/**
 * @route   GET /api/orders
 * @desc    Get all orders
 * @access  Protected (Admin, Tea Boy, Kitchen)
 */
router.get('/', ...requireRole('ADMIN', 'TEA_BOY', 'KITCHEN'), getAllOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Protected (Admin, Tea Boy, Kitchen)
 */
router.get('/:id', ...requireRole('ADMIN', 'TEA_BOY', 'KITCHEN'), getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Protected (Admin, Tea Boy, Kitchen)
 */
router.post('/', ...requireRole('ADMIN', 'TEA_BOY', 'KITCHEN'), createOrder);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Protected (Admin, Tea Boy, Kitchen)
 */
router.put('/:id/status', ...requireRole('ADMIN', 'TEA_BOY', 'KITCHEN'), updateOrderStatus);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Protected (Admin only)
 */
router.delete('/:id', ...requireRole('ADMIN'), deleteOrder);

module.exports = router;
