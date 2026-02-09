// frontend/admin-web/src/pages/ForcePasswordChange.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { API_CONFIG } from '../config/api.config';

const API_BASE_URL = API_CONFIG.BASE_URL;

const ForcePasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/auth/force-password-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);

        // Redirect to admin panel after 2 seconds
        setTimeout(() => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const tenantSlug = user.tenantSlug;
          navigate(`/${tenantSlug}/admin`, { replace: true });
        }, 2000);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-gray-200 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Changed Successfully!</h2>
          <p className="text-gray-600 mb-2">Your password has been updated.</p>
          <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {/* Password Change Card */}
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-gray-200">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-500 rounded-2xl">
            <Coffee className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Your Password</h1>
          <p className="text-gray-500">You must set a new password to continue</p>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-400 text-blue-600 rounded-xl p-4">
          <p className="text-sm">
            <strong>First Time Login:</strong> For security reasons, you must change your temporary password before accessing the system.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-600 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="text-gray-700 font-semibold mb-2 block text-sm">
              Current Password (Temporary)
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your temporary password"
                className="w-full pl-12 pr-12 py-3 bg-gray-50 text-gray-800 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-gray-700 font-semibold mb-2 block text-sm">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full pl-12 pr-12 py-3 bg-gray-50 text-gray-800 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-gray-700 font-semibold mb-2 block text-sm">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full pl-12 pr-12 py-3 bg-gray-50 text-gray-800 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Tea Management System v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
