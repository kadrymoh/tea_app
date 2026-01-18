import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, DoorOpen, Coffee, Users, FileText, Settings as SettingsIcon,
  Plus, Edit, Trash2, Sun, Moon, X, Save, LogOut,
  TrendingUp, Package, Clock, CheckCircle, AlertCircle, Building2, Mail, Phone,
  Grid3x3, List, Filter
} from 'lucide-react';
import Settings from './Settings';
import { io } from 'socket.io-client';
import { API_CONFIG, getApiUrl } from '../config/api.config';

const API_BASE_URL = API_CONFIG.BASE_URL;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);

  // Logout handler
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/tenant/admin/login');
    }
  };

  // Theme toggle handler
  const toggleTheme = async () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);

    // Save theme preference to backend
    try {
      await fetch(`${API_BASE_URL}/users/theme`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ theme: newTheme ? 'dark' : 'light' })
      });
    } catch (err) {
      console.error('Failed to save theme preference:', err);
    }
  };
  
  // Data States
  const [rooms, setRooms] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [users, setUsers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);

  // Filter & View States
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL', 'ADMIN', 'TEA_BOY'
  const [userViewMode, setUserViewMode] = useState('grid'); // 'grid', 'list'

  // Modal States
  const [roomModal, setRoomModal] = useState(null);
  const [kitchenModal, setKitchenModal] = useState(null);
  const [userModal, setUserModal] = useState(null);
  
  // Form States
  const [roomForm, setRoomForm] = useState({
    name: '', floor: 1, building: 'Main Building', kitchenId: null, capacity: 10
  });
  
  const [kitchenForm, setKitchenForm] = useState({
    name: '', floor: 1, building: 'Main Building'
  });
  
  const [userForm, setUserForm] = useState({
    name: '', email: '', phone: '', kitchenId: null, role: 'TEA_BOY', password: ''
  });

  // ============================================
  // API FUNCTIONS
  // ============================================
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };
  
  const loadUsers = async () => {
    try {
      // Load all users (Admins + Tea Boys)
      const res = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      console.log('🔄 Reloaded users:', data);
      setUsers(data?.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [roomsRes, kitchensRes, usersRes, menuRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/rooms`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/kitchens`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/menu`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/orders`, { headers: getAuthHeaders() })
      ]);

      const [roomsData, kitchensData, usersData, menuData, ordersData] = await Promise.all([
        roomsRes.json(),
        kitchensRes.json(),
        usersRes.json(),
        menuRes.json(),
        ordersRes.json()
      ]);

      console.log('📦 Users response:', usersData);
      console.log('📦 Users data:', usersData?.data);
      console.log('📦 Users count:', usersData?.data?.length);

      setRooms(roomsData?.data || []);
      setKitchens(kitchensData?.data || []);
      setUsers(usersData?.data || []);
      setMenuItems(menuData?.data || []);
      setOrders(ordersData?.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data from server');
    } finally {
      setLoading(false);
    }
  };

  // Room CRUD
  const addRoom = async () => {
    if (!roomForm.name || !roomForm.kitchenId) {
      setError('Please fill all required fields');
      return;
    }
    try {
      console.log('🔵 Creating room:', roomForm);
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(roomForm)
      });
      const data = await res.json();
      console.log('🔵 Room create response:', data);

      if (data.success) {
        setRooms(prev => [...prev, data.data]);
        setRoomModal(null);
        setRoomForm({ name: '', floor: 1, building: 'Main Building', kitchenId: null, capacity: 10 });
        setError(null);
      } else {
        console.error('❌ Failed to create room:', data.error);
        setError(data.error || 'Failed to add room');
      }
    } catch (err) {
      console.error('❌ Room create error:', err);
      setError('Failed to add room: ' + err.message);
    }
  };

  const updateRoom = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/${roomModal.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(roomForm)
      });
      const data = await res.json();
      if (data.success) {
        setRooms(prev => prev.map(r => r.id === roomModal.id ? data.data : r));
        setRoomModal(null);
        setError(null);
      }
    } catch (err) {
      setError('Failed to update room');
    }
  };

  const deleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRooms(prev => prev.filter(r => r.id !== id));
        setError(null);
      }
    } catch (err) {
      setError('Failed to delete room');
    }
  };

  const generateRoomToken = async (roomId) => {
    if (!window.confirm('Generate new token for this room? This will invalidate any existing token.')) return;
    try {
      console.log('🔑 Generating token for room:', roomId);
      const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/generate-token`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      console.log('📡 Response status:', res.status);
      const data = await res.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        setRooms(prev => prev.map(r => r.id === roomId ? data.data : r));
        if (roomModal && roomModal.id === roomId) {
          setRoomModal(data.data);
          setRoomForm(data.data);
        }

        // Generate full URL and copy to clipboard
        const roomUrl = `${window.location.origin}/tenant/room/${data.data.roomToken}`;
        navigator.clipboard.writeText(roomUrl).then(() => {
          alert(`✅ Room URL generated and copied to clipboard!\n\nURL: ${roomUrl}\n\nPaste this URL in the device browser.`);
        }).catch(() => {
          alert(`Room URL generated successfully!\n\n${roomUrl}\n\nCopy this URL and open it on the device.`);
        });

        setError(null);
      } else {
        console.error('❌ Failed to generate token:', data.error);
        alert(`Failed to generate token: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Error generating token:', err);
      setError('Failed to generate room token: ' + err.message);
      alert('Error: ' + err.message);
    }
  };

  // Kitchen CRUD
  const addKitchen = async () => {
    if (!kitchenForm.name) {
      setError('Kitchen name is required');
      return;
    }
    try {
      console.log('🔵 Creating kitchen:', kitchenForm);
      const res = await fetch(`${API_BASE_URL}/kitchens`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(kitchenForm)
      });
      const data = await res.json();
      console.log('🔵 Kitchen create response:', data);

      if (data.success) {
        setKitchens(prev => [...prev, data.data]);
        setKitchenModal(null);
        setKitchenForm({ name: '', floor: 1, building: 'Main Building' });
        setError(null);
      } else {
        console.error('❌ Failed to create kitchen:', data.error);
        setError(data.error || 'Failed to add kitchen');
      }
    } catch (err) {
      console.error('❌ Kitchen create error:', err);
      setError('Failed to add kitchen: ' + err.message);
    }
  };

  const updateKitchen = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/kitchens/${kitchenModal.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(kitchenForm)
      });
      const data = await res.json();
      if (data.success) {
        setKitchens(prev => prev.map(k => k.id === kitchenModal.id ? data.data : k));
        setKitchenModal(null);
        setError(null);
      }
    } catch (err) {
      setError('Failed to update kitchen');
    }
  };

  const deleteKitchen = async (id) => {
    const assignedRooms = rooms.filter(r => r.kitchenId === id);
    if (assignedRooms.length > 0) {
      setError('Cannot delete kitchen with assigned rooms');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this kitchen?')) return;
    try {
      await fetch(`${API_BASE_URL}/kitchens/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setKitchens(prev => prev.filter(k => k.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete kitchen');
    }
  };

  // User CRUD
  const addUser = async () => {
    // Validate required fields based on role
    if (!userForm.name || !userForm.email || !userForm.password) {
      setError('Please fill all required fields including password');
      return;
    }

    // Kitchen is required only for Tea Boys
    if (userForm.role === 'TEA_BOY' && !userForm.kitchenId) {
      setError('Please select a kitchen for Tea Boy');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      console.log('🔵 Creating tea boy:', { ...userForm, password: '***' }); // Hide password in logs
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      console.log('🔵 Tea boy create response:', data);

      if (data.success) {
        setUsers(prev => [...prev, data.data]);
        setUserModal(null);
        setUserForm({ name: '', email: '', phone: '', kitchenId: null, role: 'TEA_BOY', password: '' });
        setError(null);
      } else {
        console.error('❌ Failed to create tea boy:', data.error);
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      console.error('❌ Tea boy create error:', err);
      setError('Failed to add user: ' + err.message);
    }
  };

  const updateUser = async () => {
    try {
      // Only include password if it was changed
      const updateData = { ...userForm };
      if (!updateData.password) {
        delete updateData.password;
      }

      console.log('🔵 Updating user with data:', { ...updateData, password: updateData.password ? '***' : undefined });

      const res = await fetch(`${API_BASE_URL}/users/${userModal.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      const data = await res.json();

      console.log('📥 Update response:', data);

      if (data.success) {
        // Reload users list to get updated kitchen info
        await loadUsers();
        setUserModal(null);
        setUserForm({ name: '', email: '', phone: '', kitchenId: null, role: 'TEA_BOY', password: '' });
        setError(null);
        console.log('✅ User updated and list reloaded');
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update user: ' + err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`${API_BASE_URL}/users/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setUsers(prev => prev.filter(u => u.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
  const storedTenant = localStorage.getItem('tenant');
  if (storedTenant) {
    try {
      const tenant = JSON.parse(storedTenant);
      setTenantInfo(tenant);
      console.log('✅ Tenant loaded:', tenant.name);
    } catch (error) {
      console.error('Error loading tenant:', error);
    }
  }
}, []);

  useEffect(() => {
    loadAllData();

    // 🔌 Setup Socket.IO connection for real-time updates
    const socket = io(API_CONFIG.SOCKET_URL);

    console.log('🔌 Admin connected to Socket.IO');

    // Listen for order updates (all orders in the tenant)
    socket.on('order-update', (order) => {
      console.log('🔔 Admin received order update:', order);
      // Reload orders when update received
      fetch(`${API_BASE_URL}/orders`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => { if (data.success) setOrders(data.data || []); })
        .catch(console.error);
    });

    // Listen for new orders
    socket.on('new-order', (order) => {
      console.log('🔔 Admin received new order:', order);
      // Reload orders when new order received
      fetch(`${API_BASE_URL}/orders`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => { if (data.success) setOrders(data.data || []); })
        .catch(console.error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log('🔌 Admin Socket.IO disconnected');
    };
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.timestamp || o.createdAt).toDateString();
    return orderDate === new Date().toDateString();
  });

  const stats = {
    totalOrders: todayOrders.length,
    pending: todayOrders.filter(o => o.status === 'pending').length,
    preparing: todayOrders.filter(o => o.status === 'preparing').length,
    ready: todayOrders.filter(o => o.status === 'ready').length,
    completed: todayOrders.filter(o => o.status === 'delivered').length,
    avgTime: '6m 30s',
    totalRooms: rooms.length,
    activeKitchens: kitchens.length,
    teaBoys: users.length,
    menuItems: menuItems.length
  };

  // ============================================
  // THEME
  // ============================================
  
  const theme = {
    bg: darkMode ? 'bg-slate-900' : 'bg-gray-50',
    card: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-slate-400' : 'text-gray-600',
    border: darkMode ? 'border-slate-700' : 'border-gray-200',
    input: darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900',
    sidebar: darkMode ? 'bg-slate-800' : 'bg-white',
    hover: darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100',
    surface: darkMode ? 'bg-slate-700/50' : 'bg-gray-100'
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', name: 'Rooms', icon: DoorOpen },
    { id: 'kitchens', name: 'Kitchens', icon: Coffee },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'settings', name: 'Settings', icon: SettingsIcon }
  ];

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 h-full ${theme.sidebar} border-r ${theme.border} z-50 w-64`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme.text}`}>Tea Admin</h1>
              <p className={`text-xs ${theme.textSecondary}`}>Management Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-220px)]">
          {navItems.map(item => {
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
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${theme.text} truncate`}>
                  {user?.name || 'Admin'}
                </p>
                <p className={`text-xs ${theme.textSecondary} truncate`}>
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="ml-64 flex-1">
          {/* Header */}
          <div className={`${theme.card} border-b ${theme.border} px-8 py-6 sticky top-0 z-10`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-3xl font-bold ${theme.text}`}>
                  {navItems.find(i => i.id === activeTab)?.name}
                </h2>
                <p className={`text-sm ${theme.textSecondary} mt-1`}>
                  {activeTab === 'dashboard' && 'Overview of your tea management system'}
                  {activeTab === 'rooms' && 'Manage meeting rooms and configurations'}
                  {activeTab === 'kitchens' && 'Manage kitchen locations and assignments'}
                  {activeTab === 'users' && 'Manage all users (Admins and Tea Boys)'}
                  {activeTab === 'reports' && 'Analytics and order history'}
                  {activeTab === 'settings' && 'Account settings and password management'}
                </p>
              </div>
              {error && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                  <button onClick={() => setError(null)}>
                    <X className="w-4 h-4 text-red-400 hover:text-red-300" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className={`${theme.text} text-lg`}>Loading data...</p>
              </div>
            )}

            {/* DASHBOARD TAB */}
            {!loading && activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <Package className="w-10 h-10 opacity-80" />
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">Today</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.totalOrders}</h3>
                    <p className="text-blue-100">Total Orders</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="w-10 h-10 opacity-80" />
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">Active</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.pending}</h3>
                    <p className="text-yellow-100">Pending Orders</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <CheckCircle className="w-10 h-10 opacity-80" />
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">Done</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.completed}</h3>
                    <p className="text-green-100">Completed</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="w-10 h-10 opacity-80" />
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-semibold">Avg</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-1">{stats.avgTime}</h3>
                    <p className="text-purple-100">Prep Time</p>
                  </div>
                </div>

                {/* System Overview & Recent Orders */}
                <div className="grid grid-cols-2 gap-6">
                  {/* System Overview */}
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                    <h3 className={`text-xl font-bold ${theme.text} mb-6`}>System Overview</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <div className="flex items-center space-x-3">
                          <DoorOpen className="w-8 h-8 text-blue-500" />
                          <span className={`font-semibold ${theme.text}`}>Meeting Rooms</span>
                        </div>
                        <span className="text-3xl font-bold text-blue-500">{stats.totalRooms}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <div className="flex items-center space-x-3">
                          <Coffee className="w-8 h-8 text-orange-500" />
                          <span className={`font-semibold ${theme.text}`}>Active Kitchens</span>
                        </div>
                        <span className="text-3xl font-bold text-orange-500">{stats.activeKitchens}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <div className="flex items-center space-x-3">
                          <Users className="w-8 h-8 text-green-500" />
                          <span className={`font-semibold ${theme.text}`}>Tea Boy Staff</span>
                        </div>
                        <span className="text-3xl font-bold text-green-500">{stats.teaBoys}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <div className="flex items-center space-x-3">
                          <Package className="w-8 h-8 text-purple-500" />
                          <span className={`font-semibold ${theme.text}`}>Menu Items</span>
                        </div>
                        <span className="text-3xl font-bold text-purple-500">{stats.menuItems}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                    <h3 className={`text-xl font-bold ${theme.text} mb-6`}>Recent Orders</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {todayOrders.slice(0, 6).map(order => (
                        <div key={order.id} className={`p-4 border ${theme.border} rounded-xl ${theme.hover} transition-all`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`font-semibold ${theme.text}`}>
                              {order.roomName || `Room Name: ${order.room.name}`}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                              order.status === 'preparing' ? 'bg-blue-500/20 text-blue-600' :
                              order.status === 'ready' ? 'bg-purple-500/20 text-purple-600' :
                              order.status === 'delivered' ? 'bg-green-500/20 text-green-600' :
                              'bg-gray-500/20 text-gray-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className={`text-xs ${theme.textSecondary}`}>
                            {new Date(order.timestamp || order.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                      {todayOrders.length === 0 && (
                        <div className="text-center py-12">
                          <Package className={`w-12 h-12 ${theme.textSecondary} mx-auto mb-3`} />
                          <p className={theme.textSecondary}>No orders today</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROOMS TAB */}
            {!loading && activeTab === 'rooms' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <p className={theme.textSecondary}>{rooms.length} rooms configured</p>
                  <button
                    onClick={() => {
                      setRoomModal({ isNew: true });
                      setRoomForm({ name: '', floor: 1, building: 'Main Building', kitchenId: kitchens[0]?.id || null, capacity: 10 });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-800 to-sky-400 text-white rounded-xl font-semibold hover:from-blue-900 hover:to-sky-500 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Room</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map(room => {
                    const kitchen = kitchens.find(k => k.id === room.kitchenId);
                    const roomOrders = orders.filter(o => o.roomId === room.id).length;
                    
                    return (
                      <div key={room.id} className={`${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-xl transition-all`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                              <DoorOpen className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                              <h3 className={`text-lg font-bold ${theme.text}`}>{room.name}</h3>
                              <p className={`text-sm ${theme.textSecondary}`}>Floor {room.floor}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className={theme.textSecondary}>Building:</span>
                            <span className={`font-semibold ${theme.text}`}>{room.building}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={theme.textSecondary}>Capacity:</span>
                            <span className={`font-semibold ${theme.text}`}>{room.capacity} people</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={theme.textSecondary}>Kitchen:</span>
                            <span className="font-semibold text-orange-500">{kitchen?.name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={theme.textSecondary}>Orders:</span>
                            <span className="font-semibold text-green-500">{roomOrders}</span>
                          </div>
                        </div>

                        {room.roomToken && (
                          <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-xs text-green-600 font-semibold mb-1">Room Token Active</p>
                            <p className="text-xs text-green-700 font-mono break-all">{room.roomToken.substring(0, 30)}...</p>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setRoomModal(room);
                              setRoomForm(room);
                            }}
                            className="flex-1 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all font-semibold text-sm"
                          >
                            <Edit className="inline w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRoom(room.id)}
                            className="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-semibold text-sm"
                          >
                            <Trash2 className="inline w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* KITCHENS TAB */}
            {!loading && activeTab === 'kitchens' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <p className={theme.textSecondary}>{kitchens.length} kitchens configured</p>
                  <button
                    onClick={() => {
                      setKitchenModal({ isNew: true });
                      setKitchenForm({ name: '', floor: 1, building: 'Main Building' });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-sky-700 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Kitchen</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {kitchens.map(kitchen => {
                    const assignedRooms = rooms.filter(r => r.kitchenId === kitchen.id);
                    const assignedUsers = users.filter(u => u.kitchen?.id === kitchen.id);
                    
                    return (
                      <div key={kitchen.id} className={`${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-xl transition-all`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-orange-500/10 rounded-xl">
                              <Coffee className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                              <h3 className={`text-xl font-bold ${theme.text}`}>{kitchen.name}</h3>
                              <p className={`text-sm ${theme.textSecondary}`}>Floor {kitchen.floor} • {kitchen.building}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 mb-4">
                          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-semibold ${theme.text}`}>Assigned Rooms</span>
                              <span className="text-2xl font-bold text-blue-500">{assignedRooms.length}</span>
                            </div>
                            {assignedRooms.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {assignedRooms.map(room => (
                                  <span key={room.id} className={`text-xs px-3 py-1 ${theme.card} border ${theme.border} rounded-full ${theme.text}`}>
                                    {room.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-semibold ${theme.text}`}>Tea Boy Staff</span>
                              <span className="text-2xl font-bold text-green-500">{assignedUsers.length}</span>
                            </div>
                            {assignedUsers.length > 0 && (
                              <div className="space-y-1 mt-3">
                                {assignedUsers.map(user => (
                                  <div key={user.id} className="text-sm text-green-600 font-medium">
                                    • {user.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setKitchenModal(kitchen);
                              setKitchenForm(kitchen);
                            }}
                            className="flex-1 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-all font-semibold text-sm"
                          >
                            <Edit className="inline w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteKitchen(kitchen.id)}
                            disabled={assignedRooms.length > 0}
                            className="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="inline w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {!loading && activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className={theme.textSecondary}>
                      {users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter).length} {userRoleFilter === 'ALL' ? 'total' : userRoleFilter === 'ADMIN' ? 'admin' : 'tea boy'} users
                      {userRoleFilter === 'ALL' && ` (${users.filter(u => u.role === 'ADMIN').length} Admins, ${users.filter(u => u.role === 'TEA_BOY').length} Tea Boys)`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUserModal({ isNew: true });
                      setUserForm({ name: '', email: '', phone: '', kitchenId: kitchens[0]?.id || null, role: 'TEA_BOY', password: '' });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-500 text-white rounded-xl font-semibold hover:from-sky-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add User</span>
                  </button>
                </div>

                {/* Filter and View Controls */}
                <div className="flex justify-between items-center mb-6 gap-4">
                  {/* Role Filter */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserRoleFilter('ALL')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        userRoleFilter === 'ALL'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : `${theme.card} ${theme.text} border ${theme.border} hover:bg-blue-500/10`
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      All
                    </button>
                    <button
                      onClick={() => setUserRoleFilter('ADMIN')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        userRoleFilter === 'ADMIN'
                          ? 'bg-purple-500 text-white shadow-lg'
                          : `${theme.card} ${theme.text} border ${theme.border} hover:bg-purple-500/10`
                      }`}
                    >
                      Admins
                    </button>
                    <button
                      onClick={() => setUserRoleFilter('TEA_BOY')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        userRoleFilter === 'TEA_BOY'
                          ? 'bg-orange-500 text-white shadow-lg'
                          : `${theme.card} ${theme.text} border ${theme.border} hover:bg-orange-500/10`
                      }`}
                    >
                      Tea Boys
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        userViewMode === 'grid'
                          ? 'bg-green-500 text-white shadow-lg'
                          : `${theme.card} ${theme.text} border ${theme.border} hover:bg-green-500/10`
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setUserViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${
                        userViewMode === 'list'
                          ? 'bg-green-500 text-white shadow-lg'
                          : `${theme.card} ${theme.text} border ${theme.border} hover:bg-green-500/10`
                      }`}
                      title="List View"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Grid View */}
                {userViewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter).map(user => {
                    const kitchen = kitchens.find(k => k.id === user.kitchen?.id);
                    
                    return (
                      <div key={user.id} className={`${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-xl transition-all`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-500/10 rounded-xl">
                              <Users className="w-8 h-8 text-green-500" />
                            </div>
                            <div>
                              <h3 className={`text-lg font-bold ${theme.text}`}>{user.name}</h3>
                              <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full font-semibold">
                                {(user.role || 'tea_boy').replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className={`w-4 h-4 ${theme.textSecondary}`} />
                            <span className={`font-medium ${theme.text} truncate`}>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className={`w-4 h-4 ${theme.textSecondary}`} />
                              <span className={`font-medium ${theme.text}`}>{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm">
                            <Coffee className={`w-4 h-4 ${theme.textSecondary}`} />
                            <span className="font-medium text-orange-500">{kitchen?.name || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setUserModal({ ...user, isNew: false });
                              setUserForm({
                                name: user.name,
                                email: user.email,
                                phone: user.phone || '',
                                kitchenId: user.kitchen?.id,
                                role: user.role || 'tea_boy',
                                password: ''
                              });
                            }}
                            className="flex-1 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all font-semibold text-sm"
                          >
                            <Edit className="inline w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-semibold text-sm"
                          >
                            <Trash2 className="inline w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}

                {/* List View */}
                {userViewMode === 'list' && (
                  <div className={`${theme.card} border ${theme.border} rounded-2xl overflow-hidden`}>
                    <table className="w-full">
                      <thead className={`${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <tr className={`border-b ${theme.border}`}>
                          <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Name</th>
                          <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Email</th>
                          <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Phone</th>
                          <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Role</th>
                          <th className={`text-left py-4 px-6 ${theme.text} font-semibold`}>Kitchen</th>
                          <th className={`text-right py-4 px-6 ${theme.text} font-semibold`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter).map(user => {
                          const kitchen = kitchens.find(k => k.id === user.kitchen?.id);
                          return (
                            <tr key={user.id} className={`border-b ${theme.border} ${theme.hover} transition-all`}>
                              <td className={`py-4 px-6 ${theme.text} font-medium flex items-center gap-2`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                  user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-orange-500'
                                }`}>
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                {user.name}
                              </td>
                              <td className={`py-4 px-6 ${theme.textSecondary} text-sm`}>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {user.email}
                                </div>
                              </td>
                              <td className={`py-4 px-6 ${theme.textSecondary} text-sm`}>
                                {user.phone ? (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {user.phone}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                                  user.role === 'ADMIN'
                                    ? 'bg-purple-500/20 text-purple-600'
                                    : 'bg-orange-500/20 text-orange-600'
                                }`}>
                                  {user.role === 'ADMIN' ? 'Admin' : 'Tea Boy'}
                                </span>
                              </td>
                              <td className={`py-4 px-6 ${theme.textSecondary} text-sm`}>
                                {kitchen ? (
                                  <div className="flex items-center gap-2">
                                    <Coffee className="w-4 h-4" />
                                    {kitchen.name}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setUserModal({ ...user, isNew: false });
                                      setUserForm({
                                        name: user.name,
                                        email: user.email,
                                        phone: user.phone || '',
                                        kitchenId: user.kitchen?.id,
                                        role: user.role || 'TEA_BOY',
                                        password: ''
                                      });
                                    }}
                                    className={`p-2 ${theme.hover} rounded-lg transition-all`}
                                    title="Edit User"
                                  >
                                    <Edit className={`w-4 h-4 ${theme.text}`} />
                                  </button>
                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Delete User"
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
                    {users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter).length === 0 && (
                      <div className="text-center py-16">
                        <Users className={`w-20 h-20 ${theme.textSecondary} mx-auto mb-4`} />
                        <p className={`${theme.textSecondary} text-lg`}>No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            {/* REPORTS TAB */}
            {!loading && activeTab === 'reports' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Orders Today Card */}
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Package className="w-8 h-8 text-blue-500" />
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h4 className={`font-semibold ${theme.textSecondary} mb-2 text-sm uppercase tracking-wide`}>Orders Today</h4>
                    <p className={`text-5xl font-bold ${theme.text} mb-2`}>{stats.totalOrders}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-sm font-semibold">↑ 13%</span>
                      <span className={`text-xs ${theme.textSecondary}`}>from yesterday</span>
                    </div>
                  </div>

                  {/* Avg Prep Time Card */}
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-orange-500/10 rounded-xl">
                        <Clock className="w-8 h-8 text-orange-500" />
                      </div>
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <h4 className={`font-semibold ${theme.textSecondary} mb-2 text-sm uppercase tracking-wide`}>Avg Prep Time</h4>
                    <p className={`text-5xl font-bold ${theme.text} mb-2`}>{stats.avgTime}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-sm font-semibold">↓ 2min</span>
                      <span className={`text-xs ${theme.textSecondary}`}>from last week</span>
                    </div>
                  </div>

                  {/* Top Room Card */}
                  <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 hover:shadow-lg transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl">
                        <DoorOpen className="w-8 h-8 text-purple-500" />
                      </div>
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    </div>
                    <h4 className={`font-semibold ${theme.textSecondary} mb-2 text-sm uppercase tracking-wide`}>Top Room</h4>
                    <p className={`text-3xl font-bold ${theme.text} mb-2`}>{rooms[0]?.name || 'N/A'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 text-sm font-semibold">Most Active</span>
                      <span className={`text-xs ${theme.textSecondary}`}>this week</span>
                    </div>
                  </div>
                </div>

                {/* Order History Table */}
                <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${theme.text}`}>Order History</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${theme.textSecondary}`}>
                        Showing {Math.min(15, orders.length)} of {orders.length} orders
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b-2 ${theme.border}`}>
                          <th className={`text-left py-4 px-4 ${theme.text} font-bold text-sm uppercase tracking-wide`}>Order ID</th>
                          <th className={`text-left py-4 px-4 ${theme.text} font-bold text-sm uppercase tracking-wide`}>Room Name</th>
                          <th className={`text-left py-4 px-4 ${theme.text} font-bold text-sm uppercase tracking-wide`}>Status</th>
                          <th className={`text-left py-4 px-4 ${theme.text} font-bold text-sm uppercase tracking-wide`}>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 15).map(order => {
                          const room = rooms.find(r => r.id === order.roomId);
                          return (
                            <tr key={order.id} className={`border-b ${theme.border} ${theme.hover} transition-all`}>
                              <td className={`py-4 px-4 ${theme.text} font-mono text-sm`}>
                                #{order.id.substring(0, 8)}
                              </td>
                              <td className={`py-4 px-4 ${theme.text} font-semibold`}>
                                {room?.name || order.roomName || 'Unknown Room'}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                                  order.status === 'preparing' ? 'bg-blue-500/20 text-blue-600' :
                                  order.status === 'ready' ? 'bg-purple-500/20 text-purple-600' :
                                  order.status === 'delivered' ? 'bg-green-500/20 text-green-600' :
                                  'bg-gray-500/20 text-gray-600'
                                }`}>
                                  {order.status === 'pending' && '⏳'}
                                  {order.status === 'preparing' && '👨‍🍳'}
                                  {order.status === 'ready' && '✅'}
                                  {order.status === 'delivered' && '🎉'}
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </td>
                              <td className={`py-4 px-4 ${theme.textSecondary} text-sm`}>
                                {new Date(order.timestamp || order.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {orders.length === 0 && (
                      <div className="text-center py-16">
                        <FileText className={`w-20 h-20 ${theme.textSecondary} mx-auto mb-4`} />
                        <p className={`${theme.textSecondary} text-lg`}>No orders yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {!loading && activeTab === 'settings' && (
              <Settings darkMode={darkMode} toggleTheme={toggleTheme} theme={theme} />
            )}
          </div>
        </div>

        {/* MODALS */}
        {/* Room Modal */}
        {roomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme.card} rounded-2xl border-2 border-purple-500/50 p-5 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${theme.text}`}>
                {roomModal.isNew ? 'Add New Room' : 'Edit Room'}
              </h3>
              <button onClick={() => setRoomModal(null)} className={`p-1.5 ${theme.hover} rounded-lg transition-all`}>
                <X className={`w-5 h-5 ${theme.text}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`${theme.text} font-semibold mb-1 block text-sm`}>Room Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Meeting Room A"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 ${theme.input} border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`${theme.text} font-semibold mb-1 block text-sm`}>Floor *</label>
                  <input
                    type="number"
                    min="1"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
                    className={`w-full px-3 py-2 ${theme.input} border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm`}
                  />
                </div>
                <div>
                  <label className={`${theme.text} font-semibold mb-1 block text-sm`}>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    className={`w-full px-3 py-2 ${theme.input} border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm`}
                  />
                </div>
                <div>
                  <label className={`${theme.text} font-semibold mb-1 block text-sm`}>Building</label>
                  <input
                    type="text"
                    value={roomForm.building}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, building: e.target.value }))}
                    className={`w-full px-3 py-2 ${theme.input} border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm`}
                  />
                </div>
              </div>

              <div>
                <label className={`${theme.text} font-semibold mb-1 block text-sm`}>Assign to Kitchen *</label>
                <select
                  value={roomForm.kitchenId || ''}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, kitchenId: e.target.value || null }))}
                  className={`w-full px-3 py-2 ${theme.input} border rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm`}
                >
                  <option value="">Select Kitchen</option>
                  {kitchens.map(k => (
                    <option key={k.id} value={k.id}>{k.name} (Floor {k.floor})</option>
                  ))}
                </select>
              </div>

              {/* Room Token Section */}
              {!roomModal.isNew && (
                <div className="border-t border-purple-500/20 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`${theme.text} font-semibold text-sm`}>Webex Device Token</label>
                    {roomModal.roomToken && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-600 text-xs rounded-full font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Generate a token for Webex Navigator devices
                  </p>
                  {roomModal.roomToken ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Room URL:</p>
                        <p className="text-xs text-green-600 font-mono break-all mb-2">{`${window.location.origin}/tenant/room/${roomModal.roomToken}`}</p>
                        <button
                          onClick={() => {
                            const roomUrl = `${window.location.origin}/tenant/room/${roomModal.roomToken}`;
                            navigator.clipboard.writeText(roomUrl).then(() => {
                              alert('✅ Room URL copied to clipboard!');
                            });
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-all"
                        >
                          📋 Copy URL
                        </button>
                      </div>
                      <button
                        onClick={() => generateRoomToken(roomModal.id)}
                        className="w-full py-1.5 bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all font-semibold text-xs"
                      >
                        🔄 Regenerate Token
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => generateRoomToken(roomModal.id)}
                      className="w-full py-1.5 bg-purple-500/10 text-purple-600 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all font-semibold text-xs"
                    >
                      🔑 Generate Token
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setRoomModal(null)}
                  className={`flex-1 py-2 ${theme.card} border ${theme.border} ${theme.text} rounded-lg font-bold hover:opacity-80 transition-all text-sm`}
                >
                  Cancel
                </button>
                <button
                  onClick={roomModal.isNew ? addRoom : updateRoom}
                  disabled={!roomForm.name || !roomForm.kitchenId}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 text-sm shadow-lg"
                >
                  <Save className="inline mr-1 w-4 h-4" />
                  {roomModal.isNew ? 'Add Room' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kitchen Modal */}
      {kitchenModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className={`${theme.card} rounded-3xl border-2 border-orange-500/50 p-8 max-w-2xl w-full shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-3xl font-bold ${theme.text}`}>
                {kitchenModal.isNew ? 'Add New Kitchen' : 'Edit Kitchen'}
              </h3>
              <button onClick={() => setKitchenModal(null)} className={`p-2 ${theme.hover} rounded-lg transition-all`}>
                <X className={`w-8 h-8 ${theme.text}`} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`${theme.text} font-semibold mb-2 block`}>Kitchen Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Kitchen Floor 1"
                  value={kitchenForm.name}
                  onChange={(e) => setKitchenForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-lg`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>Floor *</label>
                  <input
                    type="number"
                    min="1"
                    value={kitchenForm.floor}
                    onChange={(e) => setKitchenForm(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-lg`}
                  />
                </div>
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>Building</label>
                  <input
                    type="text"
                    value={kitchenForm.building}
                    onChange={(e) => setKitchenForm(prev => ({ ...prev, building: e.target.value }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-lg`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setKitchenModal(null)}
                  className={`flex-1 py-3 ${theme.card} border ${theme.border} ${theme.text} rounded-xl font-bold hover:opacity-80 transition-all text-lg`}
                >
                  Cancel
                </button>
                <button
                  onClick={kitchenModal.isNew ? addKitchen : updateKitchen}
                  disabled={!kitchenForm.name}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 text-lg shadow-lg"
                >
                  <Save className="inline mr-2 w-5 h-5" />
                  {kitchenModal.isNew ? 'Add Kitchen' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {userModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className={`${theme.card} rounded-3xl border-2 border-green-500/50 p-8 max-w-2xl w-full shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-3xl font-bold ${theme.text}`}>
                {userModal.isNew ? 'Add New User' : 'Edit User'}
              </h3>
              <button onClick={() => setUserModal(null)} className={`p-2 ${theme.hover} rounded-lg transition-all`}>
                <X className={`w-8 h-8 ${theme.text}`} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className={`${theme.text} font-semibold mb-2 block`}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Ahmed Ali"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-lg`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>Email *</label>
                  <input
                    type="email"
                    placeholder="user@company.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-lg`}
                  />
                </div>
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+971501234567"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-lg`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>Role *</label>
                  <select
                    value={userForm.role || 'TEA_BOY'}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value, kitchenId: e.target.value === 'ADMIN' ? null : prev.kitchenId }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-lg`}
                  >
                    <option value="TEA_BOY">Tea Boy</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <p className={`text-xs ${theme.textSecondary} mt-1`}>
                    Admins have full access, Tea Boys manage orders
                  </p>
                </div>
                <div>
                  <label className={`${theme.text} font-semibold mb-2 block`}>
                    Assign to Kitchen {userForm.role === 'TEA_BOY' ? '*' : ''}
                  </label>
                  <select
                    value={userForm.kitchenId || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, kitchenId: e.target.value || null }))}
                    className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-lg`}
                    disabled={userForm.role === 'ADMIN'}
                  >
                    <option value="">{userForm.role === 'ADMIN' ? 'N/A (Admin)' : 'Select Kitchen'}</option>
                    {kitchens.map(k => (
                      <option key={k.id} value={k.id}>Kitchen {k.kitchenNumber} - {k.name} (Floor {k.floor})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`${theme.text} font-semibold mb-2 block`}>
                  Password {userModal.isNew ? '*' : '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  placeholder={userModal.isNew ? "Enter password for user login" : "Enter new password (optional)"}
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full px-4 py-3 ${theme.input} border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-lg`}
                />
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {userModal.isNew
                    ? 'This password will be used to login to the dashboard'
                    : 'Leave empty to keep the current password, or enter a new one to change it'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setUserModal(null)}
                  className={`flex-1 py-3 ${theme.card} border ${theme.border} ${theme.text} rounded-xl font-bold hover:opacity-80 transition-all text-lg`}
                >
                  Cancel
                </button>
                <button
                  onClick={userModal.isNew ? addUser : updateUser}
                  disabled={
                    !userForm.name?.trim() ||
                    !userForm.email?.trim() ||
                    (userForm.role === 'TEA_BOY' && !userForm.kitchenId) ||
                    (userModal.isNew && (!userForm.password || userForm.password.trim().length === 0))
                  }
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 text-lg shadow-lg"
                >
                  <Save className="inline mr-2 w-5 h-5" />
                  {userModal.isNew ? 'Add User' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;