// frontend/super-admin-web/src/components/SettingsTab.jsx
import React from 'react';
import {
  Settings, Database, Shield,
  Code, Server, Sun, Moon, Building2, Activity, BarChart3
} from 'lucide-react';

const SettingsTab = ({ theme, darkMode, toggleTheme }) => {
  const systemInfo = {
    version: '2.0.0',
    environment: 'Production',
    database: 'PostgreSQL 16',
    nodeVersion: 'v20.x'
  };

  return (
    <div className="space-y-6">
      {/* User Preferences */}
      <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-6 flex items-center`}>
          <Settings className="w-5 h-5 mr-2" />
          User Preferences
        </h3>
        <div className="space-y-4">
          {/* Dark Mode Toggle */}
          <div className={`flex items-center justify-between p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-indigo-500/10' : 'bg-yellow-500/10'}`}>
                {darkMode ? (
                  <Moon className="w-6 h-6 text-indigo-500" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-500" />
                )}
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
              <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-slate-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-6 flex items-center`}>
          <Server className="w-5 h-5 mr-2" />
          System Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className={`p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>Version</p>
            <p className={`text-2xl font-bold ${theme.text}`}>{systemInfo.version}</p>
          </div>
          <div className={`p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>Environment</p>
            <p className={`text-2xl font-bold ${theme.text}`}>{systemInfo.environment}</p>
          </div>
          <div className={`p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>Database</p>
            <p className={`text-xl font-bold ${theme.text}`}>{systemInfo.database}</p>
          </div>
          <div className={`p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>Node.js</p>
            <p className={`text-xl font-bold ${theme.text}`}>{systemInfo.nodeVersion}</p>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-6 flex items-center`}>
          <Settings className="w-5 h-5 mr-2" />
          Technology Stack
        </h3>
        <div className="space-y-4">
          {/* API Settings */}
          <div className={`flex items-center justify-between p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sky-500/10 rounded-lg">
                <Code className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <p className={`font-medium ${theme.text}`}>API Server</p>
                <p className={`text-sm ${theme.textSecondary}`}>
                  Express.js + Socket.IO
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
              Running
            </span>
          </div>

          {/* Database */}
          <div className={`flex items-center justify-between p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Database className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className={`font-medium ${theme.text}`}>Database</p>
                <p className={`text-sm ${theme.textSecondary}`}>
                  PostgreSQL + Prisma ORM
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
              Connected
            </span>
          </div>

          {/* Security */}
          <div className={`flex items-center justify-between p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className={`font-medium ${theme.text}`}>Authentication</p>
                <p className={`text-sm ${theme.textSecondary}`}>
                  JWT + Role-based Access Control
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Active Features */}
      <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-6 flex items-center`}>
          <Activity className="w-5 h-5 mr-2" />
          Active Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Multi-tenancy */}
          <div className={`flex items-center space-x-3 p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <p className={`font-medium ${theme.text}`}>Multi-tenancy</p>
          </div>

          {/* Real-time Updates */}
          <div className={`flex items-center space-x-3 p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <p className={`font-medium ${theme.text}`}>Real-time Updates</p>
          </div>

          {/* Advanced Analytics */}
          <div className={`flex items-center space-x-3 p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <p className={`font-medium ${theme.text}`}>Advanced Analytics</p>
          </div>

          {/* Role-based Access */}
          <div className={`flex items-center space-x-3 p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <p className={`font-medium ${theme.text}`}>Role-based Access</p>
          </div>

          {/* Order Management */}
          <div className={`flex items-center space-x-3 p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Server className="w-5 h-5 text-orange-500" />
            </div>
            <p className={`font-medium ${theme.text}`}>Order Management</p>
          </div>

          {/* User Management */}
          <div className={`flex items-center space-x-3 p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
            <div className="p-2 bg-sky-500/10 rounded-lg">
              <Database className="w-5 h-5 text-sky-500" />
            </div>
            <p className={`font-medium ${theme.text}`}>User Management</p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-4`}>About Tea Management System</h3>
        <div className={`space-y-3 ${theme.textSecondary}`}>
          <p className="flex items-center gap-2">
            <span className="text-2xl">🫖</span>
            <strong className={theme.text}>Tea Management System</strong> - Complete SaaS Solution
          </p>
          <p className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            Built with React, Node.js, Express, Socket.IO, Prisma, PostgreSQL
          </p>
          <p className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            UI: Tailwind CSS, Lucide Icons
          </p>
          <p className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            Features: Real-time updates, Multi-tenancy, Role-based access
          </p>
          <p className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Version {systemInfo.version} • Last Updated: January 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;