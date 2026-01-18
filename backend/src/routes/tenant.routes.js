// backend/src/routes/tenant.routes.js
const express = require('express');
const {
  registerTenant,
  getTenantDetails,
  updateTenant,
  checkSlugAvailability,
  getTenantStats
} = require('../controllers/tenant.controller.js');
const { requireRole } = require('../middleware/auth.middleware.js');

const router = express.Router();

/**
 * @route   POST /api/tenant/register
 * @desc    Register new tenant (company signup)
 * @access  Public
 */
router.post('/register', registerTenant);

/**
 * @route   GET /api/tenant/check-slug/:slug
 * @desc    Check if slug is available
 * @access  Public
 */
router.get('/check-slug/:slug', checkSlugAvailability);

/**
 * @route   GET /api/tenant
 * @desc    Get current tenant details
 * @access  Protected (Admin only)
 */
router.get('/', ...requireRole('ADMIN'), getTenantDetails);

/**
 * @route   PUT /api/tenant
 * @desc    Update tenant details
 * @access  Protected (Admin only)
 */
router.put('/', ...requireRole('ADMIN'), updateTenant);

/**
 * @route   GET /api/tenant/stats
 * @desc    Get tenant statistics
 * @access  Protected (Admin only)
 */
router.get('/stats', ...requireRole('ADMIN'), getTenantStats);

module.exports = router;