// backend/src/routes/menu.routes.js
const express = require('express');
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
} = require('../controllers/menu.controller');
const { requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/menu
 * @desc    Get all menu items
 * @access  Protected (All authenticated users)
 */
router.get('/', ...requireRole('ADMIN', 'TEA_BOY'), getAllMenuItems);

/**
 * @route   GET /api/menu/:id
 * @desc    Get menu item by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', ...requireRole('ADMIN', 'TEA_BOY'), getMenuItemById);

/**
 * @route   POST /api/menu
 * @desc    Create new menu item
 * @access  Protected (Admin + Tea Boy)
 */
router.post('/', ...requireRole('ADMIN', 'TEA_BOY'), createMenuItem);

/**
 * @route   PUT /api/menu/:id
 * @desc    Update menu item
 * @access  Protected (Admin + Tea Boy)
 */
router.put('/:id', ...requireRole('ADMIN', 'TEA_BOY'), updateMenuItem);

/**
 * @route   DELETE /api/menu/:id
 * @desc    Delete menu item
 * @access  Protected (Admin + Tea Boy)
 */
router.delete('/:id', ...requireRole('ADMIN', 'TEA_BOY'), deleteMenuItem);

/**
 * @route   PATCH /api/menu/:id/availability
 * @desc    Toggle menu item availability
 * @access  Protected (Admin + Tea Boy)
 */
router.patch('/:id/availability', ...requireRole('ADMIN', 'TEA_BOY'), toggleAvailability);

module.exports = router;
