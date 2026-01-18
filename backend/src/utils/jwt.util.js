// backend/src/utils/jwt.util.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload, 
    JWT_SECRET, 
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'tea-management-system',
      audience: 'tea-management-api'
    }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId, tenantId) => {
  return jwt.sign(
    { userId, tenantId, type: 'refresh' },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'tea-management-system',
      audience: 'tea-management-api'
    }
  );
};

/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId, payload.tenantId);

  // Parse expiration time
  const expiresIn = parseExpirationTime(JWT_EXPIRES_IN);

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'tea-management-system',
      audience: 'tea-management-api'
    });

    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'tea-management-system',
      audience: 'tea-management-api'
    });

    if (decoded.type !== 'refresh') {
      return null;
    }

    return {
      userId: decoded.userId,
      tenantId: decoded.tenantId
    };
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Parse expiration time string to seconds
 */
function parseExpirationTime(expiration) {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };

  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) return 604800; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];

  return value * (units[unit] || 1);
}

/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader
};