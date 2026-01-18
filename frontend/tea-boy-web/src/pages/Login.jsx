// frontend/tea-boy-web/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { getApiUrl } from '../config/api.config';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { user } = data.data;

        // Check if user is TEA_BOY
        if (user.role !== 'TEA_BOY') {
          setError('Access denied. Tea Boy account required.');
          return;
        }

        console.log('✅ Login successful!');
        console.log('User:', user.name, '-', user.role);
        console.log('Kitchen Number:', user.kitchenNumber);

        // Store auth data (including tenant info)
        login(user, data.data.tokens);

        // Store tenant info
        localStorage.setItem('tenant', JSON.stringify({
          id: user.tenantId,
          name: user.tenantName,
          slug: user.tenantSlug
        }));

        // Navigate to dashboard
        const dashboardUrl = '/tenant/tea-boy/dashboard';

        console.log('🔗 Navigating to:', dashboardUrl);
        console.log('Kitchen Number:', user.kitchenNumber);
        navigate(dashboardUrl, { replace: true });
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl mb-4">
            <Coffee className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Tea Boy Dashboard</h1>
          <p className="text-purple-300 text-lg">Kitchen Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border-2 border-purple-500/50 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ahmed@demo.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 text-white border-2 border-slate-600 rounded-xl outline-none focus:border-purple-500 transition-all placeholder:text-slate-500"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 text-white border-2 border-slate-600 rounded-xl outline-none focus:border-purple-500 transition-all placeholder:text-slate-500"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600">
            <p className="text-slate-400 text-xs mb-2 font-semibold">Demo Credentials:</p>
            <p className="text-purple-300 text-xs font-mono mb-2">
              Email: ahmed@demo.com<br />
              Password: teaboy123
            </p>
            <p className="text-purple-300 text-xs font-mono">
              Email: mohammed@demo.com<br />
              Password: teaboy123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Tea Management System v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;