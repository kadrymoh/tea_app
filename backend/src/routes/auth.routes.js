// backend/src/routes/auth.routes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, logout, refreshToken, getCurrentUser, forcePasswordChange } = require('../controllers/auth.controller.js');
const { authenticateToken } = require('../middleware/auth.middleware.js');

const router = express.Router();

// Rate limiting for login attempts - prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginLimiter, login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke session
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   POST /api/auth/force-password-change
 * @desc    Force password change for first-time login
 * @access  Protected
 */
router.post('/force-password-change', authenticateToken, forcePasswordChange);

module.exports = router;