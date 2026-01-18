// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://teaapp.twaasol.com/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://teaapp.twaasol.com',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Tea Management - Super Admin'
};

// Helper function to get full API endpoint
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};
