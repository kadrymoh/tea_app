// frontend/super-admin-web/src/components/AnalyticsTab.jsx
import React from 'react';
import { 
  BarChart3, TrendingUp, Activity, Clock, 
  Building2, Users, Package, DollarSign 
} from 'lucide-react';

const AnalyticsTab = ({ tenants, theme }) => {
  // Calculate analytics data
  const getTopCompanies = () => {
    return [...tenants]
      .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
      .slice(0, 5);
  };

  const getRevenueByPlan = () => {
    const planRevenue = {
      basic: { count: 0, revenue: 0 },
      pro: { count: 0, revenue: 0 },
      enterprise: { count: 0, revenue: 0 }
    };

    tenants.forEach(tenant => {
      if (tenant.isActive && tenant.plan) {
        planRevenue[tenant.plan].count++;
        planRevenue[tenant.plan].revenue += tenant.monthlyFee || 0;
      }
    });

    return planRevenue;
  };

  const getGrowthMetrics = () => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentCompanies = tenants.filter(t => 
      new Date(t.createdAt) >= last30Days
    ).length;

    return {
      newCompanies: recentCompanies,
      activeRate: tenants.length > 0 
        ? ((tenants.filter(t => t.isActive).length / tenants.length) * 100).toFixed(1)
        : 0,
      avgOrdersPerCompany: tenants.length > 0
        ? (tenants.reduce((sum, t) => sum + (t.totalOrders || 0), 0) / tenants.length).toFixed(0)
        : 0
    };
  };

  const topCompanies = getTopCompanies();
  const revenueByPlan = getRevenueByPlan();
  const growthMetrics = getGrowthMetrics();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme.text}`}>{growthMetrics.newCompanies}</p>
          <p className={`text-sm ${theme.textSecondary} mt-1`}>New Companies</p>
          <p className="text-xs text-green-500 mt-2">Last 30 days</p>
        </div>

        <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme.text}`}>{growthMetrics.activeRate}%</p>
          <p className={`text-sm ${theme.textSecondary} mt-1`}>Active Rate</p>
          <p className="text-xs text-blue-500 mt-2">Overall health</p>
        </div>

        <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme.text}`}>{growthMetrics.avgOrdersPerCompany}</p>
          <p className={`text-sm ${theme.textSecondary} mt-1`}>Avg Orders</p>
          <p className="text-xs text-purple-500 mt-2">Per company</p>
        </div>

        <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${theme.text}`}>
            {tenants.reduce((sum, t) => sum + (t.totalUsers || 0), 0)}
          </p>
          <p className={`text-sm ${theme.textSecondary} mt-1`}>Total Users</p>
          <p className="text-xs text-orange-500 mt-2">All companies</p>
        </div>
      </div>

      {/* Top Companies & Revenue Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Companies */}
        <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
          <h3 className={`text-xl font-bold ${theme.text} mb-6 flex items-center`}>
            <BarChart3 className="w-5 h-5 mr-2" />
            Top Companies by Orders
          </h3>
          <div className="space-y-4">
            {topCompanies.map((company, index) => (
              <div key={company.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                  index === 1 ? 'bg-slate-500/20 text-slate-400' :
                  index === 2 ? 'bg-orange-500/20 text-orange-500' :
                  'bg-slate-600/20 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${theme.text}`}>{company.name}</p>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {company.slug} • {company.plan}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${theme.text}`}>
                    {company.totalOrders || 0}
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>orders</p>
                </div>
              </div>
            ))}
            {topCompanies.length === 0 && (
              <div className="text-center py-8">
                <Building2 className={`w-12 h-12 ${theme.textSecondary} mx-auto mb-3`} />
                <p className={theme.textSecondary}>No companies yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
          <h3 className={`text-xl font-bold ${theme.text} mb-6 flex items-center`}>
            <DollarSign className="w-5 h-5 mr-2" />
            Revenue by Plan
          </h3>
          <div className="space-y-4">
            {/* Enterprise */}
            <div className={`p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`font-bold ${theme.text} text-lg`}>Enterprise</p>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {revenueByPlan.enterprise.count} companies
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-500">
                    ${revenueByPlan.enterprise.revenue.toLocaleString()}
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>/ month</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${revenueByPlan.enterprise.count > 0 
                      ? Math.min((revenueByPlan.enterprise.revenue / (revenueByPlan.basic.revenue + revenueByPlan.pro.revenue + revenueByPlan.enterprise.revenue)) * 100, 100) 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Pro */}
            <div className={`p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`font-bold ${theme.text} text-lg`}>Pro</p>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {revenueByPlan.pro.count} companies
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-500">
                    ${revenueByPlan.pro.revenue.toLocaleString()}
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>/ month</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${revenueByPlan.pro.count > 0 
                      ? Math.min((revenueByPlan.pro.revenue / (revenueByPlan.basic.revenue + revenueByPlan.pro.revenue + revenueByPlan.enterprise.revenue)) * 100, 100) 
                      : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Basic */}
            <div className={`p-4 ${theme.surface} rounded-xl border ${theme.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`font-bold ${theme.text} text-lg`}>Basic</p>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {revenueByPlan.basic.count} companies
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-500">
                    ${revenueByPlan.basic.revenue.toLocaleString()}
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>/ month</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${revenueByPlan.basic.count > 0 
                      ? Math.min((revenueByPlan.basic.revenue / (revenueByPlan.basic.revenue + revenueByPlan.pro.revenue + revenueByPlan.enterprise.revenue)) * 100, 100) 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className={`${theme.card} border ${theme.border} rounded-xl p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-6`}>System Usage</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              theme.surface
            } border-4 border-sky-500`}>
              <div className="text-center">
                <p className="text-3xl font-bold text-sky-500">
                  {tenants.reduce((sum, t) => sum + (t.totalRooms || 0), 0)}
                </p>
                <p className={`text-xs ${theme.textSecondary}`}>Total</p>
              </div>
            </div>
            <p className={`font-medium ${theme.text}`}>Meeting Rooms</p>
          </div>

          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              theme.surface
            } border-4 border-orange-500`}>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">
                  {tenants.reduce((sum, t) => sum + (t.totalKitchens || 0), 0)}
                </p>
                <p className={`text-xs ${theme.textSecondary}`}>Total</p>
              </div>
            </div>
            <p className={`font-medium ${theme.text}`}>Kitchens</p>
          </div>

          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              theme.surface
            } border-4 border-green-500`}>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">
                  {tenants.reduce((sum, t) => sum + (t.totalUsers || 0), 0)}
                </p>
                <p className={`text-xs ${theme.textSecondary}`}>Total</p>
              </div>
            </div>
            <p className={`font-medium ${theme.text}`}>Users</p>
          </div>

          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              theme.surface
            } border-4 border-purple-500`}>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">
                  {tenants.reduce((sum, t) => sum + (t.totalOrders || 0), 0)}
                </p>
                <p className={`text-xs ${theme.textSecondary}`}>Total</p>
              </div>
            </div>
            <p className={`font-medium ${theme.text}`}>Orders</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;