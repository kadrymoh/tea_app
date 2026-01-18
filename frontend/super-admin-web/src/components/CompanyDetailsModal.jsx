// frontend/super-admin-web/src/components/CompanyDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Building2, Users, DoorOpen, Coffee, Package, 
  TrendingUp, Clock, CheckCircle, AlertCircle 
} from 'lucide-react';

const CompanyDetailsModal = ({ company, onClose, theme, API_BASE_URL }) => {
  const [details, setDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyDetails();
  }, [company.id]);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      
      const [detailsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/super-admin/tenants/${company.id}`),
        fetch(`${API_BASE_URL}/super-admin/tenants/${company.id}/stats`)
      ]);

      const detailsData = await detailsRes.json();
      const statsData = await statsRes.json();

      if (detailsData.success) setDetails(detailsData.data);
      if (statsData.success) setStats(statsData.data);
    } catch (err) {
      console.error('Failed to load company details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
        <div className={`${theme.card} rounded-2xl border ${theme.border} p-8 max-w-4xl w-full my-8`}>
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
      <div className={`${theme.card} rounded-2xl border ${theme.border} p-8 max-w-6xl w-full my-8 shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-sky-500/10 rounded-xl">
              <Building2 className="w-8 h-8 text-sky-500" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>{company.name}</h2>
              <p className={`text-sm ${theme.textSecondary}`}>
                {company.slug} • Created {new Date(company.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${theme.hover} rounded-lg transition-all`}
          >
            <X className={`w-6 h-6 ${theme.text}`} />
          </button>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`${theme.surface} rounded-xl p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Plan</p>
            <p className={`text-2xl font-bold ${theme.text} capitalize`}>{company.plan}</p>
            <p className={`text-xs ${theme.primaryText} mt-1`}>
              ${company.monthlyFee}/month
            </p>
          </div>
          <div className={`${theme.surface} rounded-xl p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Status</p>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              company.isActive 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {company.isActive ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Inactive
                </>
              )}
            </span>
          </div>
          <div className={`${theme.surface} rounded-xl p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Domain</p>
            <p className={`text-lg font-semibold ${theme.text}`}>
              {company.domain || 'Not set'}
            </p>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-6 h-6 text-blue-400" />
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-400">{stats.totalOrders}</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>Total Orders</p>
              <p className="text-xs text-blue-400 mt-1">{stats.todayOrders} today</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">{stats.totalUsers}</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>Users</p>
              <p className="text-xs text-green-400 mt-1">
                Limit: {company.maxUsers}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <DoorOpen className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-purple-400">{stats.totalRooms}</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>Rooms</p>
              <p className="text-xs text-purple-400 mt-1">
                Limit: {company.maxRooms}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Coffee className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-orange-400">{stats.totalKitchens}</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>Kitchens</p>
              <p className="text-xs text-orange-400 mt-1">
                {stats.totalMenuItems} menu items
              </p>
            </div>
          </div>
        )}

        {/* Users List */}
        {details && details.users && details.users.length > 0 && (
          <div className="mb-6">
            <h3 className={`text-lg font-bold ${theme.text} mb-4 flex items-center`}>
              <Users className="w-5 h-5 mr-2" />
              Users ({details.users.length})
            </h3>
            <div className={`${theme.surface} rounded-xl border ${theme.border} overflow-hidden`}>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className={`${theme.bg} sticky top-0`}>
                    <tr className={`border-b ${theme.border}`}>
                      <th className={`text-left py-3 px-4 ${theme.text} font-semibold text-sm`}>Name</th>
                      <th className={`text-left py-3 px-4 ${theme.text} font-semibold text-sm`}>Email</th>
                      <th className={`text-left py-3 px-4 ${theme.text} font-semibold text-sm`}>Role</th>
                      <th className={`text-left py-3 px-4 ${theme.text} font-semibold text-sm`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.users.map((user) => (
                      <tr key={user.id} className={`border-b ${theme.border} ${theme.hover}`}>
                        <td className={`py-3 px-4 ${theme.text}`}>{user.name}</td>
                        <td className={`py-3 px-4 ${theme.textSecondary} text-sm`}>{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rooms & Kitchens */}
        <div className="grid grid-cols-2 gap-6">
          {/* Rooms */}
          {details && details.rooms && details.rooms.length > 0 && (
            <div>
              <h3 className={`text-lg font-bold ${theme.text} mb-4 flex items-center`}>
                <DoorOpen className="w-5 h-5 mr-2" />
                Rooms ({details.rooms.length})
              </h3>
              <div className={`${theme.surface} rounded-xl border ${theme.border} p-4`}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {details.rooms.map((room) => (
                    <div key={room.id} className={`flex items-center justify-between p-3 ${theme.card} rounded-lg border ${theme.border}`}>
                      <div>
                        <p className={`font-medium ${theme.text}`}>{room.name}</p>
                        <p className={`text-xs ${theme.textSecondary}`}>
                          Floor {room.floor} • {room.building}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Kitchens */}
          {details && details.kitchens && details.kitchens.length > 0 && (
            <div>
              <h3 className={`text-lg font-bold ${theme.text} mb-4 flex items-center`}>
                <Coffee className="w-5 h-5 mr-2" />
                Kitchens ({details.kitchens.length})
              </h3>
              <div className={`${theme.surface} rounded-xl border ${theme.border} p-4`}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {details.kitchens.map((kitchen) => (
                    <div key={kitchen.id} className={`flex items-center justify-between p-3 ${theme.card} rounded-lg border ${theme.border}`}>
                      <div>
                        <p className={`font-medium ${theme.text}`}>{kitchen.name}</p>
                        <p className={`text-xs ${theme.textSecondary}`}>Floor {kitchen.floor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${theme.primary} ${theme.primaryHover} text-white rounded-lg font-medium transition-all`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailsModal;
