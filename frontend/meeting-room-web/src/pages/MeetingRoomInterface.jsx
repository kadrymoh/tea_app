import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_CONFIG, getApiUrl } from '../config/api.config';
import {
  CoffeeIcon,
  PlusIcon,
  MinusIcon,
  SendIcon,
  ClockIcon,
  CheckCircleIcon,
  SettingsIcon,
  PackageIcon,
  AlertCircleIcon,
  ShoppingCartIcon,
  TrashIcon
} from '../components/Icons';

const MeetingRoomInterface = ({ roomToken, roomInfo }) => {
  const API_BASE_URL = API_CONFIG.BASE_URL;

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState({});
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [tempCustomization, setTempCustomization] = useState({
    quantity: 1,
    sugar: 2,
    ice: 1, // Ice level: 0=no ice, 1=light, 2=medium, 3=extra
    notes: ''
  });

  const [menuItems, setMenuItems] = useState([]);

  // ============================================
  // TRANSLATIONS
  // ============================================
  const translations = {
    en: {
      refreshments: 'Refreshments',
      selectDrink: 'Select a drink to customize your order',
      allItems: 'All Items',
      hotTea: 'Hot Tea',
      coffee: 'Coffee',
      juice: 'Juice',
      water: 'Water',
      softDrink: 'Soft Drink',
      snacks: 'Snacks',
      orderStatus: 'Order History',
      pending: 'Order Received',
      accepted: 'Accepted',
      preparing: 'Being Prepared',
      ready: 'Ready for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      items: 'items',
      quantity: 'Quantity',
      sugar: 'Sugar Level',
      ice: 'Ice Level',
      iceNone: 'No Ice',
      iceLow: 'Light',
      iceMedium: 'Medium',
      iceHigh: 'Extra',
      none: 'None',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      extraHigh: 'Extra',
      notes: 'Special Notes',
      notesPlaceholder: 'Extra hot, no foam...',
      addToOrder: 'Add to Order',
      noItems: 'No items in order',
      yourOrder: 'Your Order',
      sendOrder: 'Send Order',
      note: 'Note',
      language: 'Language',
      english: 'English',
      arabic: 'Arabic',
      floor: 'Floor',
      est: 'Est.',
      min: 'min',
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      orderSent: 'Order sent successfully!',
      orderFailed: 'Failed to send order',
      customizeOrder: 'Customize Order',
      cups: 'Cups',
      totalItems: 'Total',
      specialRequests: 'Special Requests'
    },
    ar: {
      refreshments: 'المشروبات',
      selectDrink: 'اختر مشروباً لتخصيص طلبك',
      allItems: 'جميع المنتجات',
      hotTea: 'شاي ساخن',
      coffee: 'قهوة',
      juice: 'عصير',
      water: 'ماء',
      softDrink: 'مشروبات غازية',
      snacks: 'وجبات خفيفة',
      orderStatus: 'سجل الطلبات',
      pending: 'تم استلام الطلب',
      accepted: 'تم القبول',
      preparing: 'قيد التحضير',
      ready: 'جاهز للتوصيل',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
      items: 'منتجات',
      quantity: 'الكمية',
      sugar: 'مستوى السكر',
      ice: 'مستوى الثلج',
      iceNone: 'بدون',
      iceLow: 'خفيف',
      iceMedium: 'متوسط',
      iceHigh: 'إضافي',
      none: 'بدون',
      low: 'قليل',
      medium: 'متوسط',
      high: 'كثير',
      extraHigh: 'إضافي',
      notes: 'ملاحظات خاصة',
      notesPlaceholder: 'ساخن جداً، بدون رغوة...',
      addToOrder: 'أضف للطلب',
      noItems: 'لا توجد منتجات في الطلب',
      yourOrder: 'طلبك',
      sendOrder: 'إرسال الطلب',
      note: 'ملاحظة',
      language: 'اللغة',
      english: 'الإنجليزية',
      arabic: 'العربية',
      floor: 'الطابق',
      est: 'تقريباً',
      min: 'دقيقة',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      retry: 'إعادة المحاولة',
      orderSent: 'تم إرسال الطلب بنجاح!',
      orderFailed: 'فشل إرسال الطلب',
      customizeOrder: 'تخصيص الطلب',
      cups: 'أكواب',
      totalItems: 'المجموع',
      specialRequests: 'طلبات خاصة'
    }
  };

  const t = translations[language];

  // Light theme colors (fixed, no dark mode)
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
    headerBg: 'bg-gradient-to-r from-[#0a12f7] via-[#0086C4] to-[#0a12f7]',
    footerBg: 'bg-white/90',
    
    // Text
    textMain: 'text-slate-900',
    textSecondary: 'text-slate-500',
    textTertiary: 'text-slate-700',
    
    // Borders
    border: 'border-slate-200',
    borderHover: 'hover:border-slate-200',
    
    // Interactive elements
    buttonBg: 'bg-slate-100',
    buttonHover: 'hover:bg-slate-200',
    buttonText: 'text-slate-700',
    
    // Shadows
    shadow: 'shadow-slate-200/50',
    shadowMd: 'shadow-md',
    shadowLg: 'shadow-lg',
    
    // Icons
    iconColor: 'text-slate-700'
  };

  // ============================================
  // CATEGORY MAPPING
  // ============================================
  const categoryMap = {
    'HOT_TEA': 'Hot Tea',
    'COFFEE': 'Coffee',
    'JUICE': 'Juice',
    'WATER': 'Water',
    'SOFT_DRINK': 'Soft Drink',
    'SNACKS': 'Snacks',
    'OTHER': 'Other'
  };

  const categories = [
    { id: 'all', name: t.allItems },
    { id: 'Hot Tea', name: t.hotTea },
    { id: 'Coffee', name: t.coffee },
    { id: 'Juice', name: t.juice },
    { id: 'Water', name: t.water }
  ];

  // ============================================
  // API FUNCTIONS
  // ============================================

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${roomToken}`,
    'Content-Type': 'application/json'
  });

  const loadMenu = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/room/menu`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        const transformedItems = data.data.map(item => ({
          id: item.id,
          name: item.nameAr ? { en: item.name, ar: item.nameAr } : item.name,
          category: categoryMap[item.category] || 'Other',
          price: item.price,
          icon: item.emoji || '☕',
          imageUrl: item.imageUrl || null,
          description: item.description || '',
          available: item.available,
          prepTime: '5',
          isIceOnly: item.isIceOnly || false, // NEW: ice-only products
          hasSugar: item.hasSugar !== undefined ? item.hasSugar : true, // Use hasSugar from API
          hasIce: ['JUICE', 'SOFT_DRINK'].includes(item.category) || item.isIceOnly
        }));

        setMenuItems(transformedItems);
        setError(null);
      } else {
        setError(data.message || t.error);
        if (data.error === 'Invalid token') {
          // Token is invalid, show error
          setError('Access token is invalid. Please use a valid room link.');
        }
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/room/orders?date=today`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        setOrderHistory(data.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const sendOrder = async () => {
    if (Object.keys(cart).length === 0) return;

    try {
      setLoading(true);

      const items = Object.values(cart).map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        sugar: item.sugar !== null ? ['NONE', 'LOW', 'NORMAL', 'HIGH'][item.sugar] : 'NORMAL',
        ice: item.ice || false,
        notes: item.notes || ''
      }));

      const orderData = {
        items: items,
        notes: ''
      };

      const response = await fetch(`${API_BASE_URL}/room/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        setCart({});
        setShowOrderStatus(true);
        await loadOrders();
        setError(null);
      } else {
        setError(data.error || t.orderFailed);
      }
    } catch (err) {
      console.error('Failed to send order:', err);
      setError(t.orderFailed);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const init = async () => {
      await loadMenu();
      await loadOrders();
    };
    init();

    // 🔌 Setup Socket.IO connection for real-time updates
    const socket = io(API_CONFIG.SOCKET_URL);

    // Join room channel
    if (roomInfo?.id) {
      socket.emit('join-room', roomInfo.id);
      console.log('🔌 Connected to Socket.IO and joined room:', roomInfo.id);
    }

    // Listen for order updates
    socket.on('order-update', (order) => {
      console.log('🔔 Received order update:', order);
      loadOrders(); // Reload orders when update received
    });

    // Listen for menu updates (real-time sync)
    socket.on('menu-update', (data) => {
      console.log('🍽️ Received menu update:', data);
      loadMenu(); // Reload menu when update received
    });

    // Listen for menu item availability changes
    socket.on('menu-item-update', (item) => {
      console.log('🍽️ Received menu item update:', item);
      loadMenu(); // Reload menu when item availability changes
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log('🔌 Socket.IO disconnected');
    };
  }, [roomInfo?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleItemClick = (item) => {
    if (!item.available) return;
    
    setSelectedItem(item);
    setTempCustomization({ 
      quantity: 1, 
      sugar: item.hasSugar ? 2 : null, 
      ice: item.hasIce ? false : null,
      notes: '' 
    });
  };

  const closeCustomizationModal = () => {
    setSelectedItem(null);
    setTempCustomization({ quantity: 1, sugar: 2, ice: false, notes: '' });
  };

  const addToCart = () => {
    if (!selectedItem) return;
    
    const cartKey = `${selectedItem.id}_${Date.now()}`;
    setCart(prev => ({
      ...prev,
      [cartKey]: {
        ...selectedItem,
        cartKey,
        ...tempCustomization
      }
    }));
    
    closeCustomizationModal();
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[cartKey];
      return newCart;
    });
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'pending',
      'ACCEPTED': 'accepted',
      'PREPARING': 'preparing',
      'READY': 'ready',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled'
    };
    const key = statusMap[status] || status.toLowerCase();
    return t[key] || status;
  };

  const getSugarText = (level) => {
    const labels = ['none', 'low', 'medium', 'high', 'extraHigh'];
    return t[labels[level]] || t.medium;
  };

  const getIceText = (level) => {
    const labels = ['iceNone', 'iceLow', 'iceMedium', 'iceHigh'];
    return t[labels[level]] || t.iceMedium;
  };

  // Format date as dd/mm/yy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  // Format time as HH:MM
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format full date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={`h-screen flex flex-col ${theme.mainBg} overflow-hidden`} 
         style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* Custom Scrollbar Styles */}
      <style>{`
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
      `}</style>

      {/* Header */}
      <header className={`flex items-center justify-between px-8 py-5 ${theme.border} border-b ${theme.headerBg} backdrop-blur-sm sticky top-0 z-20`} style={{ direction: 'ltr' }}>
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white`}>
            <CoffeeIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold leading-tight">
              {roomInfo?.name || 'Meeting Room'}
            </h2>
            <p className="text-white/80 text-sm font-medium">
              {currentTime.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US',
                { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Center Title */}
        <div className="text-center flex-1 px-8">
          <h1 className="text-white tracking-tight text-2xl font-bold">
            {t.refreshments}
          </h1>
          <p className="text-white/80 text-sm">{t.selectDrink}</p>
        </div>

        <div className="flex items-center gap-3" style={{ direction: 'ltr', paddingRight: '60px' , paddingTop: "5px"}}>
          {/* Hidden Button Spacer - always on the right for close button space */}
          <div style={{ marginLeft: "10px", width: '100px', height: '48px', visibility: 'hidden' }}></div>

          {/* Cart Icon Button */}
          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(!showCart)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 text-white transition-colors`}
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {cartCount}
              </span>
            </button>
          )}

          {orderHistory.length > 0 && (
            <button
              onClick={() => setShowOrderStatus(!showOrderStatus)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText} transition-colors`}
            >
              <PackageIcon className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {orderHistory.filter(o => o.status !== 'DELIVERED').length || orderHistory.length}
              </span>
            </button>
          )}

          {/* Language Toggle Button */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`flex items-center justify-center px-4 h-12 rounded-full ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText} transition-colors font-semibold`}
          >
            {language === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mx-8 mt-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircleIcon className="w-6 h-6 text-red-500" />
            <span className={`${theme.textMain} font-semibold`}>{error}</span>
          </div>
          <button
            onClick={loadMenu}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all"
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && cartCount > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${theme.surfaceBg} rounded-2xl ${theme.border} border p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${theme.shadowLg} animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShoppingCartIcon className={`w-6 h-6 ${theme.primaryText}`} />
                <h3 className={`text-2xl font-bold ${theme.textMain}`}>
                  {language === 'ar' ? 'سلة الطلبات' : 'Your Cart'}
                </h3>
                <span className={`px-3 py-1 rounded-full ${theme.primaryBg} ${theme.primaryText} text-sm font-bold`}>
                  {cartCount} {language === 'ar' ? 'عنصر' : 'items'}
                </span>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${theme.buttonBg} ${theme.buttonHover} ${theme.textMain} text-2xl font-bold transition-colors`}
              >
                ×
              </button>
            </div>

            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {Object.values(cart).map(item => (
                <div
                  key={item.cartKey}
                  className={`${theme.surfaceHighlight} rounded-xl p-4 ${theme.border} border`}
                >
                  <div className="flex items-start gap-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={typeof item.name === 'object' ? item.name[language] : item.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-xl ${theme.surfaceBg} flex items-center justify-center`}>
                        <span className="text-4xl">{item.icon}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`${theme.textMain} font-bold text-lg`}>
                            {typeof item.name === 'object' ? item.name[language] : item.name}
                          </h4>
                          <p className={`${theme.textSecondary} text-sm mt-1`}>
                            {language === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartKey)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item details */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.sugar !== null && (
                          <span className={`px-2 py-1 rounded-lg ${theme.surfaceBg} text-xs ${theme.textSecondary}`}>
                            {language === 'ar' ? 'السكر:' : 'Sugar:'} {getSugarText(item.sugar)}
                          </span>
                        )}
                        {item.ice !== null && (
                          <span className={`px-2 py-1 rounded-lg ${theme.surfaceBg} text-xs text-cyan-500`}>
                            ❄️ {getIceText(item.ice)}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className={`${theme.textSecondary} text-xs mt-2 italic`}>
                          {language === 'ar' ? 'ملاحظات:' : 'Notes:'} {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Send Order Button */}
            <button
              onClick={() => {
                sendOrder();
                setShowCart(false);
              }}
              disabled={loading}
              className={`w-full py-4 ${theme.primary} ${theme.primaryHover} text-white text-lg font-bold rounded-xl flex items-center justify-center gap-3 transition-colors ${theme.shadowLg} ${theme.primaryShadow} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>{loading ? t.loading : t.sendOrder}</span>
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Order Status Modal Overlay */}
      {showOrderStatus && orderHistory.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${theme.surfaceBg} rounded-2xl ${theme.border} border p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${theme.shadowLg} animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${theme.textMain}`}>{t.orderStatus}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                >
                  {language === 'ar' ? 'مسح السجل' : 'Clear History'}
                </button>
                <button
                  onClick={() => setShowOrderStatus(false)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${theme.buttonBg} ${theme.buttonHover} ${theme.textMain} text-2xl font-bold transition-colors`}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {orderHistory.map((order, index) => (
                <div key={order.id} className={`${theme.surfaceHighlight} rounded-xl p-5 border-2 ${
                  index === 0 ? `${theme.primaryBorder}` : `${theme.border}`
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      order.status === 'PENDING' ? 'bg-yellow-100' :
                      order.status === 'PREPARING' ? 'bg-blue-100' :
                      order.status === 'READY' ? 'bg-green-100' :
                      'bg-slate-100'
                    }`}>
                      <ClockIcon className={`w-7 h-7 ${
                        order.status === 'PENDING' ? 'text-yellow-500' :
                        order.status === 'PREPARING' ? 'text-blue-500' :
                        order.status === 'READY' ? 'text-green-500' :
                        'text-slate-500'
                      }`} />
                    </div>

                    <div className="flex-1">
                      <p className={`${theme.textMain} font-bold text-xl mb-1`}>
                        {getStatusText(order.status)}
                      </p>
                      <p className={`${theme.textSecondary} text-sm`}>
                        {formatDate(order.timestamp || order.createdAt)} {formatTime(order.timestamp || order.createdAt)}
                      </p>
                      {/* Show prepared time if status is PREPARING or beyond */}
                      {order.preparedAt && (
                        <p className={`text-blue-500 text-xs mt-1`}>
                          {language === 'ar' ? 'وقت التحضير:' : 'Prepared:'} {formatTime(order.preparedAt)}
                        </p>
                      )}
                      {/* Show delivered time if status is DELIVERED */}
                      {order.deliveredAt && (
                        <p className={`text-green-500 text-xs mt-1`}>
                          {language === 'ar' ? 'وقت التسليم:' : 'Delivered:'} {formatTime(order.deliveredAt)}
                        </p>
                      )}
                      {order.items && order.items.length > 0 && (
                        <p className={`${theme.textSecondary} text-xs mt-1`}>
                          {order.items.length} {language === 'ar' ? 'عنصر' : 'item(s)'}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className={`px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors`}
                    >
                      {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${theme.surfaceBg} rounded-2xl ${theme.border} border p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${theme.shadowLg} animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${theme.textMain}`}>
                {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${theme.buttonBg} ${theme.buttonHover} ${theme.textMain} text-2xl font-bold transition-colors`}
              >
                ×
              </button>
            </div>

            {/* Order Status */}
            <div className={`${theme.surfaceHighlight} rounded-xl p-4 mb-6 border ${theme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${theme.textSecondary} text-sm mb-1`}>
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </p>
                  <p className={`${theme.textMain} font-bold text-xl`}>
                    {getStatusText(selectedOrder.status)}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedOrder.status === 'PENDING' ? 'bg-yellow-100' :
                  selectedOrder.status === 'PREPARING' ? 'bg-blue-100' :
                  selectedOrder.status === 'READY' ? 'bg-green-100' :
                  'bg-slate-100'
                }`}>
                  <ClockIcon className={`w-8 h-8 ${
                    selectedOrder.status === 'PENDING' ? 'text-yellow-500' :
                    selectedOrder.status === 'PREPARING' ? 'text-blue-500' :
                    selectedOrder.status === 'READY' ? 'text-green-500' :
                    'text-slate-500'
                  }`} />
                </div>
              </div>

              {/* Timestamps Section */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`${theme.textSecondary} text-sm`}>
                    {language === 'ar' ? 'وقت الطلب:' : 'Order Time:'}
                  </span>
                  <span className={`${theme.textMain} text-sm font-medium`}>
                    {formatDateTime(selectedOrder.timestamp || selectedOrder.createdAt)}
                  </span>
                </div>
                {selectedOrder.preparedAt && (
                  <div className="flex items-center justify-between">
                    <span className={`text-blue-500 text-sm`}>
                      {language === 'ar' ? 'وقت التحضير:' : 'Prepared Time:'}
                    </span>
                    <span className={`text-blue-600 text-sm font-medium`}>
                      {formatDateTime(selectedOrder.preparedAt)}
                    </span>
                  </div>
                )}
                {selectedOrder.deliveredAt && (
                  <div className="flex items-center justify-between">
                    <span className={`text-green-500 text-sm`}>
                      {language === 'ar' ? 'وقت التسليم:' : 'Delivered Time:'}
                    </span>
                    <span className={`text-green-600 text-sm font-medium`}>
                      {formatDateTime(selectedOrder.deliveredAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Cancel Reason Section */}
              {selectedOrder.status === 'CANCELLED' && selectedOrder.cancelReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-600 text-sm font-semibold mb-1">
                    {language === 'ar' ? 'سبب الإلغاء:' : 'Cancel Reason:'}
                  </p>
                  <p className="text-red-700 text-sm">
                    {selectedOrder.cancelReason}
                  </p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h4 className={`${theme.textMain} font-bold text-lg mb-3`}>
                {language === 'ar' ? 'العناصر' : 'Items'}
              </h4>
              <div className="space-y-3">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className={`${theme.surfaceHighlight} rounded-lg p-4 border ${theme.border}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg ${theme.surfaceBg} flex items-center justify-center`}>
                            <span className="text-2xl">{item.menuItem?.emoji || '☕'}</span>
                          </div>
                          <div>
                            <p className={`${theme.textMain} font-semibold`}>
                              {item.menuItem?.name || item.name}
                            </p>
                            <p className={`${theme.textSecondary} text-sm mt-1`}>
                              {language === 'ar' ? 'الكمية' : 'Quantity'}: {item.quantity || 1}
                            </p>
                            {item.sugar !== undefined && item.sugar !== null && (
                              <p className={`${theme.textSecondary} text-xs mt-1`}>
                                {language === 'ar' ? 'السكر' : 'Sugar'}: {
                                  item.sugar === 0 ? (language === 'ar' ? 'بدون' : 'None') :
                                  item.sugar === 1 ? (language === 'ar' ? 'خفيف' : 'Light') :
                                  item.sugar === 2 ? (language === 'ar' ? 'متوسط' : 'Medium') :
                                  item.sugar === 3 ? (language === 'ar' ? 'حلو' : 'Sweet') :
                                  (language === 'ar' ? 'حلو جداً' : 'Extra Sweet')
                                }
                              </p>
                            )}
                            {item.ice !== undefined && item.ice !== null && (
                              <p className={`${theme.textSecondary} text-xs mt-1`}>
                                {language === 'ar' ? 'الثلج' : 'Ice'}: {
                                  item.ice === 0 ? (language === 'ar' ? 'بدون' : 'None') :
                                  item.ice === 1 ? (language === 'ar' ? 'خفيف' : 'Light') :
                                  item.ice === 2 ? (language === 'ar' ? 'متوسط' : 'Medium') :
                                  (language === 'ar' ? 'كثير' : 'Extra')
                                }
                              </p>
                            )}
                            {item.notes && (
                              <p className={`${theme.textSecondary} text-xs mt-1 italic`}>
                                {language === 'ar' ? 'ملاحظات' : 'Notes'}: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`${theme.textSecondary} text-center py-4`}>
                    {language === 'ar' ? 'لا توجد عناصر' : 'No items'}
                  </p>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div className={`${theme.surfaceHighlight} rounded-lg p-4 mt-4 border ${theme.border}`}>
                <p className={`${theme.textSecondary} text-sm mb-1`}>
                  {language === 'ar' ? 'ملاحظات الطلب' : 'Order Notes'}
                </p>
                <p className={`${theme.textMain}`}>{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${theme.surfaceBg} rounded-2xl ${theme.border} border max-w-2xl w-full max-h-[85vh] overflow-y-auto ${theme.shadowLg} animate-in fade-in slide-in-from-bottom-4`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 pb-4 border-b ${theme.border} sticky top-0 ${theme.surfaceBg} z-10`}>
              <div className="flex items-center gap-4">
                {/* Item Image/Icon */}
                {selectedItem.imageUrl ? (
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-md">
                    <img
                      src={selectedItem.imageUrl}
                      alt={typeof selectedItem.name === 'object' ? selectedItem.name[language] : selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full ${theme.surfaceHighlight} flex items-center justify-center shadow-md`}>
                    <span className="text-4xl">{selectedItem.icon}</span>
                  </div>
                )}
                
                <div>
                  <h3 className={`text-xl font-bold ${theme.textMain}`}>
                    {typeof selectedItem.name === 'object' ? selectedItem.name[language] : selectedItem.name}
                  </h3>
                  <p className={`${theme.textSecondary} text-sm flex items-center gap-2`}>
                    <SettingsIcon className="w-4 h-4" />
                    {t.customizeOrder}
                  </p>
                </div>
              </div>
              
              <button
                onClick={closeCustomizationModal}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${theme.buttonBg} ${theme.buttonHover} ${theme.textMain} text-2xl font-bold transition-colors`}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-6">
                  {/* Quantity */}
                  <div className={`flex items-center justify-between ${theme.surfaceHighlight} p-4 rounded-xl border border-transparent`}>
                    <div className="flex flex-col">
                      <span className={`${theme.textMain} font-medium`}>{t.quantity}</span>
                      <span className={`${theme.textSecondary} text-sm`}>{t.cups}</span>
                    </div>
                    <div className={`flex items-center gap-4 ${theme.surfaceBg} rounded-full p-1.5 shadow-sm ring-1 ${theme.border.replace('border-', 'ring-')}`}>
                      <button
                        onClick={() => setTempCustomization(prev => ({ 
                          ...prev, 
                          quantity: Math.max(1, prev.quantity - 1) 
                        }))}
                        className={`w-10 h-10 flex items-center justify-center rounded-full ${theme.surfaceHighlight} ${theme.buttonHover} ${theme.textMain} transition-colors`}
                      >
                        <MinusIcon className="w-5 h-5" />
                      </button>
                      <span className={`w-8 text-center text-xl font-bold ${theme.textMain}`}>
                        {tempCustomization.quantity}
                      </span>
                      <button
                        onClick={() => setTempCustomization(prev => ({ 
                          ...prev, 
                          quantity: prev.quantity + 1 
                        }))}
                        className={`w-10 h-10 flex items-center justify-center rounded-full ${theme.primary} text-white ${theme.primaryHover} transition-colors ${theme.shadowLg} ${theme.primaryShadow}`}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Sugar Level */}
                  {selectedItem.hasSugar && (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between">
                        <span className={`${theme.textMain} font-medium`}>{t.sugar}</span>
                        <span className={`${theme.primaryText} text-sm font-medium`}>
                          {getSugarText(tempCustomization.sugar)}
                        </span>
                      </div>
                      <div className={`grid grid-cols-4 gap-2 ${theme.surfaceHighlight} p-1.5 rounded-xl border border-transparent`}>
                        {[0, 1, 2, 3].map(level => (
                          <button
                            key={level}
                            onClick={() => setTempCustomization(prev => ({ ...prev, sugar: level }))}
                            className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                              tempCustomization.sugar === level
                                ? `${theme.surfaceBg} ${theme.primaryText} shadow-sm ring-1 ${theme.border.replace('border-', 'ring-')} font-bold`
                                : `${theme.textSecondary} hover:${theme.textMain} ${theme.surfaceHover.replace('hover:', '')} hover:shadow-sm`
                            }`}
                          >
                            {getSugarText(level)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ice Level */}
                  {selectedItem.hasIce && (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between">
                        <span className={`${theme.textMain} font-medium`}>{t.ice}</span>
                        <span className={`${theme.primaryText} text-sm font-medium`}>
                          {getIceText(tempCustomization.ice)}
                        </span>
                      </div>
                      <div className={`grid grid-cols-4 gap-2 ${theme.surfaceHighlight} p-1.5 rounded-xl border border-transparent`}>
                        {[0, 1, 2, 3].map(level => (
                          <button
                            key={level}
                            onClick={() => setTempCustomization(prev => ({ ...prev, ice: level }))}
                            className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                              tempCustomization.ice === level
                                ? `${theme.surfaceBg} ${theme.primaryText} shadow-sm ring-1 ${theme.border.replace('border-', 'ring-')} font-bold`
                                : `${theme.textSecondary} hover:${theme.textMain} ${theme.surfaceHover.replace('hover:', '')} hover:shadow-sm`
                            }`}
                          >
                            {getIceText(level)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Special Notes */}
                <div className="flex flex-col gap-3 h-full">
                  <label className={`${theme.textMain} font-medium`}>{t.specialRequests}</label>
                  <textarea
                    value={tempCustomization.notes}
                    onChange={(e) => setTempCustomization(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder={t.notesPlaceholder}
                    className={`flex-1 w-full ${theme.surfaceHighlight} rounded-xl border border-transparent p-4 ${theme.textMain} placeholder:${theme.textSecondary}/50 focus:ring-2 ${theme.primaryRing.replace('ring-', 'focus:ring-')} focus:${theme.surfaceBg} focus:border-transparent resize-none min-h-[160px] outline-none transition-all`}
                  />
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                className={`w-full py-4 mt-6 ${theme.primary} ${theme.primaryHover} text-white rounded-xl font-bold transition-all ${theme.shadowLg} ${theme.primaryShadow} flex items-center justify-center gap-2`}
              >
                <PlusIcon className="w-5 h-5" />
                {t.addToOrder}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto pb-32 ${theme.mainBg}`}>
        <div className="max-w-5xl mx-auto px-6 py-6">

          {/* Menu Items Grid - Compact */}
          {loading && menuItems.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className={`${theme.textMain} text-xl`}>{t.loading}</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {filteredItems.map(item => {
                const isInCart = Object.values(cart).some(cartItem => cartItem.id === item.id);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    disabled={!item.available}
                    className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                      item.available
                        ? `${theme.surfaceBg} ${theme.surfaceHover} border-2 border-transparent ${theme.borderHover} ${theme.shadowMd}`
                        : `${theme.surfaceBg} opacity-40 cursor-not-allowed border-2 ${theme.border}`
                    }`}
                  >
                    {!item.available && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                        OUT
                      </div>
                    )}
                    
                    {isInCart && (
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${theme.primary} flex items-center justify-center shadow-sm`}>
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {item.imageUrl ? (
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                        <img
                          src={item.imageUrl}
                          alt={typeof item.name === 'object' ? item.name[language] : item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-full ${theme.surfaceHighlight} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <span className="text-3xl">{item.icon}</span>
                      </div>
                    )}

                    <span className={`text-sm font-semibold ${theme.textMain} text-center line-clamp-2`}>
                      {typeof item.name === 'object' ? item.name[language] : item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`absolute bottom-0 left-0 right-0 ${theme.footerBg} backdrop-blur-md border-t ${theme.border} p-6 z-10`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
          <div className="flex-1">
            {Object.keys(cart).length === 0 ? (
              <span className={theme.textSecondary}>{t.noItems}</span>
            ) : (
              <div className={`flex items-center gap-3 ${theme.textMain}`}>
                <PackageIcon className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-bold">{t.totalItems}: {cartCount} {t.items}</span>
                  <span className={`${theme.textSecondary} text-sm`}>
                    {Object.values(cart)[0] && (typeof Object.values(cart)[0].name === 'object'
                      ? Object.values(cart)[0].name[language]
                      : Object.values(cart)[0].name)}
                    {Object.keys(cart).length > 1 && ` +${Object.keys(cart).length - 1}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {Object.keys(cart).length > 0 && (
            <button
              onClick={sendOrder}
              disabled={loading}
              className={`flex-1 md:flex-none md:w-80 h-14 ${theme.primary} ${theme.primaryHover} text-white text-lg font-bold rounded-full flex items-center justify-center gap-3 transition-colors ${theme.shadowLg} ${theme.primaryShadow} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>{loading ? t.loading : t.sendOrder}</span>
              <SendIcon className="w-5 h-5" />
            </button>
          )}
        </div>

      </footer>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className={`${theme.surfaceBg} rounded-2xl ${theme.border} border p-6 max-w-md w-full ${theme.shadowLg} animate-in fade-in slide-in-from-bottom-4`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-500" />
              </div>
              <h3 className={`text-xl font-bold ${theme.textMain} mb-2`}>
                {language === 'ar' ? 'مسح السجل' : 'Clear History'}
              </h3>
              <p className={`${theme.textSecondary} mb-6`}>
                {language === 'ar'
                  ? 'هل أنت متأكد من إخفاء جميع الطلبات المكتملة والملغية من هذه الشاشة؟'
                  : 'Are you sure you want to hide all delivered and cancelled orders from this screen?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className={`flex-1 px-4 py-3 rounded-xl ${theme.buttonBg} ${theme.buttonHover} ${theme.textMain} font-medium transition-colors`}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    // Clear history locally only (don't delete from database)
                    // Filter out delivered and cancelled orders from the UI
                    setOrderHistory(prev => prev.filter(order =>
                      order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
                    ));
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  {language === 'ar' ? 'نعم، إخفاء' : 'Yes, Hide'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoomInterface;