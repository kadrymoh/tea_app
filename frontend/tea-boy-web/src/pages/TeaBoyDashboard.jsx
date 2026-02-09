// frontend/tea-boy-web/src/pages/TeaBoyDashboard.jsx
// ============================================
// PART 1/3: Imports, State, and Functions
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Coffee, Clock, CheckCircle, Package, Menu, Plus, Edit, Trash2,
  X, Save, Play, Check, AlertCircle, Upload, LogOut, Loader
} from 'lucide-react';
import ImageCropModal from '../components/ImageCropModal';
import { io } from 'socket.io-client';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { API_CONFIG, getApiUrl } from '../config/api.config';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const TeaBoyDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();

  const API_BASE_URL = API_CONFIG.BASE_URL;
  const KITCHEN_ID = user?.kitchenId;
  const KITCHEN_NUMBER = user?.kitchenNumber;

  const [activeOrderTab, setActiveOrderTab] = useState('new');
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [editItemModal, setEditItemModal] = useState(null);
  const [addItemModal, setAddItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMenuManagement, setShowMenuManagement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const emojiOptions = ['☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍹', '🍊', '🍋', '🍎', '🍌', '🥐', '🍪', '🍩', '🧇', '🥟', '🍱', '🍜', '🍕', '💧', '🧊'];

  const [itemForm, setItemForm] = useState({
    name: '',
    nameAr: '',
    category: 'COFFEE',
    price: '',
    description: '',
    emoji: '☕',
    imageUrl: null,
    available: true,
    hasPricing: true,
    hasSugar: true,
    hasIce: false
  });

  // Light theme colors (matching Meeting Room interface)
  const theme = {
    // Colors
    primary: 'bg-sky-400',
    primaryHover: 'hover:bg-sky-500',
    primaryText: 'text-sky-400',
    primaryBg: 'bg-sky-50',
    primaryBorder: 'border-sky-400',
    primaryRing: 'ring-sky-400',
    primaryShadow: 'shadow-sky-500/20',
    
    // Backgrounds
    mainBg: 'bg-slate-50',
    surfaceBg: 'bg-white',
    surfaceHover: 'hover:bg-slate-100',
    surfaceHighlight: 'bg-slate-50',
    headerBg: 'bg-white/80',
    footerBg: 'bg-white/90',
    
    // Text
    textMain: 'text-slate-900',
    textSecondary: 'text-slate-500',
    textTertiary: 'text-slate-700',
    
    // Borders
    border: 'border-slate-200',
    borderHover: 'hover:border-slate-300',
    
    // Interactive elements
    buttonBg: 'bg-slate-100',
    buttonHover: 'hover:bg-slate-200',
    buttonText: 'text-slate-700',
    
    // Shadows
    shadow: 'shadow-slate-200/50',
    shadowMd: 'shadow-md',
    shadowLg: 'shadow-lg',
    
    // Icons
    iconColor: 'text-slate-700',
    
    // Status colors
    statusNew: 'bg-green-500',
    statusNewBg: 'bg-green-50',
    statusNewText: 'text-green-600',
    statusNewBorder: 'border-green-400',
    
    statusProgress: 'bg-orange-500',
    statusProgressBg: 'bg-orange-50',
    statusProgressText: 'text-orange-600',
    statusProgressBorder: 'border-orange-400',
    
    statusDelivered: 'bg-blue-500',
    statusDeliveredBg: 'bg-blue-50',
    statusDeliveredText: 'text-blue-600',
    statusDeliveredBorder: 'border-blue-400'
  };

  const categoryMap = {
    'HOT_TEA': 'Hot Tea',
    'COFFEE': 'Coffee',
    'JUICE': 'Juice',
    'WATER': 'Water',
    'SOFT_DRINK': 'Soft Drink',
    'SNACKS': 'Snacks',
    'OTHER': 'Other'
  };

  const categories = ['All Items', 'Hot Tea', 'Coffee', 'Juice', 'Snacks', 'Water'];

  // Track if app is in foreground or background
  const isAppInForeground = useRef(true);

  // Request notification permission on mount and setup app state tracking
  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Request Capacitor Local Notifications permission if on native platform
    const setupNativeNotifications = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const permission = await LocalNotifications.requestPermissions();
          console.log('📱 Local Notifications permission:', permission);

          // Create notification channels for Android
          if (Capacitor.getPlatform() === 'android') {
            // Delete existing channels first to update sound settings
            try {
              await LocalNotifications.deleteChannel({ id: 'new_order' });
              await LocalNotifications.deleteChannel({ id: 'order_prepared' });
              await LocalNotifications.deleteChannel({ id: 'order_delivered' });
            } catch (e) {
              console.log('Channels did not exist yet');
            }

            await LocalNotifications.createChannel({
              id: 'new_order',
              name: 'New Orders',
              description: 'Notifications for new orders',
              importance: 5,
              visibility: 1,
              sound: 'new_order',
              vibration: true,
              lights: true
            });

            await LocalNotifications.createChannel({
              id: 'order_prepared',
              name: 'Order Prepared',
              description: 'Notifications when orders are prepared',
              importance: 4,
              visibility: 1,
              sound: 'prepared',
              vibration: true
            });

            await LocalNotifications.createChannel({
              id: 'order_delivered',
              name: 'Order Delivered',
              description: 'Notifications when orders are delivered',
              importance: 3,
              visibility: 1,
              sound: 'new_order',
              vibration: true
            });

            console.log('📱 Notification channels created successfully');
          }
        } catch (e) {
          console.log('Native notifications setup error:', e);
        }
      }
    };

    setupNativeNotifications();

    // Track app visibility state
    const handleVisibilityChange = () => {
      isAppInForeground.current = !document.hidden;
      console.log('📱 App visibility:', isAppInForeground.current ? 'Foreground' : 'Background');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Function to show native notification (works in both foreground and background)
  const showNativeNotification = async (title, body, channelId = 'new_order') => {
    console.log('📱 showNativeNotification called:', { title, body, channelId, isNative: Capacitor.isNativePlatform(), inForeground: isAppInForeground.current });

    if (Capacitor.isNativePlatform()) {
      try {
        const notificationId = Math.floor(Math.random() * 2147483647);
        console.log('📱 Scheduling notification with ID:', notificationId);

        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: notificationId,
              channelId,
              sound: channelId === 'new_order' ? 'new_order' :
                     channelId === 'order_prepared' ? 'prepared' : 'new_order',
              smallIcon: 'ic_notification',
              iconColor: '#0ea5e9',
              ongoing: false,
              autoCancel: true
            }
          ]
        });
        console.log('📱 Native notification scheduled successfully');
      } catch (e) {
        console.log('❌ Native notification error:', e);
      }
    } else {
      console.log('📱 Not a native platform, skipping native notification');
    }
  };

  // Function to show browser notification (fallback for web)
  const showBrowserNotification = (title, body, icon = '☕') => {
    // Only show browser notification if app is in background on web
    if (!Capacitor.isNativePlatform() && !isAppInForeground.current) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: icon,
          badge: '☕',
          vibrate: [200, 100, 200],
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }
  };

  // Different notification sounds for different events
  const notificationSounds = {
    // New order sound - cheerful ding
    newOrder: 'data:audio/wav;base64,UklGRl9vT19teleGZtdCBmb3JtYXQAAQFAAAAAgD4AAIA+AAABAAgATElTVBoAAABJTkZPSVNGVA4AAABMYXZmNTguMjkuMTAwAGRhdGEA' +
      'UklGRqQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYAFAABkAGQAZACQALYA1ADiAOQA2gDCAJ4AcAA+AAoA2v+q/4b/aP9a/1j/Yv92/5T/uP/i/xAAQgB2AKoA3AAIATIBWAFyAYgBkgGQAYQBbAFIARoB4gCmAGYAIgDe/5r/Vv8a/+j+wP6m/pz+nP6s/sj+7P4Y/0z/hP/A//7/QACCBMQEAAADAAwAFQAcACAAIQAfABsAFAALAAEA9v/q/97/0//K/8P/vv+8/7z/v//E/8z/1f/g/+z/+f8HABYAJQAyAD8ASQBRAE2PRwA+ADIAJAAUAAMAc/9i/1P/R/8+/zj/Nf81/zn/P/9I/1T/Yv9y/4X/mv+w/8j/4P/5/xMALQBGAF4AdACIAJgApgCwALUAtwC0AK0AoQCSAH8AaQBQADQAFwD5/9v/vf+g/4X/bP9X/0X/N/8t/yj/J/8r/zL/Pv9O/2L/ef+S/6//zf/t/w4AMABRAH8AqwDOAPABCgEiATYBSAFVAV0BYQE=',

    // Prepared sound - gentle chime
    prepared: 'data:audio/wav;base64,UklGRrQCAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZACAAAAAAEAAgAEAAcACgANABEAFQAZAB0AIQAlACkALQAxADQAOAA7AD4AQABCAEQARQBFAEUARABBAD0AOQA0AC4AKAARAB8AFwAOAAUA+//x/+f/3f/T/8n/wP+3/67/pv+f/5n/lP+Q/43/i/+K/4r/jP+P/5P/mP+f/6f/r/+5/8P/zv/Z/+X/8P/7/wYAEQAcACYALwA4AEAARwBNAFIAVgBZAFoAWgBYAFUAUABKAEMAOwAyACcAHAAQAAQA+P/r/97/0P/D/7b/qf+d/5H/hv98/3P/a/9k/17/Wf9W/1X/Vf9X/1r/X/9m/27/d/+B/4z/mP+l/7L/wP/O/9z/6v/3/wQAEQAdACkANAA+AEcATwBVAFoAXgBfAGAAXwBcAFgAUgBLAEMAOQAuACIAFgAJAPz/7v/f/9H/w/+1/6f/mv+O/4P/ef9w/2n/Y/9f/1z/W/9b/13/YP9l/2z/dP99/4f/kv+e/6v/uP/F/9L/4P/t//n/BQARABwAJgAvADcAPgBDAEgASwBMAEwASwBIAEQAPgA3AC8AJgAcABEABgD6/+7/4f/U/8j/vP+x/6b/nP+T/4v/hP9+/3n/dv90/3P/dP92/3n/ff+C/4j/j/+X/5//qP+x/7v/xf/P/9n/4//s//X//v8GAAQAAA==',

    // Delivered sound - success sound
    delivered: 'data:audio/wav;base64,UklGRpICAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YW4CAAAAAAMACAAOABYAHgAnADAAOABAAEcATgBTAFcAWgBbAFoAWABUAE8ASAA/ADYAKwAfABMABgD5/+v/3f/P/8H/s/+m/5r/j/+F/3z/dP9u/2n/Zv9l/2X/Z/9r/3D/d/9//4n/lP+g/63/u//J/9j/5//2/wUAFAAgAC0AOgBFAE8AWABfAGUAaQBrAGsAaQBlAF8AWABPAEUA8AAqAB4AEgAFAPn/7P/f/9L/xf+5/67/o/+Z/5D/iP+C/3z/eP91/3T/dP91/3j/fP+B/4f/j/+X/6D/qv+0/7//yv/V/+D/6//1//8ACQASABsAIwAqADEANgA7AD4AQABBAEEAPwA8ADgAMwAtACYAHwAWAA0AAwD5/+//5P/Z/87/xP+5/6//pf+c/5T/jP+G/4D/e/94/3X/dP90/3X/d/96/37/hP+K/5H/mP+g/6n/sv+7/8T/zf/W/9//5//v//b//P8CAAcADAAPABIAFAAVABUAFAAUABEADwALAAcAAwD+//n/9P/u/+n/4//e/9n/1P/Q/8z/yP/F/8P/wf/A/7//v/+//8D/wv/E/8f/y//O/9P/1//c/+H/5v/r/+//9P/4//v//v8AAAIAAwAEAAQABAACAAAA'
  };

  // Function to play notification sound based on type
  const playNotificationSound = (type = 'newOrder') => {
    try {
      const soundData = notificationSounds[type] || notificationSounds.newOrder;
      const audio = new Audio(soundData);
      audio.volume = 1.0;
      audio.play().catch(e => console.log('Could not play sound:', e));
    } catch (e) {
      console.log('Sound playback error:', e);
    }
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const loadOrders = useCallback(async () => {
    if (!KITCHEN_ID) {
      console.warn('⚠️  Cannot load orders: Kitchen ID is missing');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/orders?kitchenId=${KITCHEN_ID}&date=today`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        // Filter orders that are less than 12 hours old
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const recentOrders = (data.data || []).filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate > twelveHoursAgo;
        });
        setOrders(recentOrders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  }, [KITCHEN_ID]);

  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/menu`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setMenuItems(data.data || []);
    } catch (err) {
      console.error('Failed to load menu:', err);
      setError('Failed to load menu items');
    }
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('🔄 Updating order status:', { orderId, newStatus });
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      console.log('📥 Update response:', data);

      if (!res.ok || !data.success) {
        console.error('❌ Failed to update order:', data);
        const errorMsg = data.message || 'Failed to update order status';
        setError(errorMsg);
        showError(errorMsg, 'Order Update Failed');
        return;
      }

      await loadOrders();
      setError(null);

      // Show success message based on status
      const statusMessages = {
        'PREPARING': 'Order is now being prepared',
        'DELIVERED': 'Order marked as delivered successfully',
        'CANCELLED': 'Order has been cancelled'
      };
      success(statusMessages[newStatus] || 'Order status updated', 'Order Updated ✓');
      console.log('✅ Order status updated successfully');
    } catch (err) {
      console.error('❌ Update order error:', err);
      const errorMsg = 'Failed to update order: Network error';
      setError(errorMsg);
      showError(errorMsg, 'Connection Error');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!cancelReason.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'CANCELLED', cancelReason })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.message || 'Failed to cancel order';
        setError(errorMsg);
        showError(errorMsg, 'Cancel Failed');
        return;
      }

      setCancelModal(null);
      setCancelReason('');
      await loadOrders();
      setError(null);
      success('Order cancelled successfully', 'Order Cancelled');
    } catch (err) {
      console.error('Cancel failed:', err);
      const errorMsg = 'Failed to cancel order: Network error';
      setError(errorMsg);
      showError(errorMsg, 'Connection Error');
    }
  };

  const toggleAvailability = async (id) => {
    try {
      console.log('🔄 Toggling availability for item:', id);
      const res = await fetch(`${API_BASE_URL}/menu/${id}/availability`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      console.log('📥 Toggle response:', data);

      if (!res.ok || !data.success) {
        console.error('❌ Failed to toggle availability:', data);
        const errorMsg = data.message || 'Failed to update item availability';
        setError(errorMsg);
        showError(errorMsg, 'Availability Update Failed');
        return;
      }

      await loadMenu();
      setError(null);
      const itemName = data.data?.name || 'Item';
      const isAvailable = data.data?.available;
      success(
        `${itemName} is now ${isAvailable ? 'available' : 'out of stock'}`,
        isAvailable ? 'Item Available ✓' : 'Item Unavailable'
      );
      console.log('✅ Availability toggled successfully');
    } catch (err) {
      console.error('❌ Toggle availability error:', err);
      const errorMsg = 'Failed to update availability: Network error';
      setError(errorMsg);
      showError(errorMsg, 'Connection Error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Image size too large! Maximum file size is 5MB.\n\nالملف كبير جداً! الحد الأقصى 5 ميجابايت', 'Image Too Large');
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file\n\nالرجاء اختيار صورة', 'Invalid File Type');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCroppedImage = async (croppedBlob) => {
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemForm(prev => ({ ...prev, imageUrl: reader.result }));
        setImageToCrop(null);
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(croppedBlob);
    } catch (err) {
      console.error('Error processing cropped image:', err);
      showError('Failed to process image', 'Upload Error');
      setIsUploadingImage(false);
    }
  };

  const handleCancelCrop = () => {
    setImageToCrop(null);
  };

  const openAddModal = () => {
    setItemForm({
      name: '', nameAr: '', category: 'COFFEE', price: '', description: '',
      emoji: '☕', imageUrl: null, available: true, hasPricing: true,
      hasSugar: true, hasIce: false
    });
    setAddItemModal(true);
  };

  const openEditModal = (item) => {
    setItemForm({
      name: item.name,
      nameAr: item.nameAr || '',
      category: item.category,
      price: item.price?.toString() || '',
      description: item.description || '',
      emoji: item.emoji || '☕',
      imageUrl: item.imageUrl || null,
      available: item.available,
      hasPricing: item.price !== null && item.price !== undefined && item.price > 0,
      hasSugar: item.hasSugar !== undefined ? item.hasSugar : true,
      hasIce: item.isIceOnly || false
    });
    setEditItemModal(item);
  };

  const saveMenuItem = async () => {
    if (!itemForm.name) {
      const errorMsg = 'Please enter item name';
      setError(errorMsg);
      showError(errorMsg, 'Missing Information');
      return;
    }

    // Validate price if pricing is enabled
    if (itemForm.hasPricing && (!itemForm.price || itemForm.price === '' || isNaN(parseFloat(itemForm.price)))) {
      const errorMsg = 'Please enter a valid price';
      setError(errorMsg);
      showError(errorMsg, 'Invalid Price');
      return;
    }

    try {
      setLoading(true);

      // Parse price safely
      const parsedPrice = itemForm.hasPricing ? parseFloat(itemForm.price) || 0 : 0;

      const body = {
        name: itemForm.name,
        nameAr: itemForm.nameAr || null,
        category: itemForm.category,
        price: parsedPrice,
        description: itemForm.description || '',
        emoji: itemForm.emoji,
        imageUrl: itemForm.imageUrl || null,
        available: itemForm.available,
        hasSugar: itemForm.hasSugar,
        isIceOnly: itemForm.hasIce || false
      };

      console.log('📤 Sending menu item data:', body);

      const method = editItemModal ? 'PUT' : 'POST';
      const url = editItemModal ? `${API_BASE_URL}/menu/${editItemModal.id}` : `${API_BASE_URL}/menu`;
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
      const data = await res.json();

      console.log('📥 Server response:', data);

      if (data.success) {
        await loadMenu();
        setAddItemModal(false);
        setEditItemModal(null);
        setError(null);
        success(
          editItemModal ? `${itemForm.name} updated successfully` : `${itemForm.name} added to menu`,
          editItemModal ? 'Item Updated ✓' : 'Item Added ✓'
        );
      } else {
        const errorMsg = data.message || data.error || 'Failed to save menu item';
        setError(errorMsg);
        showError(errorMsg, 'Save Failed');
      }
    } catch (err) {
      console.error('Failed to save item:', err);
      const errorMsg = 'Failed to save menu item: Network error';
      setError(errorMsg);
      showError(errorMsg, 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/menu/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.message || 'Failed to delete menu item';
        setError(errorMsg);
        showError(errorMsg, 'Delete Failed');
        return;
      }

      await loadMenu();
      setError(null);
      success('Menu item deleted successfully', 'Item Deleted');
    } catch (err) {
      console.error('Failed to delete item:', err);
      const errorMsg = 'Failed to delete item: Network error';
      setError(errorMsg);
      showError(errorMsg, 'Connection Error');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/tenant/tea-boy/login');
    }
  };

  const getTimeElapsed = (timestamp) => {
    const diffMs = new Date() - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours > 0) return `${diffHours}h`;
    return `${diffMins}m`;
  };

  useEffect(() => {
    if (!KITCHEN_ID || !KITCHEN_NUMBER) {
      return;
    }

    loadOrders();
    loadMenu();

    // Update clock every second
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 🔌 Setup Socket.IO connection for real-time updates
    const socket = io(API_CONFIG.SOCKET_URL);

    // Join kitchen channel
    socket.emit('join-kitchen', KITCHEN_ID);
    console.log('🔌 Tea Boy connected to Socket.IO and joined kitchen:', KITCHEN_ID);

    // Listen for new orders
    socket.on('new-order', (order) => {
      console.log('🔔 Tea Boy received new order:', order);

      // Get room name from order (check multiple possible locations)
      const roomName = order.room?.name || order.roomName || `Room #${order.roomId}`;

      // Always show system notification (even when app is open)
      showNativeNotification(
        '🔔 New Order Received!',
        `Room: ${roomName} - ${order.items?.length || 0} items`,
        'new_order'
      );

      // If app is in foreground - also show in-app toast
      if (isAppInForeground.current) {
        success(`New order received from ${roomName}`, 'New Order! 🔔');
        playNotificationSound('newOrder');
      } else {
        // Fallback for web when in background
        showBrowserNotification(
          '🔔 New Order Received!',
          `Room: ${roomName}\nItems: ${order.items?.length || 0}`,
          '☕'
        );
      }

      loadOrders(); // Reload orders when new order received
    });

    // Listen for order updates
    socket.on('order-update', (order) => {
      console.log('🔔 Tea Boy received order update:', order);

      // Get order identifier (use orderNumber, id, or room name)
      const orderIdentifier = order.orderNumber || order.id?.slice(-6) || 'Order';
      const roomName = order.room?.name || order.roomName || '';
      const status = order.status?.toUpperCase() || '';

      // Determine sound based on status
      let soundType = 'newOrder';
      let channelId = 'new_order';
      if (status === 'PREPARING') {
        soundType = 'prepared';
        channelId = 'order_prepared';
      } else if (status === 'DELIVERED') {
        soundType = 'delivered';
        channelId = 'order_delivered';
      }

      // Always show system notification for order updates when app is in background
      if (!isAppInForeground.current) {
        showNativeNotification(
          `Order ${status}`,
          `Order ${orderIdentifier}${roomName ? ` from ${roomName}` : ''}`,
          channelId
        );
      }

      // Play sound when app is in foreground
      if (isAppInForeground.current) {
        playNotificationSound(soundType);
      }

      loadOrders(); // Reload orders when update received
    });

    // Cleanup on unmount
    return () => {
      clearInterval(clockTimer);
      socket.disconnect();
      console.log('🔌 Tea Boy Socket.IO disconnected');
    };
  }, [loadOrders, loadMenu, KITCHEN_ID, KITCHEN_NUMBER]);

  const filteredOrders = {
    new: orders.filter(o => o.status === 'PENDING'),
    progress: orders.filter(o => o.status === 'PREPARING'),
    delivered: orders.filter(o => o.status === 'DELIVERED')
  };

  const filteredMenu = selectedCategory === 'all' || selectedCategory === 'All Items'
    ? menuItems
    : menuItems.filter(item => categoryMap[item.category] === selectedCategory);

  if (!user?.kitchenNumber) {
    return (
      <div className={`min-h-screen ${theme.mainBg} flex items-center justify-center`}>
        <div className="text-center">
          <Loader className={`w-12 h-12 ${theme.primaryText} animate-spin mx-auto mb-4`} />
          <p className={`${theme.textMain} text-lg`}>Redirecting to login...</p>
          <p className={`${theme.textSecondary} text-sm mt-2`}>Please sign in again to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${theme.mainBg} overflow-hidden`}>
      {/* Custom Scrollbar Styles */}
      <style>
        {`
          ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: #94a3b8 #f1f5f9;
          }
        `}
      </style>

      {/* Header */}
      <header className={`${theme.surfaceBg} ${theme.border} border-b backdrop-blur-sm flex-shrink-0`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 ${theme.primary} rounded-full ${theme.shadowMd}`}>
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme.textMain}`}>Tea Boy Kitchen</h1>
                <p className={`${theme.textSecondary} text-sm`}>
                  {user?.name} • Kitchen #{KITCHEN_NUMBER || 1} • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMenuManagement(!showMenuManagement)}
                className={`p-3 ${theme.buttonBg} ${theme.buttonHover} rounded-full transition-all ${theme.shadowMd}`}
                title={showMenuManagement ? 'Back to Orders' : 'Menu Management'}
              >
                {showMenuManagement ? <X className={`w-6 h-6 ${theme.iconColor}`} /> : <Menu className={`w-6 h-6 ${theme.iconColor}`} />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-all font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Orders View */}
      {!showMenuManagement && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4">
            <div className={`flex gap-2 ${theme.surfaceBg} p-2 rounded-2xl ${theme.border} border ${theme.shadowMd} max-w-3xl mx-auto`}>
              {['new', 'progress', 'delivered'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveOrderTab(tab)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center ${
                    activeOrderTab === tab
                      ? tab === 'new' ? `${theme.statusNew} text-white ${theme.shadowLg}`
                      : tab === 'progress' ? `${theme.statusProgress} text-white ${theme.shadowLg}`
                      : `${theme.statusDelivered} text-white ${theme.shadowLg}`
                      : `${theme.textSecondary} ${theme.surfaceHover}`
                  }`}
                >
                  <span>{tab === 'new' ? 'New Orders' : tab === 'progress' ? 'In Progress' : 'Delivered'}</span>
                  {filteredOrders[tab].length > 0 && (
                    <span className={`ml-2 bg-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      tab === 'new' ? theme.statusNewText : tab === 'progress' ? theme.statusProgressText : theme.statusDeliveredText
                    }`}>
                      {filteredOrders[tab].length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Error Message inside Orders tab */}
            {error && (
              <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <span className={`${theme.textMain} font-semibold`}>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
              {filteredOrders[activeOrderTab].length === 0 ? (
                <div className={`col-span-full ${theme.surfaceHighlight} rounded-2xl p-16 text-center ${theme.border} border`}>
                  <Package className={`w-16 h-16 ${theme.textSecondary} mx-auto mb-4`} />
                  <p className={`${theme.textSecondary} text-lg`}>No {activeOrderTab} orders</p>
                </div>
              ) : (
                filteredOrders[activeOrderTab].map(order => (
                  <div
                    key={order.id}
                    className={`${theme.surfaceBg} rounded-2xl p-5 border-l-4 ${theme.shadowLg} hover:shadow-xl transition-all ${
                      activeOrderTab === 'new' ? theme.statusNewBorder :
                      activeOrderTab === 'progress' ? theme.statusProgressBorder : theme.statusDeliveredBorder
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`text-xl font-bold ${theme.textMain} mb-1`}>{order.room?.name || `Room #${order.roomId}`}</h3>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                          activeOrderTab === 'new' ? theme.statusNewBg + ' ' + theme.statusNewText :
                          activeOrderTab === 'progress' ? theme.statusProgressBg + ' ' + theme.statusProgressText : theme.statusDeliveredBg + ' ' + theme.statusDeliveredText
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            activeOrderTab === 'new' ? theme.statusNew + ' animate-pulse' :
                            activeOrderTab === 'progress' ? theme.statusProgress : theme.statusDelivered
                          }`}></span>
                          {activeOrderTab === 'new' && 'New Order'}
                          {activeOrderTab === 'progress' && 'In Progress'}
                          {activeOrderTab === 'delivered' && 'Delivered'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 font-bold px-3 py-1 rounded-full text-sm ${
                        parseInt(getTimeElapsed(order.createdAt)) > 5 ? 'bg-red-50 text-red-600 border-2 border-red-200' : theme.surfaceHighlight + ' ' + theme.textSecondary
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>{getTimeElapsed(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className={`${theme.surfaceHighlight} rounded-xl p-3 mb-4 ${theme.border} border`}>
                      <ul className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className={`flex items-center justify-center ${theme.buttonBg} ${theme.textMain} font-bold h-5 w-5 rounded text-xs`}>
                              {item.quantity}
                            </span>
                            <div className="flex-1 flex items-start gap-2">
                              {item.menuItem?.imageUrl ? (
                                <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-8 h-8 rounded object-cover" />
                              ) : (
                                <span className="text-2xl">{item.menuItem?.emoji || '☕'}</span>
                              )}
                              <div className="flex-1">
                                <p className={`${theme.textMain} font-medium text-sm`}>{item.menuItem?.name || item.name || 'Item'}</p>
                                {item.sugar !== null && item.sugar !== undefined && (
                                  <p className={`${theme.textSecondary} text-xs`}>Sugar: Level {item.sugar}</p>
                                )}
                                {item.notes && <p className={`${theme.textSecondary} text-xs`}>Note: {item.notes}</p>}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      {activeOrderTab === 'new' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                            className={`w-full py-2.5 ${theme.primary} ${theme.primaryHover} text-white rounded-xl font-bold transition-all ${theme.shadowLg} flex items-center justify-center text-sm`}
                          >
                            <Play className="w-4 h-4 mr-2" />Start Preparing
                          </button>
                          <button
                            onClick={() => setCancelModal(order)}
                            className="w-full py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-all text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {activeOrderTab === 'progress' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                          className={`w-full py-2.5 ${theme.statusNew} hover:bg-green-600 text-white rounded-xl font-bold transition-all ${theme.shadowLg} flex items-center justify-center text-sm`}
                        >
                          <Check className="w-4 h-4 mr-2" />Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <footer className={`${theme.surfaceBg} ${theme.border} border-t p-4 flex justify-between items-center px-8 backdrop-blur-sm`}>
            <div className={`flex gap-6 ${theme.textSecondary} text-sm font-bold`}>
              <span>Total Today: <span className={theme.textMain}>{orders.length}</span></span>
              <span>Pending: <span className="text-yellow-600">{filteredOrders.new.length}</span></span>
              <span>Preparing: <span className="text-orange-600">{filteredOrders.progress.length}</span></span>
            </div>
          </footer>
        </div>
      )}

      {/* Menu Management View */}
      {showMenuManagement && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${theme.shadowMd} ${
                    selectedCategory === cat
                      ? `${theme.primary} text-white ${theme.shadowLg}`
                      : `${theme.surfaceBg} ${theme.textSecondary} ${theme.surfaceHover} ${theme.border} border`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Error Message inside Menu tab */}
            {error && (
              <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <span className={`${theme.textMain} font-semibold`}>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 pb-20">
              {filteredMenu.map(item => (
                <div
                  key={item.id}
                  className={`group ${theme.surfaceBg} rounded-xl p-2 border transition-all ${theme.shadowMd} ${
                    item.available ? `${theme.border} ${theme.borderHover} hover:${theme.shadowLg}` : `${theme.border} opacity-60`
                  }`}
                >
                  <div className={`relative w-full h-20 rounded-lg overflow-hidden mb-2 ${theme.surfaceHighlight} flex items-center justify-center`}>
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center backdrop-blur-sm">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Out</span>
                      </div>
                    )}
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-cover ${!item.available ? 'grayscale' : ''}`} />
                    ) : (
                      <span className={`text-3xl ${!item.available ? 'grayscale opacity-50' : ''}`}>{item.emoji || '☕'}</span>
                    )}
                    <button onClick={() => deleteMenuItem(item.id)} className={`absolute top-1 right-1 p-1 bg-red-500 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors ${theme.shadowMd}`}>
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={() => openEditModal(item)} className={`absolute top-1 left-1 p-1 ${theme.primary} backdrop-blur-md rounded-full text-white ${theme.primaryHover} transition-colors ${theme.shadowMd}`}>
                      <Edit className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`text-xs font-bold ${item.available ? theme.textMain : theme.textSecondary} truncate flex-1 mr-1`}>{item.name}</h3>
                    {item.price > 0 ? (
                      <span className={`font-bold text-xs ${item.available ? 'text-green-600' : theme.textSecondary}`}>${item.price.toFixed(2)}</span>
                    ) : (
                      <span className={`font-bold text-[10px] ${item.available ? 'text-blue-600' : theme.textSecondary} bg-blue-50 px-1.5 py-0.5 rounded`}>FREE</span>
                    )}
                  </div>

                  <div className={`flex items-center justify-between pt-1.5 border-t ${theme.border}`}>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${item.available ? theme.textMain : 'text-red-600'}`}>
                      {item.available ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                          In Stock
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Out
                        </>
                      )}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={item.available} onChange={() => toggleAvailability(item.id)} className="sr-only peer" />
                      <div className="relative w-8 h-4 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 shadow-md"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={openAddModal}
            className={`fixed bottom-8 right-8 ${theme.primary} ${theme.primaryHover} text-white rounded-full pl-6 pr-8 h-16 ${theme.shadowLg} ${theme.primaryShadow} transition-all hover:scale-105 flex items-center gap-3 font-bold z-50`}
          >
            <div className="bg-white/20 p-2 rounded-full"><Plus className="w-5 h-5" /></div>
            <span className="text-lg">Add New Item</span>
          </button>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className={`${theme.surfaceBg} rounded-2xl border-2 border-red-200 p-8 max-w-lg w-full ${theme.shadowLg}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${theme.textMain} flex items-center`}>
                <AlertCircle className="w-8 h-8 text-red-500 mr-3" />Cancel Order
              </h3>
              <button onClick={() => setCancelModal(null)}><X className={`w-6 h-6 ${theme.textMain}`} /></button>
            </div>
            <p className={`${theme.textSecondary} mb-2`}>Order ID: {cancelModal.id}</p>
            <p className={`${theme.textSecondary} mb-6`}>Room: {cancelModal.roomName || `#${cancelModal.roomId}`}</p>
            <label className={`${theme.textMain} font-semibold mb-2 block`}>Cancellation Reason</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="E.g., Item unavailable, customer request..."
              className={`w-full ${theme.surfaceHighlight} ${theme.textMain} rounded-xl p-4 ${theme.border} border focus:${theme.primaryBorder} focus:border-2 outline-none resize-none mb-6`}
              rows="4"
            />
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} className={`flex-1 py-3 ${theme.buttonBg} ${theme.textMain} rounded-xl font-bold ${theme.buttonHover} transition-all`}>
                Go Back
              </button>
              <button onClick={() => cancelOrder(cancelModal.id)} disabled={!cancelReason.trim()} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {(addItemModal || editItemModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className={`${theme.surfaceBg} rounded-2xl ${theme.border} border-2 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-2xl font-bold ${theme.textMain}`}>{editItemModal ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => { setAddItemModal(false); setEditItemModal(null); }}><X className={`w-6 h-6 ${theme.textMain}`} /></button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className={`${theme.textMain} font-semibold mb-2 block`}>Item Image</label>
                <div className="flex items-center gap-4">
                  <div className={`w-32 h-32 ${theme.surfaceHighlight} rounded-xl flex items-center justify-center overflow-hidden ${theme.border} border-2`}>
                    {itemForm.imageUrl ? (
                      <img src={itemForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">{itemForm.emoji}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className={`block w-full py-3 px-4 ${theme.primary} text-white rounded-xl font-bold ${theme.primaryHover} cursor-pointer text-center mb-2 ${theme.shadowMd}`}>
                      <Upload className="inline-block mr-2 w-4 h-4" />Upload Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <p className={`${theme.textSecondary} text-sm mb-2`}>Or select emoji:</p>
                    <div className={`grid grid-cols-7 gap-1 max-h-24 overflow-y-auto p-2 ${theme.surfaceHighlight} rounded-lg ${theme.border} border`}>
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setItemForm((prev) => ({ ...prev, emoji: emoji, imageUrl: null }))}
                          className={`text-3xl p-1 rounded ${theme.surfaceHover} transition-all ${
                            itemForm.emoji === emoji && !itemForm.imageUrl ? `${theme.primary} ring-2 ${theme.primaryRing}` : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`${theme.textMain} font-semibold mb-2 block text-sm`}>Item Name (English) *</label>
                  <input
                    type="text"
                    placeholder="Cappuccino"
                    value={itemForm.name}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 ${theme.surfaceHighlight} ${theme.textMain} rounded-xl ${theme.border} border focus:${theme.primaryBorder} focus:border-2 outline-none`}
                  />
                </div>
                <div>
                  <label className={`${theme.textMain} font-semibold mb-2 block text-sm`}>Arabic Name</label>
                  <input
                    type="text"
                    placeholder="كابتشينو"
                    value={itemForm.nameAr}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                    className={`w-full px-3 py-2 ${theme.surfaceHighlight} ${theme.textMain} rounded-xl ${theme.border} border focus:${theme.primaryBorder} focus:border-2 outline-none`}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={`${theme.textMain} font-semibold mb-2 block text-sm`}>Category *</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-3 py-2 ${theme.surfaceHighlight} ${theme.textMain} rounded-xl ${theme.border} border focus:${theme.primaryBorder} focus:border-2 outline-none`}
                >
                  <option value="HOT_TEA">Hot Tea</option>
                  <option value="COFFEE">Coffee</option>
                  <option value="JUICE">Juice</option>
                  <option value="SOFT_DRINK">Soft Drink</option>
                  <option value="WATER">Water</option>
                  <option value="SNACKS">Snacks</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Pricing Toggle */}
              <div className={`${theme.surfaceHighlight} rounded-xl p-4 ${theme.border} border`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className={`${theme.textMain} font-semibold text-sm block mb-1`}>Has Pricing</span>
                    <span className={`${theme.textSecondary} text-xs`}>Turn off for free items (e.g., Water)</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={itemForm.hasPricing}
                      onChange={(e) => setItemForm((prev) => ({
                        ...prev,
                        hasPricing: e.target.checked,
                        price: e.target.checked ? prev.price : '0'
                      }))}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 ${theme.buttonBg} rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${theme.shadowMd}`}></div>
                  </div>
                </label>
              </div>

              {/* Price Field */}
              {itemForm.hasPricing && (
                <div>
                  <label className={`${theme.textMain} font-semibold mb-2 block text-sm`}>Price ($) *</label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="3.50"
                    value={itemForm.price}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                    className={`w-full px-3 py-2 ${theme.surfaceHighlight} ${theme.textMain} rounded-xl ${theme.border} border focus:${theme.primaryBorder} focus:border-2 outline-none`}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className={`${theme.textMain} font-semibold mb-2 block text-sm`}>Description</label>
                <textarea
                  placeholder="Rich espresso with steamed milk foam"
                  value={itemForm.description}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 ${theme.surfaceHighlight} ${theme.textMain} rounded-xl ${theme.border} border focus:${theme.primaryBorder} focus:border-2 outline-none resize-none`}
                  rows="2"
                />
              </div>

              {/* Customization Options */}
              <div>
                <label className={`${theme.textMain} font-semibold mb-2 block text-sm`}>Customization Options</label>
                <div className={`${theme.surfaceHighlight} rounded-xl p-4 space-y-3 ${theme.border} border`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={`${theme.textMain} text-sm`}>Has Sugar Level Option</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={itemForm.hasSugar || false}
                        onChange={(e) => setItemForm((prev) => ({
                          ...prev,
                          hasSugar: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 ${theme.buttonBg} rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${theme.shadowMd}`}></div>
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={`${theme.textMain} text-sm`}>Has Ice Option</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={itemForm.hasIce || false}
                        onChange={(e) => setItemForm((prev) => ({
                          ...prev,
                          hasIce: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 ${theme.buttonBg} rounded-full peer peer-checked:bg-cyan-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${theme.shadowMd}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setAddItemModal(false); setEditItemModal(null); }}
                  className={`flex-1 py-2.5 ${theme.buttonBg} ${theme.textMain} rounded-xl font-bold ${theme.buttonHover} transition-all`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveMenuItem}
                  disabled={!itemForm.name || (itemForm.hasPricing && !itemForm.price) || loading}
                  className={`flex-1 py-2.5 ${theme.primary} text-white rounded-xl font-bold ${theme.primaryHover} transition-all disabled:opacity-50 ${theme.shadowMd}`}
                >
                  <Save className="inline-block mr-2 w-4 h-4" />
                  {loading ? 'Saving...' : editItemModal ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onComplete={handleCroppedImage}
          onCancel={handleCancelCrop}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TeaBoyDashboard;