// frontend/super-admin-web/src/pages/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Building2, Users, DollarSign, TrendingUp, Plus, Edit, Trash2,
  CheckCircle, XCircle, Search, Sun, Moon, BarChart3, Package,
  Settings, Shield, Activity, AlertCircle, Eye, Power, Coffee,
  UserCog, Mail, Phone, LayoutDashboard, Save, X, Menu, ChevronLeft
} from 'lucide-react';

// Import components (make sure to create these files)
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import EditCustomerModal from '../components/EditCustomerModal';
import AnalyticsTab from '../components/AnalyticsTab';
import SettingsTab from '../components/SettingsTab';
import { API_CONFIG } from '../config/api.config';

const SuperAdminDashboard = () => {
  const API_BASE_URL = API_CONFIG.BASE_URL;

  // ============================================
  // STATE
  // ============================================
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [token, setToken] = useState(localStorage.getItem('superAdminToken') || '');
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Super Admins State
  const [superAdmins, setSuperAdmins] = useState([]);
  const [superAdminModal, setSuperAdminModal] = useState(null);
  const [superAdminForm, setSuperAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  // Organization Admins State
  const [orgAdmins, setOrgAdmins] = useState([]);
  const [orgAdminModal, setOrgAdminModal] = useState(null);
  const [orgAdminForm, setOrgAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    tenantId: ''
  });
  const [selectedTenant, setSelectedTenant] = useState('all');

  // Plans State
  const [plans, setPlans] = useState([
    { id: 'basic', name: 'Basic', maxRooms: 10, maxUsers: 5, maxOrders: 1000, monthlyFee: 99, features: ['Up to 10 rooms', '5 users', '1000 orders/month', 'Basic support'] },
    { id: 'pro', name: 'Professional', maxRooms: 50, maxUsers: 20, maxOrders: 5000, monthlyFee: 299, features: ['Up to 50 rooms', '20 users', '5000 orders/month', 'Priority support', 'Advanced analytics'] },
    { id: 'enterprise', name: 'Enterprise', maxRooms: 999, maxUsers: 999, maxOrders: 99999, monthlyFee: 999, features: ['Unlimited rooms', 'Unlimited users', 'Unlimited orders', '24/7 support', 'Custom features', 'Dedicated account manager'] }
  ]);
  const [planModal, setPlanModal] = useState(null);
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    maxRooms: '',
    maxUsers: '',
    maxOrders: '',
    monthlyFee: '',
    features: []
  });

  // Settings State
  const [settingsTab, setSettingsTab] = useState('preferences');

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);

  const [tenantForm, setTenantForm] = useState({
    name: '',
    slug: '',
    domain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    plan: 'basic'
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  // Create headers with authorization token
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  // ============================================
  // THEME
  // ============================================
  const theme = darkMode ? {
    bg: 'bg-slate-900',
    surface: 'bg-slate-800',
    text: 'text-slate-100',
    textSecondary: 'text-slate-400',
    border: 'border-slate-700',
    primary: 'bg-sky-500',
    primaryHover: 'hover:bg-sky-600',
    primaryText: 'text-sky-400',
    card: 'bg-slate-800/50',
    input: 'bg-slate-700 border-slate-600 text-white',
    hover: 'hover:bg-slate-700'
  } : {
    bg: 'bg-white',
    surface: 'bg-slate-50',
    text: 'text-slate-900',
    textSecondary: 'text-slate-600',
    border: 'border-slate-200',
    primary: 'bg-sky-500',
    primaryHover: 'hover:bg-sky-600',
    primaryText: 'text-sky-500',
    card: 'bg-white',
    input: 'bg-white border-slate-300 text-slate-900',
    hover: 'hover:bg-slate-50'
  };

  // ============================================
  // LOAD DATA
  // ============================================
  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/super-admin/tenants`, {
        headers: getHeaders()
      });
      const data = await res.json();

      if (data.success) {
        setTenants(data.data);
      } else {
        setError(data.message || 'Failed to load companies');
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/stats`, {
        headers: getHeaders()
      });
      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // ============================================
  // LOAD USER PROFILE & THEME
  // ============================================

  const loadUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/profile`, {
        headers: getHeaders()
      });

      const data = await res.json();

      if (data.success && data.data.theme) {
        const isDark = data.data.theme === 'dark';
        setDarkMode(isDark);
        // حفظ في localStorage للاستخدام المؤقت
        localStorage.setItem('superAdminTheme', data.data.theme);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // استخدم theme محفوظ في localStorage كـ fallback
      const savedTheme = localStorage.getItem('superAdminTheme');
      if (savedTheme) {
        setDarkMode(savedTheme === 'dark');
      }
    }
  };

  // ============================================
  // SAVE THEME PREFERENCE
  // ============================================

  const saveThemePreference = async (newTheme) => {
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/profile/theme`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ theme: newTheme })
      });

      const data = await res.json();

      if (data.success) {
        // حفظ في localStorage
        localStorage.setItem('superAdminTheme', newTheme);
      }
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  // ============================================
  // TOGGLE THEME
  // ============================================

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    const newTheme = newDarkMode ? 'dark' : 'light';
    saveThemePreference(newTheme);
  };

  useEffect(() => {
    loadTenants();
    loadStats();
    loadSuperAdmins();
    loadOrgAdmins();
    loadUserProfile(); // تحميل الـ theme من الداتابيز

    const interval = setInterval(() => {
      loadTenants();
      loadStats();
      loadSuperAdmins();
      loadOrgAdmins();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // CRUD OPERATIONS
  // ============================================
  const createTenant = async () => {
    try {
      setLoading(true);
      setModalError(null);
      const res = await fetch(`${API_BASE_URL}/super-admin/tenants`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tenantForm)
      });

      const data = await res.json();

      if (data.success) {
        await loadTenants();
        await loadStats();
        setCreateModal(false);
        setTenantForm({
          name: '',
          slug: '',
          domain: '',
          adminName: '',
          adminEmail: '',
          plan: 'basic'
        });
        setModalError(null);
        setSuccessMessage('Customer created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setModalError(data.message || 'Failed to create customer');
      }
    } catch (err) {
      setModalError('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const updateTenant = async (id, updateData) => {
    try {
      setModalError(null);
      const res = await fetch(`${API_BASE_URL}/super-admin/tenants/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (data.success) {
        await loadTenants();
        await loadStats();
        setEditModal(null);
        setModalError(null);
        setSuccessMessage('Customer updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setModalError(data.message || 'Failed to update customer');
      }
    } catch (err) {
      setModalError('Failed to update customer');
    }
  };

  const toggleTenantStatus = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/tenants/${id}/toggle-status`, {
        method: 'PATCH',
        headers: getHeaders()
      });

      const data = await res.json();

      if (data.success) {
        await loadTenants();
        await loadStats();
        setSuccessMessage('Customer status updated');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('Failed to toggle status');
    }
  };

  const deleteTenant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? All data will be permanently deleted.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/tenants/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await res.json();

      if (data.success) {
        await loadTenants();
        await loadStats();
        setSuccessMessage('Customer deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to delete customer');
      }
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  // ============================================
  // SUPER ADMIN CRUD
  // ============================================
  const loadSuperAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/super-admins`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSuperAdmins(data.data);
      }
    } catch (err) {
      console.error('Failed to load super admins:', err);
    }
  };

  const createSuperAdmin = async () => {
    if (!superAdminForm.name || !superAdminForm.email || !superAdminForm.password) {
      setModalError('Please fill all required fields');
      return;
    }

    try {
      setModalError(null);
      const res = await fetch(`${API_BASE_URL}/super-admin/super-admins`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(superAdminForm)
      });

      const data = await res.json();

      if (data.success) {
        await loadSuperAdmins();
        setSuperAdminModal(null);
        setSuperAdminForm({ name: '', email: '', password: '', phone: '' });
        setModalError(null);
        setSuccessMessage('Super Admin created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setModalError(data.message || 'Failed to create super admin');
      }
    } catch (err) {
      setModalError('Failed to create super admin');
    }
  };

  const updateSuperAdmin = async () => {
    try {
      setModalError(null);
      const updateData = { ...superAdminForm };
      if (!updateData.password) {
        delete updateData.password;
      }

      const res = await fetch(`${API_BASE_URL}/super-admin/super-admins/${superAdminModal.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (data.success) {
        await loadSuperAdmins();
        setSuperAdminModal(null);
        setSuperAdminForm({ name: '', email: '', password: '', phone: '' });
        setModalError(null);
        setSuccessMessage('Super Admin updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setModalError(data.message || 'Failed to update super admin');
      }
    } catch (err) {
      setModalError('Failed to update super admin');
    }
  };

  const deleteSuperAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this Super Admin?\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/super-admins/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (data.success) {
        await loadSuperAdmins();
        setSuccessMessage('Super Admin deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to delete super admin');
      }
    } catch (err) {
      setError('Failed to delete super admin');
    }
  };

  // ============================================
  // ORGANIZATION ADMIN CRUD
  // ============================================
  const loadOrgAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/admins`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setOrgAdmins(data.data);
      }
    } catch (err) {
      console.error('Failed to load org admins:', err);
    }
  };

  const createOrgAdmin = async () => {
    if (!orgAdminForm.name || !orgAdminForm.email || !orgAdminForm.tenantId) {
      setModalError('Please fill all required fields');
      return;
    }

    try {
      setModalError(null);
      const requestData = {
        name: orgAdminForm.name,
        email: orgAdminForm.email,
        phone: orgAdminForm.phone,
        tenantId: orgAdminForm.tenantId,
        role: 'ADMIN'
      };

      const res = await fetch(`${API_BASE_URL}/super-admin/admins`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      });

      const data = await res.json();

      if (data.success) {
        await loadOrgAdmins();
        setOrgAdminModal(null);
        setOrgAdminForm({ name: '', email: '', password: '', phone: '', tenantId: '' });
        setModalError(null);
        setSuccessMessage('Customer Admin created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setModalError(data.message || 'Failed to create admin');
      }
    } catch (err) {
      setModalError('Failed to create admin');
    }
  };

  const updateOrgAdmin = async () => {
    try {
      setModalError(null);
      const updateData = { ...orgAdminForm };
      if (!updateData.password) {
        delete updateData.password;
      }

      const res = await fetch(`${API_BASE_URL}/super-admin/admins/${orgAdminModal.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (data.success) {
        await loadOrgAdmins();
        setOrgAdminModal(null);
        setOrgAdminForm({ name: '', email: '', password: '', phone: '', tenantId: '' });
        setModalError(null);
        setSuccessMessage('Customer Admin updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setModalError(data.message || 'Failed to update admin');
      }
    } catch (err) {
      setModalError('Failed to update admin');
    }
  };

  const deleteOrgAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this Customer Admin?\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await res.json();

      if (data.success) {
        await loadOrgAdmins();
        setSuccessMessage('Customer Admin deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to delete admin');
      }
    } catch (err) {
      setError('Failed to delete admin');
    }
  };

  const resendActivationEmail = async (adminId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/super-admin/admins/${adminId}/resend-activation`, {
        method: 'POST',
        headers: getHeaders()
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Activation email sent successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.message || 'Failed to send activation email');
      }
    } catch (err) {
      setError('Failed to send activation email');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PLANS CRUD
  // ============================================
  const createPlan = () => {
    if (!planForm.id || !planForm.name || !planForm.monthlyFee) {
      setError('Please fill all required fields');
      return;
    }

    const newPlan = {
      ...planForm,
      maxRooms: parseInt(planForm.maxRooms),
      maxUsers: parseInt(planForm.maxUsers),
      maxOrders: parseInt(planForm.maxOrders),
      monthlyFee: parseFloat(planForm.monthlyFee),
      features: planForm.features.filter(f => f.trim() !== '')
    };

    setPlans([...plans, newPlan]);
    setPlanModal(null);
    setPlanForm({ id: '', name: '', maxRooms: '', maxUsers: '', maxOrders: '', monthlyFee: '', features: [] });
    setError(null);
  };

  const updatePlan = () => {
    const updatedPlans = plans.map(plan =>
      plan.id === planModal.id ? {
        ...planForm,
        maxRooms: parseInt(planForm.maxRooms),
        maxUsers: parseInt(planForm.maxUsers),
        maxOrders: parseInt(planForm.maxOrders),
        monthlyFee: parseFloat(planForm.monthlyFee),
        features: planForm.features.filter(f => f.trim() !== '')
      } : plan
    );

    setPlans(updatedPlans);
    setPlanModal(null);
    setPlanForm({ id: '', name: '', maxRooms: '', maxUsers: '', maxOrders: '', monthlyFee: '', features: [] });
    setError(null);
  };

  const deletePlan = (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    setPlans(plans.filter(plan => plan.id !== planId));
  };

  // ============================================
  // FILTERS
  // ============================================
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && tenant.isActive) ||
                         (filterStatus === 'inactive' && !tenant.isActive);
    return matchesSearch && matchesStatus;
  });

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 h-full ${theme.surface} border-r ${theme.border} z-50 w-64`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme.text}`}>Super Admin</h1>
              <p className={`text-xs ${theme.textSecondary}`}>Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-220px)]">
          {[
            { id: 'overview', name: 'Overview', icon: LayoutDashboard },
            { id: 'companies', name: 'Customers', icon: Building2 },
            { id: 'org-admins', name: 'Customers Admin', icon: UserCog },
            { id: 'super-admins', name: 'Super Admins', icon: Shield },
            { id: 'billing', name: 'Billing', icon: DollarSign },
            { id: 'analytics', name: 'Analytics', icon: BarChart3 },
            { id: 'settings', name: 'Settings', icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                  activeTab === item.id
                    ? 'bg-sky-500 text-white shadow-lg'
                    : `${theme.text} ${theme.hover}`
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-700 absolute bottom-0 w-64">
          {/* User Info */}
          <div className={`mb-3 px-2 py-2 ${theme.card} rounded-lg`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {localStorage.getItem('superAdminName')?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${theme.text} truncate`}>
                  {localStorage.getItem('superAdminName') || 'Super Admin'}
                </p>
                <p className={`text-xs ${theme.textSecondary} truncate`}>
                  {localStorage.getItem('superAdminEmail') || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('superAdminAuth');
                localStorage.removeItem('superAdminToken');
                localStorage.removeItem('superAdminRefreshToken');
                localStorage.removeItem('superAdminEmail');
                localStorage.removeItem('superAdminName');
                localStorage.removeItem('superAdminId');
                localStorage.removeItem('superAdminTheme');
                window.location.href = '/';
              }
            }}
            className="w-full flex items-center justify-start space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            <Power className="w-5 h-5" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content - with margin for sidebar */}
      <div className="ml-64">
          {/* Header */}
          <div className={`${theme.card} border-b ${theme.border} px-8 py-6 sticky top-0 z-10`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-3xl font-bold ${theme.text}`}>
                  {activeTab === 'overview' && 'Overview'}
                  {activeTab === 'companies' && 'Customers'}
                  {activeTab === 'org-admins' && 'Customers Admin'}
                  {activeTab === 'super-admins' && 'Super Admins'}
                  {activeTab === 'billing' && 'Billing & Revenue'}
                  {activeTab === 'analytics' && 'Analytics'}
                  {activeTab === 'settings' && 'Settings'}
                </h2>
                <p className={`text-sm ${theme.textSecondary} mt-1`}>
                  {activeTab === 'overview' && 'System overview and statistics'}
                  {activeTab === 'companies' && 'Manage customer organizations'}
                  {activeTab === 'org-admins' && 'Manage customer administrators'}
                  {activeTab === 'super-admins' && 'Manage super admin accounts'}
                  {activeTab === 'billing' && 'Revenue and subscription management'}
                  {activeTab === 'analytics' && 'Detailed analytics and insights'}
                  {activeTab === 'settings' && 'System configuration'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {successMessage && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm">{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)}>
                      <XCircle className="w-4 h-4 text-green-400 hover:text-green-300" />
                    </button>
                  </div>
                )}
                {error && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                    <button onClick={() => setError(null)}>
                      <XCircle className="w-4 h-4 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <Building2 className="w-10 h-10 opacity-80" />
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.totalTenants}</h3>
                    <p className="text-blue-100">Total Customers</p>
                    <p className="text-xs text-blue-200 mt-2">{stats.activeTenants} active</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-10 h-10 opacity-80" />
                    </div>
                    <h3 className="text-4xl font-bold mb-1">${stats.monthlyRevenue?.toLocaleString()}</h3>
                    <p className="text-green-100">Monthly Revenue</p>
                    <p className="text-xs text-green-200 mt-2">Per month</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <Package className="w-10 h-10 opacity-80" />
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.totalOrders?.toLocaleString()}</h3>
                    <p className="text-purple-100">Total Orders</p>
                    <p className="text-xs text-purple-200 mt-2">All time</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-10 h-10 opacity-80" />
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.totalUsers}</h3>
                    <p className="text-orange-100">Total Users</p>
                    <p className="text-xs text-orange-200 mt-2">All customers</p>
                  </div>
                </div>

                {/* Recent Customers */}
                <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                  <h3 className={`text-xl font-bold ${theme.text} mb-6`}>Recent Customers</h3>
                  <div className="space-y-3">
                    {tenants.slice(0, 5).map(tenant => (
                      <div key={tenant.id} className={`flex items-center justify-between p-4 ${theme.surface} rounded-xl border ${theme.border} ${theme.hover} transition-all`}>
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 ${tenant.isActive ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-xl`}>
                            <Building2 className={`w-6 h-6 ${tenant.isActive ? 'text-green-500' : 'text-red-500'}`} />
                          </div>
                          <div>
                            <p className={`font-bold ${theme.text}`}>{tenant.name}</p>
                            <p className={`text-sm ${theme.textSecondary}`}>
                              {tenant.slug} • {tenant.plan}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className={`text-sm font-medium ${theme.text}`}>
                              {tenant.totalOrders} orders
                            </p>
                            <p className={`text-xs ${theme.textSecondary}`}>
                              {tenant.totalUsers} users
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tenant.isActive 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {tenant.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COMPANIES TAB */}
            {activeTab === 'companies' && (
              <div>
                {/* Search & Filters */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textSecondary}`} />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className={`px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setCreateModal(true)}
                    className="ml-4 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold flex items-center space-x-2 shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Customer</span>
                  </button>
                </div>

                {/* Companies Table */}
                <div className={`${theme.card} border ${theme.border} rounded-2xl overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${theme.surface}`}>
                      <tr className={`border-b ${theme.border}`}>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Customer</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Plan</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Status</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Orders</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Users</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Created</th>
                        <th className={`text-right py-4 px-6 ${theme.text} font-semibold`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map(tenant => (
                        <tr key={tenant.id} className={`border-b ${theme.border} ${theme.hover} transition-all`}>
                          <td className="py-4 px-6">
                            <div>
                              <p className={`font-bold ${theme.text}`}>{tenant.name}</p>
                              <p className={`text-sm ${theme.textSecondary}`}>{tenant.slug}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              tenant.plan === 'enterprise' ? 'bg-orange-500/10 text-orange-500' :
                              tenant.plan === 'pro' ? 'bg-purple-500/10 text-purple-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {tenant.plan?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => toggleTenantStatus(tenant.id)}
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                tenant.isActive 
                                  ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                                  : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                              } transition-all`}
                            >
                              {tenant.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>{tenant.isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>
                          <td className={`py-4 px-6 ${theme.text} font-medium`}>
                            {tenant.totalOrders || 0}
                          </td>
                          <td className={`py-4 px-6 ${theme.text} font-medium`}>
                            {tenant.totalUsers || 0}
                          </td>
                          <td className={`py-4 px-6 ${theme.textSecondary} text-sm`}>
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setDetailsModal(tenant)}
                                className="p-2 hover:bg-sky-500/10 text-sky-500 rounded-lg transition-all"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditModal(tenant)}
                                className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTenant(tenant.id)}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTenants.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className={`w-16 h-16 ${theme.textSecondary} mx-auto mb-4`} />
                      <p className={`${theme.textSecondary} text-lg`}>No customers found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUPER ADMINS TAB */}
            {activeTab === 'super-admins' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className={theme.textSecondary}>
                      {superAdmins.length} Super Admin accounts
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSuperAdminModal({ isNew: true });
                      setSuperAdminForm({ name: '', email: '', password: '', phone: '' });
                    }}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold flex items-center space-x-2 shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Super Admin</span>
                  </button>
                </div>

                {/* Super Admins Table */}
                <div className={`${theme.card} border ${theme.border} rounded-2xl overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${theme.surface}`}>
                      <tr className={`border-b ${theme.border}`}>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Name</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Email</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Phone</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Created</th>
                        <th className={`text-right py-4 px-6 ${theme.text} font-semibold`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {superAdmins.map(admin => (
                        <tr key={admin.id} className={`border-b ${theme.border} ${theme.hover} transition-all`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                {admin.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className={`font-medium ${theme.text}`}>{admin.name}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-6 ${theme.textSecondary}`}>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {admin.email}
                            </div>
                          </td>
                          <td className={`py-4 px-6 ${theme.textSecondary}`}>
                            {admin.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {admin.phone}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className={`py-4 px-6 ${theme.textSecondary} text-sm`}>
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setSuperAdminModal({ ...admin, isNew: false });
                                  setSuperAdminForm({
                                    name: admin.name,
                                    email: admin.email,
                                    phone: admin.phone || '',
                                    password: ''
                                  });
                                }}
                                className={`p-2 ${theme.hover} rounded-lg transition-all`}
                                title="Edit"
                              >
                                <Edit className={`w-4 h-4 ${theme.text}`} />
                              </button>
                              <button
                                onClick={() => deleteSuperAdmin(admin.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {superAdmins.length === 0 && (
                    <div className="text-center py-16">
                      <Shield className={`w-20 h-20 ${theme.textSecondary} mx-auto mb-4`} />
                      <p className={`${theme.textSecondary} text-lg`}>No super admins found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ORGANIZATION ADMINS TAB */}
            {activeTab === 'org-admins' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <p className={theme.textSecondary}>
                      {selectedTenant === 'all'
                        ? `${orgAdmins.length} total customer admins`
                        : `${orgAdmins.filter(a => a.tenantId === selectedTenant).length} admins`
                      }
                    </p>
                    <select
                      value={selectedTenant}
                      onChange={(e) => setSelectedTenant(e.target.value)}
                      className={`px-4 py-2 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                    >
                      <option value="all">All Customers</option>
                      {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setOrgAdminModal({ isNew: true });
                      setOrgAdminForm({ name: '', email: '', password: '', phone: '', tenantId: '' });
                    }}
                    className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold flex items-center space-x-2 shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Customer Admin</span>
                  </button>
                </div>

                {/* Organization Admins Table */}
                <div className={`${theme.card} border ${theme.border} rounded-2xl overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${theme.surface}`}>
                      <tr className={`border-b ${theme.border}`}>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Admin</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Email</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Phone</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Organization</th>
                        <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Created</th>
                        <th className={`text-right py-4 px-6 ${theme.text} font-semibold`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgAdmins
                        .filter(admin => selectedTenant === 'all' || admin.tenantId === selectedTenant)
                        .map(admin => {
                          const tenant = tenants.find(t => t.id === admin.tenantId);
                          return (
                            <tr key={admin.id} className={`border-b ${theme.border} ${theme.hover} transition-all`}>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                                    {admin.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className={`font-medium ${theme.text}`}>{admin.name}</span>
                                    {!admin.emailVerified && (
                                      <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                                        Pending Activation
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className={`py-4 px-6 ${theme.textSecondary}`}>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {admin.email}
                                </div>
                              </td>
                              <td className={`py-4 px-6 ${theme.textSecondary}`}>
                                {admin.phone ? (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {admin.phone}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-blue-500" />
                                  <span className={`font-medium ${theme.text}`}>{tenant?.name || 'N/A'}</span>
                                </div>
                              </td>
                              <td className={`py-4 px-6 ${theme.textSecondary} text-sm`}>
                                {new Date(admin.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-2 justify-end">
                                  {!admin.emailVerified && (
                                    <button
                                      onClick={() => resendActivationEmail(admin.id)}
                                      className="p-2 hover:bg-blue-500/10 rounded-lg transition-all"
                                      title="Resend Activation Email"
                                    >
                                      <Mail className="w-4 h-4 text-blue-500" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setOrgAdminModal({ isNew: false, id: admin.id });
                                      setOrgAdminForm({
                                        name: admin.name,
                                        email: admin.email,
                                        phone: admin.phone || '',
                                        password: '',
                                        tenantId: admin.tenantId
                                      });
                                    }}
                                    className={`p-2 ${theme.hover} rounded-lg transition-all`}
                                    title="Edit Admin"
                                  >
                                    <Edit className="w-4 h-4 text-purple-500" />
                                  </button>
                                  <button
                                    onClick={() => deleteOrgAdmin(admin.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {orgAdmins.filter(admin => selectedTenant === 'all' || admin.tenantId === selectedTenant).length === 0 && (
                    <div className="text-center py-16">
                      <UserCog className={`w-20 h-20 ${theme.textSecondary} mx-auto mb-4`} />
                      <p className={`${theme.textSecondary} text-lg`}>No customer admins found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                    <p className={`text-sm ${theme.textSecondary} mb-2`}>Monthly Revenue</p>
                    <p className={`text-4xl font-bold ${theme.text}`}>
                      ${stats.monthlyRevenue?.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-500 mt-2">Active subscriptions</p>
                  </div>
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                    <p className={`text-sm ${theme.textSecondary} mb-2`}>Total Revenue</p>
                    <p className={`text-4xl font-bold ${theme.text}`}>
                      ${stats.totalRevenue?.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-500 mt-2">All customers</p>
                  </div>
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                    <p className={`text-sm ${theme.textSecondary} mb-2`}>Active Subscriptions</p>
                    <p className={`text-4xl font-bold ${theme.text}`}>
                      {stats.activeTenants}
                    </p>
                    <p className="text-sm text-purple-500 mt-2">Paying customers</p>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <AnalyticsTab tenants={tenants} theme={theme} />
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Settings Sub-Tabs */}
                <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700">
                  {[
                    { id: 'preferences', name: 'User Preferences' },
                    { id: 'plans', name: 'Subscription Plans' },
                    { id: 'system', name: 'System Settings' },
                    { id: 'notifications', name: 'Notifications' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`px-6 py-3 font-semibold transition-all ${
                        settingsTab === tab.id
                          ? 'border-b-2 border-sky-500 text-sky-500'
                          : `${theme.textSecondary} ${theme.hover}`
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* USER PREFERENCES (Theme Settings) */}
                {settingsTab === 'preferences' && (
                  <SettingsTab theme={theme} darkMode={darkMode} toggleTheme={toggleTheme} />
                )}

                {/* PLANS MANAGEMENT */}
                {settingsTab === 'plans' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className={`text-2xl font-bold ${theme.text}`}>Subscription Plans</h3>
                        <p className={theme.textSecondary}>Manage pricing tiers and features</p>
                      </div>
                      <button
                        onClick={() => {
                          setPlanModal({ isNew: true });
                          setPlanForm({ id: '', name: '', maxRooms: '', maxUsers: '', maxOrders: '', monthlyFee: '', features: [] });
                        }}
                        className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold flex items-center space-x-2 shadow-lg transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Plan</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {plans.map(plan => (
                        <div key={plan.id} className={`${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-xl transition-all`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className={`text-2xl font-bold ${theme.text}`}>{plan.name}</h4>
                              <div className="flex items-baseline mt-2">
                                <span className="text-4xl font-bold text-sky-500">${plan.monthlyFee}</span>
                                <span className={`ml-2 ${theme.textSecondary}`}>/month</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setPlanModal({ isNew: false, id: plan.id });
                                  setPlanForm(plan);
                                }}
                                className={`p-2 ${theme.hover} rounded-lg transition-all`}
                              >
                                <Edit className="w-4 h-4 text-sky-500" />
                              </button>
                              <button
                                onClick={() => deletePlan(plan.id)}
                                className={`p-2 ${theme.hover} rounded-lg transition-all`}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                              <span className={theme.textSecondary}>Max Rooms</span>
                              <span className={`font-semibold ${theme.text}`}>{plan.maxRooms}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                              <span className={theme.textSecondary}>Max Users</span>
                              <span className={`font-semibold ${theme.text}`}>{plan.maxUsers}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className={theme.textSecondary}>Max Orders</span>
                              <span className={`font-semibold ${theme.text}`}>{plan.maxOrders.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className={`text-sm font-semibold ${theme.text} mb-2`}>Features:</p>
                            {plan.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className={`text-sm ${theme.textSecondary}`}>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SYSTEM SETTINGS */}
                {settingsTab === 'system' && (
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-8`}>
                    <h3 className={`text-2xl font-bold ${theme.text} mb-6`}>System Settings</h3>
                    <div className="space-y-6">
                      <div>
                        <label className={`block text-sm font-semibold ${theme.text} mb-2`}>System Name</label>
                        <input
                          type="text"
                          defaultValue="Tea Management System"
                          className={`w-full px-4 py-3 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold ${theme.text} mb-2`}>Support Email</label>
                        <input
                          type="email"
                          defaultValue="support@teamsystem.com"
                          className={`w-full px-4 py-3 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold ${theme.text} mb-2`}>Currency</label>
                        <select className={`w-full px-4 py-3 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}>
                          <option>USD</option>
                          <option>EUR</option>
                          <option>GBP</option>
                          <option>EGP</option>
                        </select>
                      </div>
                      <button className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-all">
                        Save Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS SETTINGS */}
                {settingsTab === 'notifications' && (
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-8`}>
                    <h3 className={`text-2xl font-bold ${theme.text} mb-6`}>Notification Settings</h3>
                    <div className="space-y-4">
                      {[
                        { id: 'new-tenant', label: 'New Tenant Registration', description: 'Get notified when a new company signs up' },
                        { id: 'payment-received', label: 'Payment Received', description: 'Alert when payment is received from tenants' },
                        { id: 'system-alerts', label: 'System Alerts', description: 'Critical system notifications and errors' },
                        { id: 'usage-limits', label: 'Usage Limits', description: 'Notify when tenants reach usage limits' }
                      ].map(notif => (
                        <div key={notif.id} className={`flex items-center justify-between p-4 border ${theme.border} rounded-lg`}>
                          <div>
                            <p className={`font-semibold ${theme.text}`}>{notif.label}</p>
                            <p className={`text-sm ${theme.textSecondary}`}>{notif.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>

      {/* CREATE MODAL */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className={`${theme.card} rounded-2xl border ${theme.border} p-8 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${theme.text}`}>Create New Customer</h3>
              <button onClick={() => { setCreateModal(false); setModalError(null); }}>
                <XCircle className={`w-6 h-6 ${theme.text}`} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`${theme.text} font-medium mb-2 block text-sm`}>Customer Name *</label>
                <input
                  type="text"
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                />
              </div>

              <div>
                <label className={`${theme.text} font-medium mb-2 block text-sm`}>Domain (optional)</label>
                <input
                  type="text"
                  value={tenantForm.domain}
                  onChange={(e) => setTenantForm(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="company.com"
                  className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.text} font-medium mb-2 block text-sm`}>Admin Name</label>
                  <input
                    type="text"
                    value={tenantForm.adminName}
                    onChange={(e) => setTenantForm(prev => ({ ...prev, adminName: e.target.value }))}
                    className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`${theme.text} font-medium mb-2 block text-sm`}>Admin Email *</label>
                  <input
                    type="email"
                    value={tenantForm.adminEmail}
                    onChange={(e) => setTenantForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                    className={`w-full px-4 py-2.5 ${theme.input} border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none`}
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className={`text-sm ${theme.text}`}>
                  <strong>📧 Note:</strong> An activation email will be sent to the admin. They will set their password during account activation.
                </p>
              </div>

              <div>
                <label className={`${theme.text} font-medium mb-2 block text-sm`}>Plan *</label>
                <div className="grid grid-cols-3 gap-3">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setTenantForm(prev => ({ ...prev, plan: plan.id }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tenantForm.plan === plan.id
                          ? 'border-sky-500 bg-sky-500/10'
                          : `border-slate-600 ${theme.hover}`
                      }`}
                    >
                      <p className={`font-bold ${theme.text}`}>{plan.name}</p>
                      <p className={`text-xs ${theme.textSecondary} mt-1`}>
                        ${plan.monthlyFee}/mo
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error message inside modal */}
              {modalError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-500 text-sm">{modalError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setCreateModal(false); setModalError(null); }}
                className={`flex-1 py-3 ${theme.card} border ${theme.border} ${theme.text} rounded-lg font-medium ${theme.hover}`}
              >
                Cancel
              </button>
              <button
                onClick={createTenant}
                disabled={loading || !tenantForm.name || !tenantForm.adminEmail}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {detailsModal && (
        <CustomerDetailsModal 
          company={detailsModal}
          onClose={() => setDetailsModal(null)}
          theme={theme}
          API_BASE_URL={API_BASE_URL}
        />
      )}

      {editModal && (
        <EditCustomerModal
          company={editModal}
          onClose={() => setEditModal(null)}
          onSave={updateTenant}
          theme={theme}
          plans={plans}
        />
      )}

      {/* SUPER ADMIN MODAL */}
      {superAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className={`${theme.card} rounded-3xl border-2 border-sky-500/50 p-8 max-w-2xl w-full shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-3xl font-bold ${theme.text}`}>
                {superAdminModal.isNew ? 'Add Super Admin' : 'Edit Super Admin'}
              </h3>
              <button
                onClick={() => setSuperAdminModal(null)}
                className={`p-2 ${theme.hover} rounded-lg transition-all`}
              >
                <X className={`w-8 h-8 ${theme.text}`} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`${theme.text} font-semibold mb-2 block`}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={superAdminForm.name}
                  onChange={(e) => setSuperAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-lg`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>Email *</label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={superAdminForm.email}
                    onChange={(e) => setSuperAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-lg`}
                  />
                </div>
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={superAdminForm.phone}
                    onChange={(e) => setSuperAdminForm(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-lg`}
                  />
                </div>
              </div>

              <div>
                <label className={`${theme.text} font-semibold mb-2 block`}>
                  Password {superAdminModal.isNew ? '*' : '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  placeholder={superAdminModal.isNew ? "Enter password" : "Enter new password (optional)"}
                  value={superAdminForm.password}
                  onChange={(e) => setSuperAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-lg`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {superAdminModal.isNew
                    ? 'Password must be at least 6 characters'
                    : 'Leave empty to keep the current password'}
                </p>
              </div>

              {modalError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-500 text-sm">{modalError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setSuperAdminModal(null); setModalError(null); }}
                  className={`flex-1 py-3 ${theme.card} border ${theme.border} ${theme.text} rounded-xl font-bold hover:opacity-80 transition-all text-lg`}
                >
                  Cancel
                </button>
                <button
                  onClick={superAdminModal.isNew ? createSuperAdmin : updateSuperAdmin}
                  disabled={
                    !superAdminForm.name?.trim() ||
                    !superAdminForm.email?.trim() ||
                    (superAdminModal.isNew && (!superAdminForm.password || superAdminForm.password.trim().length === 0))
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-bold hover:from-sky-700 hover:to-blue-700 transition-all disabled:opacity-50 text-lg shadow-lg"
                >
                  <Save className="inline mr-2 w-5 h-5" />
                  {superAdminModal.isNew ? 'Add Super Admin' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORG ADMIN MODAL */}
      {orgAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className={`${theme.card} rounded-3xl border-2 border-purple-500/50 p-8 max-w-2xl w-full shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-3xl font-bold ${theme.text}`}>
                {orgAdminModal.isNew ? 'Add Customer Admin' : 'Edit Customer Admin'}
              </h3>
              <button onClick={() => { setOrgAdminModal(null); setModalError(null); }} className={`p-2 ${theme.hover} rounded-lg transition-all`}>
                <X className={`w-8 h-8 ${theme.text}`} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Organization Selection */}
              <div>
                <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                  Organization <span className="text-red-500">*</span>
                </label>
                <select
                  value={orgAdminForm.tenantId}
                  onChange={(e) => setOrgAdminForm({ ...orgAdminForm, tenantId: e.target.value })}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg`}
                  disabled={!orgAdminModal.isNew}
                >
                  <option value="">Select Organization</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgAdminForm.name}
                  onChange={(e) => setOrgAdminForm({ ...orgAdminForm, name: e.target.value })}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg`}
                  placeholder="Enter admin name"
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={orgAdminForm.email}
                  onChange={(e) => setOrgAdminForm({ ...orgAdminForm, email: e.target.value })}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg`}
                  placeholder="admin@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className={`block text-sm font-semibold ${theme.text} mb-2`}>Phone Number</label>
                <input
                  type="tel"
                  value={orgAdminForm.phone}
                  onChange={(e) => setOrgAdminForm({ ...orgAdminForm, phone: e.target.value })}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg`}
                  placeholder="+1234567890"
                />
              </div>

              {/* Password - Only for editing existing admin */}
              {!orgAdminModal.isNew && (
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                    Password <span className={`text-xs ${theme.textSecondary}`}>(leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={orgAdminForm.password}
                    onChange={(e) => setOrgAdminForm({ ...orgAdminForm, password: e.target.value })}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg`}
                    placeholder="Leave blank to keep current"
                  />
                </div>
              )}

              {/* Info box for new admin */}
              {orgAdminModal.isNew && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className={`text-sm ${theme.text}`}>
                    <strong>📧 Note:</strong> An activation email will be sent to the admin. They will set their password during account activation.
                  </p>
                </div>
              )}

              {/* Error message inside modal */}
              {modalError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-500 text-sm">{modalError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => { setOrgAdminModal(null); setModalError(null); }}
                  className={`flex-1 py-3 border ${theme.border} ${theme.text} rounded-xl font-bold ${theme.hover} transition-all text-lg`}
                >
                  <X className="inline mr-2 w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={orgAdminModal.isNew ? createOrgAdmin : updateOrgAdmin}
                  disabled={
                    !orgAdminForm.name?.trim() ||
                    !orgAdminForm.email?.trim() ||
                    !orgAdminForm.tenantId
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 text-lg shadow-lg"
                >
                  <Save className="inline mr-2 w-5 h-5" />
                  {orgAdminModal.isNew ? 'Add Admin' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAN MODAL */}
      {planModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className={`${theme.card} rounded-3xl border-2 border-green-500/50 p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-3xl font-bold ${theme.text}`}>
                {planModal.isNew ? 'Create New Plan' : 'Edit Plan'}
              </h3>
              <button onClick={() => setPlanModal(null)} className={`p-2 ${theme.hover} rounded-lg transition-all`}>
                <X className={`w-8 h-8 ${theme.text}`} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Plan ID */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                    Plan ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={planForm.id}
                    onChange={(e) => setPlanForm({ ...planForm, id: e.target.value })}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-green-500 outline-none`}
                    placeholder="e.g., basic, pro"
                    disabled={!planModal.isNew}
                  />
                </div>

                {/* Plan Name */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-green-500 outline-none`}
                    placeholder="e.g., Basic Plan"
                  />
                </div>

                {/* Max Rooms */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>Max Rooms</label>
                  <input
                    type="number"
                    value={planForm.maxRooms}
                    onChange={(e) => setPlanForm({ ...planForm, maxRooms: e.target.value })}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-green-500 outline-none`}
                    placeholder="10"
                  />
                </div>

                {/* Max Users */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>Max Users</label>
                  <input
                    type="number"
                    value={planForm.maxUsers}
                    onChange={(e) => setPlanForm({ ...planForm, maxUsers: e.target.value })}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-green-500 outline-none`}
                    placeholder="5"
                  />
                </div>

                {/* Max Orders */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>Max Orders</label>
                  <input
                    type="number"
                    value={planForm.maxOrders}
                    onChange={(e) => setPlanForm({ ...planForm, maxOrders: e.target.value })}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-green-500 outline-none`}
                    placeholder="1000"
                  />
                </div>

                {/* Monthly Fee */}
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                    Monthly Fee (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={planForm.monthlyFee}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyFee: e.target.value })}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl focus:ring-2 focus:ring-green-500 outline-none`}
                    placeholder="99.00"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className={`block text-sm font-semibold ${theme.text} mb-2`}>Features</label>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map(idx => (
                    <input
                      key={idx}
                      type="text"
                      value={planForm.features[idx] || ''}
                      onChange={(e) => {
                        const newFeatures = [...planForm.features];
                        newFeatures[idx] = e.target.value;
                        setPlanForm({ ...planForm, features: newFeatures });
                      }}
                      className={`w-full px-4 py-2 ${theme.input} border rounded-lg focus:ring-2 focus:ring-green-500 outline-none`}
                      placeholder={`Feature ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setPlanModal(null)}
                  className={`flex-1 py-3 border ${theme.border} ${theme.text} rounded-xl font-bold ${theme.hover} transition-all`}
                >
                  <X className="inline mr-2 w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={planModal.isNew ? createPlan : updatePlan}
                  disabled={!planForm.id?.trim() || !planForm.name?.trim() || !planForm.monthlyFee}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  <Save className="inline mr-2 w-5 h-5" />
                  {planModal.isNew ? 'Create Plan' : 'Update Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;