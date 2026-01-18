// backend/src/routes/kitchen.routes.js
const express = require('express');
const {
  getAllKitchens,
  getKitchenById,
  createKitchen,
  updateKitchen,
  deleteKitchen
} = require('../controllers/kitchen.controller');
const { requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/kitchens
 * @desc    Get all kitchens
 * @access  Protected (All authenticated users)
 */
router.get('/', ...requireRole('ADMIN', 'TEA_BOY'), getAllKitchens);

/**
 * @route   GET /api/kitchens/:id
 * @desc    Get kitchen by ID
 * @access  Protected (All authenticated users)
 */
router.get('/:id', ...requireRole('ADMIN', 'TEA_BOY'), getKitchenById);

/**
 * @route   POST /api/kitchens
 * @desc    Create new kitchen
 * @access  Protected (Admin only)
 */
router.post('/', ...requireRole('ADMIN'), createKitchen);

/**
 * @route   PUT /api/kitchens/:id
 * @desc    Update kitchen
 * @access  Protected (Admin only)
 */
router.put('/:id', ...requireRole('ADMIN'), updateKitchen);

/**
 * @route   DELETE /api/kitchens/:id
 * @desc    Delete kitchen
 * @access  Protected (Admin only)
 */
router.delete('/:id', ...requireRole('ADMIN'), deleteKitchen);

module.exports = router;
