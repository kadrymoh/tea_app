// frontend/admin-web/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call login from AuthContext (now it calls the API)
      const result = await login(email, password);

      if (result.success) {
        const { user } = result;

        console.log('✅ Login successful!');
        console.log('User:', user.name, '-', user.role);

        if (user.role === 'ADMIN') {
          // Navigate to admin panel
          navigate('/tenant/admin/dashboard', { replace: true });
        } else if (user.role === 'TEA_BOY') {
          // Redirect to Tea Boy app
          console.log('🔄 Redirecting to Tea Boy app...');
          window.location.href = '/tenant/tea-boy/dashboard';
        } else {
          // Fallback
          navigate('/tenant/admin/dashboard', { replace: true });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {/* Login Card */}
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-gray-200">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-blue-500 rounded-2xl">
            <Coffee className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to your company dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-600 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="text-gray-700 font-semibold mb-2 block text-sm">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-800 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-gray-700 font-semibold mb-2 block text-sm">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-800 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

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