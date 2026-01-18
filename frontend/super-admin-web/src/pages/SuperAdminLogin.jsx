// frontend/super-admin-web/src/pages/SuperAdminLogin.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../config/api.config';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const isAuth = localStorage.getItem('superAdminAuth');
    if (isAuth === 'true') {
      window.location.href = '/super-admin/dashboard';
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call backend API
      const response = await fetch(getApiUrl('super-admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save auth data
        localStorage.setItem('superAdminAuth', 'true');
        localStorage.setItem('superAdminToken', data.data.tokens.accessToken);
        localStorage.setItem('superAdminRefreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('superAdminEmail', data.data.user.email);
        localStorage.setItem('superAdminName', data.data.user.name);
        localStorage.setItem('superAdminId', data.data.user.id);

        // Save theme preference (default to 'light' if not provided)
        const userTheme = data.data.user.theme || 'light';
        localStorage.setItem('superAdminTheme', userTheme);

        // Set initial activity for auto-logout
        localStorage.setItem('superAdminLastActivity', Date.now().toString());

        // Redirect
        window.location.href = '/super-admin/dashboard';
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-slate-700/50">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
            Super Admin
          </h1>
          <p className="text-slate-400 text-lg">
            Control Panel
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="text-white font-semibold mb-2 block text-sm">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@tea.com"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-white font-semibold mb-2 block text-sm">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3.5 bg-slate-700/50 border-2 border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Login Info */}
        <div className="mt-6 p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-blue-300 text-sm font-bold ml-2">
              Login Information
            </p>
          </div>
          <div className="text-center text-sm text-slate-400">
            <p>Use your Super Admin credentials</p>
            <p className="mt-2 text-xs text-slate-500">
              Email verification required for new accounts
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">
            🫖 Tea Management System v2.0.0
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminLogin;