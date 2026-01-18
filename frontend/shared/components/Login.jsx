// frontend/shared/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Coffee, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export const Login = ({ userType = 'admin', onSuccess }) => {
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
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store auth data
        login(data.data.user, data.data.tokens);

        // Redirect based on role
        if (onSuccess) {
          onSuccess(data.data.user);
        } else {
          if (data.data.user.role === 'ADMIN') {
            navigate('/admin');
          } else if (data.data.user.role === 'TEA_BOY') {
            navigate('/tea-boy');
          } else {
            navigate('/');
          }
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeTitle = () => {
    switch (userType) {
      case 'admin':
        return 'Admin Login';
      case 'tea-boy':
        return 'Tea Boy Login';
      case 'meeting-room':
        return 'Meeting Room Access';
      default:
        return 'Login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
            <Coffee className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Tea Management</h1>
          <p className="text-purple-300 text-lg">{getUserTypeTitle()}</p>
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
                  placeholder="admin@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 text-white border-2 border-slate-600 rounded-xl outline-none focus:border-purple-500 transition-all placeholder:text-slate-500"
                  disabled={loading}
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
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
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
          {userType === 'admin' && (
            <div className="mt-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600">
              <p className="text-slate-400 text-xs mb-2 font-semibold">Demo Credentials:</p>
              <p className="text-purple-300 text-xs font-mono">
                Email: admin@demo.com<br />
                Password: admin123
              </p>
            </div>
          )}

          {/* Footer */}
          {userType === 'admin' && (
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  Register Tenant
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};