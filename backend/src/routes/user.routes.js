// backend/src/routes/user.routes.js
const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller.js');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware.js');

const router = express.Router();

// ============================================
// PROFILE ROUTES (All authenticated users)
// ============================================

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Protected (All roles)
 */
router.get('/profile', authenticateToken, getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Protected (All roles)
 */
router.put('/profile', authenticateToken, updateUserProfile);

/**
 * @route   POST /api/users/change-password
 * @desc    Change current user password
 * @access  Protected (All roles)
 */
router.post('/change-password', authenticateToken, changeUserPassword);

// ============================================
// USER MANAGEMENT ROUTES (Admin only)
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users in organization
 * @access  Protected (Admin only)
 */
router.get('/', authenticateToken, requireRole('ADMIN'), getAllUsers);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Protected (Admin only)
 */
router.post('/', authenticateToken, requireRole('ADMIN'), createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Protected (Admin only)
 */
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete/Deactivate user
 * @access  Protected (Admin only)
 */
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteUser);

module.exports = router;
