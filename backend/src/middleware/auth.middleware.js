// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to authenticate requests using JWT tokens
 */
const authenticateToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    // Map userId to id for backward compatibility
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Failed to authenticate token'
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * NOTE: This middleware automatically applies authentication + tenant context
 * Use this instead of manually chaining authenticateToken, verifyTenantActive, injectTenantContext
 */
const requireRole = (...allowedRoles) => {
  return [
    // Step 1: Authenticate
    authenticateToken,

    // Step 2: Check role
    (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }
      next();
    },

    // Step 3: Verify tenant and inject context
    (req, res, next) => {
      // Import here to avoid circular dependency
      const { verifyTenantActive, injectTenantContext } = require('./tenant.middleware');

      verifyTenantActive(req, res, (err) => {
        if (err) return next(err);
        injectTenantContext(req, res, next);
      });
    }
  ];
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Silently fail - just don't attach user
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};