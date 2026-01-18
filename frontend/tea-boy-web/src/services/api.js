// frontend/tea-boy-web/src/services/api.js
import { API_CONFIG } from '../config/api.config';

const API_BASE_URL = API_CONFIG.BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

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

    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
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

export const authAPI = {
  login: (email, password) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((res) => res.json()),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).then((res) => res.json());
  },
};

export const ordersAPI = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders${query ? `?${query}` : ''}`);
  },
  updateStatus: (id, status, cancelReason) =>
    apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, cancelReason }),
    }),
};

export const menuAPI = {
  getAll: () => apiRequest('/menu'),
  create: (data) => apiRequest('/menu', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/menu/${id}`, { method: 'DELETE' }),
  toggleAvailability: (id) => apiRequest(`/menu/${id}/availability`, { method: 'PATCH' }),
};

export default { auth: authAPI, orders: ordersAPI, menu: menuAPI };