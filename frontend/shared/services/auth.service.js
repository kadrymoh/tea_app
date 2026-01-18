// frontend/shared/services/auth.service.js

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Login service
 */
export const loginUser = async (email, password, tenantSlug = null) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      tenantSlug,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
};

/**
 * Logout service
 */
export const logoutUser = async (refreshToken) => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Logout failed');
  }

  return data;
};

/**
 * Refresh token service
 */
export const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Token refresh failed');
  }

  return data;
};

/**
 * Get current user
 */
export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get user');
  }

  return data;
};

/**
 * Register new tenant
 */
export const registerTenant = async (tenantData) => {
  const response = await fetch(`${API_BASE_URL}/tenant/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tenantData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
};

/**
 * Check slug availability
 */
export const checkSlugAvailability = async (slug) => {
  const response = await fetch(`${API_BASE_URL}/tenant/check-slug/${slug}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to check slug');
  }

  return data;
};