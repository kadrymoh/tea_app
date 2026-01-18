// backend/src/routes/activation.routes.js
const express = require('express');
const {
  verifyEmail,
  activateAccount,
  resetPassword,
  resendVerification
} = require('../controllers/activation.controller.js');

const router = express.Router();

/**
 * @route   POST /api/activation/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', verifyEmail);

/**
 * @route   POST /api/activation/activate
 * @desc    Activate account and set password
 * @access  Public
 */
router.post('/activate', activateAccount);

/**
 * @route   POST /api/activation/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /api/activation/resend
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend', resendVerification);

module.exports = router;
