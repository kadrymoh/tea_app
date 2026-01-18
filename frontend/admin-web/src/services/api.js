// frontend/admin-web/src/services/api.js
import { API_CONFIG } from '../config/api.config';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  // ⭐ FIXED: Check both accessToken and token
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic request handler
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    // Handle unauthorized (token expired)
    if (response.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
      throw new Error('Unauthorized - please login again');
    }

    if (!data.success && response.status >= 400) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    // ⭐ Save tokens with correct names
    if (data.success) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('token', data.data.accessToken); // Backward compatibility
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('tenant', JSON.stringify(data.data.tenant));
    }
    
    return data;
  },

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Clear local storage first
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    
    // Call logout endpoint
    return fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then((res) => res.json());
  },

  getCurrentUser: () => apiRequest('/auth/me'),
  
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('token', data.data.accessToken);
    }
    
    return data;
  }
};

// ============================================
// ROOMS API
// ============================================
export const roomsAPI = {
  getAll: () => apiRequest('/rooms'),
  getById: (id) => apiRequest(`/rooms/${id}`),
  create: (data) => apiRequest('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/rooms/${id}`, { method: 'DELETE' }),
};

// ============================================
// KITCHENS API
// ============================================
export const kitchensAPI = {
  getAll: () => apiRequest('/kitchens'),
  getById: (id) => apiRequest(`/kitchens/${id}`),
  create: (data) => apiRequest('/kitchens', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/kitchens/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/kitchens/${id}`, { method: 'DELETE' }),
};

// ============================================
// USERS API
// ============================================
export const usersAPI = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
};

// ============================================
// MENU API
// ============================================
export const menuAPI = {
  getAll: (available) => {
    const query = available !== undefined ? `?available=${available}` : '';
    return apiRequest(`/menu${query}`);
  },
  getById: (id) => apiRequest(`/menu/${id}`),
  create: (data) => apiRequest('/menu', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/menu/${id}`, { method: 'DELETE' }),
  toggleAvailability: (id) => apiRequest(`/menu/${id}/availability`, { method: 'PATCH' }),
};

// ============================================
// ORDERS API
// ============================================
export const ordersAPI = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/orders/${id}`),
  create: (data) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status, cancelReason) =>
    apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, cancelReason }),
    }),
  delete: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE' }),
};

// ============================================
// STATS API
// ============================================
export const statsAPI = {
  get: () => apiRequest('/stats'),
};

// ============================================
// TENANT API
// ============================================
export const tenantAPI = {
  getCurrent: () => apiRequest('/tenant'),
  update: (data) => apiRequest('/tenant', { method: 'PUT', body: JSON.stringify(data) }),
  getStats: () => apiRequest('/tenant/stats'),
};

export default {
  auth: authAPI,
  rooms: roomsAPI,
  kitchens: kitchensAPI,
  users: usersAPI,
  menu: menuAPI,
  orders: ordersAPI,
  stats: statsAPI,
  tenant: tenantAPI,
};