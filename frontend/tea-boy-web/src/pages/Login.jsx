// frontend/tea-boy-web/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, User, Lock, AlertCircle, Loader, Building2 } from 'lucide-react';
import { getApiUrl } from '../config/api.config';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [company, setCompany] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!company || !username || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(getApiUrl('auth/kitchen/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, tenantSlug: company }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        const { kitchen, tokens } = data.data;

        console.log('✅ Kitchen login successful!');
        console.log('Kitchen:', kitchen.name, '- Number:', kitchen.kitchenNumber);

        // Store kitchen auth data
        const kitchenUser = {
          id: kitchen.id,
          name: kitchen.name,
          kitchenId: kitchen.id,
          kitchenNumber: kitchen.kitchenNumber,
          username: kitchen.username,
          tenantId: kitchen.tenantId,
          tenantName: kitchen.tenantName,
          tenantSlug: kitchen.tenantSlug,
          role: 'KITCHEN'
        };

        login(kitchenUser, tokens);

        // Store tenant info
        localStorage.setItem('tenant', JSON.stringify({
          id: kitchen.tenantId,
          name: kitchen.tenantName,
          slug: kitchen.tenantSlug
        }));

        // Store kitchen info
        localStorage.setItem('kitchen', JSON.stringify(kitchen));

        // Navigate to dashboard
        console.log('🔗 Navigating to: /tenant/kitchen/dashboard');
        navigate('/tenant/kitchen/dashboard', { replace: true });
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);

      // Better error handling
      if (err.name === 'AbortError') {
        setError('Connection timeout. The server is taking too long to respond. Please check your internet connection and try again.');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Network error. Please check your internet connection and make sure the server is running.');
      } else {
        setError('Connection error. Please make sure the server is running and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4">
            <Coffee className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Kitchen Dashboard</h1>
          <p className="text-gray-500 text-lg">Kitchen Staff Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-400 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Company Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Company
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="company-name"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Kitchen Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kitchen1"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Kitchen</span>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700 text-center">
              <strong>Note:</strong> Use the credentials provided by your administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Tea Management System v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
