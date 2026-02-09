import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Lock, Save, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader, Settings as SettingsIcon, Sun, Moon
} from 'lucide-react';
import { API_CONFIG } from '../config/api.config';

const API_BASE_URL = API_CONFIG.BASE_URL;

const Settings = ({ darkMode = false, toggleTheme, theme: parentTheme }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeSection, setActiveSection] = useState('preferences');

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Organization Settings State
  const [orgSettings, setOrgSettings] = useState({
    enableOrderHistory: true,
    autoClearHistoryEnabled: false,
    autoClearHistoryInterval: 60 // minutes
  });

  // Theme - use parent theme if provided, otherwise create own
  const theme = parentTheme || (darkMode ? {
    bg: 'bg-slate-900',
    card: 'bg-slate-800',
    input: 'bg-slate-700 border-slate-600 text-white',
    text: 'text-white',
    textSecondary: 'text-slate-400',
    border: 'border-slate-700',
    hover: 'hover:bg-slate-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: 'bg-slate-700 hover:bg-slate-600',
    surface: 'bg-slate-700/50'
  } : {
    bg: 'bg-gray-50',
    card: 'bg-white',
    input: 'bg-white border-gray-300 text-gray-900',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-50',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300',
    surface: 'bg-gray-100'
  });

  // Load organization settings
  useEffect(() => {
    loadOrgSettings();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  const loadOrgSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tenant`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();

      if (data.success) {
        setOrgSettings({
          enableOrderHistory: data.data.enableOrderHistory ?? true,
          autoClearHistoryEnabled: data.data.autoClearHistoryEnabled ?? false,
          autoClearHistoryInterval: data.data.autoClearHistoryInterval ?? 60
        });
      }
    } catch (err) {
      console.error('Failed to load organization settings:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrgSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      console.log('📤 Sending organization settings:', orgSettings);

      const res = await fetch(`${API_BASE_URL}/tenant`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(orgSettings)
      });

      console.log('📥 Response status:', res.status);
      const data = await res.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        setMessage({ type: 'success', text: 'Organization settings updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || data.error || 'Failed to update settings' });
      }
    } catch (err) {
      console.error('❌ Error updating settings:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold ${theme.text} mb-2`}>Settings</h2>
        <p className={theme.textSecondary}>Manage your account settings and preferences</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500 text-green-600'
            : 'bg-red-500/10 border-red-500 text-red-600'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-2 p-2 ${theme.card} rounded-xl border ${theme.border}`}>
        <button
          onClick={() => setActiveSection('preferences')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
            activeSection === 'preferences'
              ? 'bg-blue-600 text-white shadow-lg'
              : `${theme.textSecondary} ${theme.hover}`
          }`}
        >
          <SettingsIcon className="w-5 h-5 inline mr-2" />
          User Preferences
        </button>
        <button
          onClick={() => setActiveSection('password')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
            activeSection === 'password'
              ? 'bg-blue-600 text-white shadow-lg'
              : `${theme.textSecondary} ${theme.hover}`
          }`}
        >
          <Lock className="w-5 h-5 inline mr-2" />
          Update Password
        </button>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveSection('organization')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
              activeSection === 'organization'
                ? 'bg-blue-600 text-white shadow-lg'
                : `${theme.textSecondary} ${theme.hover}`
            }`}
          >
            <SettingsIcon className="w-5 h-5 inline mr-2" />
            Organization Settings
          </button>
        )}
      </div>

      {/* User Preferences Section */}
      {activeSection === 'preferences' && (
        <div className="space-y-6">
          {/* User Preferences */}
          <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
            <h3 className={`text-xl font-bold ${theme.text} mb-6 flex items-center`}>
              <SettingsIcon className="w-5 h-5 mr-2" />
              User Preferences
            </h3>
            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className={`flex items-center justify-between p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-yellow-500/10'}`}>
                    {darkMode ? <Moon className="w-6 h-6 text-indigo-500" /> : <Sun className="w-6 h-6 text-yellow-500" />}
                  </div>
                  <div>
                    <p className={`font-medium ${theme.text}`}>Theme Mode</p>
                    <p className={`text-sm ${theme.textSecondary}`}>
                      {darkMode ? 'Dark mode is active' : 'Light mode is active'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleTheme}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Section */}
      {activeSection === 'password' && (
        <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
          <h3 className={`text-2xl font-bold ${theme.text} mb-6`}>Change Password</h3>

          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className={`block text-sm font-bold ${theme.text} mb-2`}>
                <Lock className="w-4 h-4 inline mr-2" />
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12`}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:${theme.text} transition-colors`}
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className={`block text-sm font-bold ${theme.text} mb-2`}>
                <Lock className="w-4 h-4 inline mr-2" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12`}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:${theme.text} transition-colors`}
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-bold ${theme.text} mb-2`}>
                <Lock className="w-4 h-4 inline mr-2" />
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:${theme.text} transition-colors`}
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className={`p-4 rounded-xl border ${theme.border} ${theme.card}`}>
              <p className={`text-sm font-bold ${theme.text} mb-2`}>Password Requirements:</p>
              <ul className={`text-sm ${theme.textSecondary} space-y-1`}>
                <li className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-2 ${passwordForm.newPassword.length >= 6 ? 'text-green-500' : 'text-gray-400'}`} />
                  At least 6 characters
                </li>
                <li className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-2 ${passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword ? 'text-green-500' : 'text-gray-400'}`} />
                  Passwords match
                </li>
                <li className="flex items-center">
                  <CheckCircle className={`w-4 h-4 mr-2 ${passwordForm.currentPassword && passwordForm.newPassword !== passwordForm.currentPassword ? 'text-green-500' : 'text-gray-400'}`} />
                  Different from current password
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                loading ? 'bg-gray-500 cursor-not-allowed' : theme.button
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Changing Password...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Organization Settings Section */}
      {activeSection === 'organization' && user?.role === 'ADMIN' && (
        <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
          <h3 className={`text-2xl font-bold ${theme.text} mb-6`}>Organization Settings</h3>

          <form onSubmit={handleUpdateOrgSettings} className="space-y-6">
            {/* Order History Settings */}
            <div className={`${theme.surface} rounded-xl p-5 space-y-4`}>
              <h4 className={`text-lg font-bold ${theme.text} mb-3`}>Order History Settings</h4>

              {/* Enable Order History */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`font-semibold ${theme.text} block mb-1`}>
                    Enable Order History
                  </label>
                  <p className={`${theme.textSecondary} text-sm`}>
                    If disabled, orders will disappear from meeting room interface after delivery
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgSettings.enableOrderHistory}
                      onChange={(e) => setOrgSettings({ ...orgSettings, enableOrderHistory: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Auto Clear History */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`font-semibold ${theme.text} block mb-1`}>
                    Auto-Clear History
                  </label>
                  <p className={`${theme.textSecondary} text-sm`}>
                    Automatically delete delivered orders after specified time interval
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgSettings.autoClearHistoryEnabled}
                      onChange={(e) => setOrgSettings({ ...orgSettings, autoClearHistoryEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Clear Interval */}
              {orgSettings.autoClearHistoryEnabled && (
                <div>
                  <label className={`font-semibold ${theme.text} block mb-2`}>
                    Clear History Every (minutes)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={orgSettings.autoClearHistoryInterval}
                      onChange={(e) => setOrgSettings({ ...orgSettings, autoClearHistoryInterval: parseInt(e.target.value) || 60 })}
                      className={`flex-1 px-4 py-3 rounded-xl border ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="60"
                    />
                    <span className={`${theme.textSecondary} text-sm whitespace-nowrap`}>
                      {orgSettings.autoClearHistoryInterval >= 60
                        ? `(${Math.floor(orgSettings.autoClearHistoryInterval / 60)}h ${orgSettings.autoClearHistoryInterval % 60}m)`
                        : 'minutes'}
                    </span>
                  </div>
                  <p className={`${theme.textSecondary} text-xs mt-2`}>
                    Recommended: 60 minutes (1 hour) or more
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Saving Changes...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Save className="w-5 h-5 mr-2" />
                  Save Organization Settings
                </span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;
