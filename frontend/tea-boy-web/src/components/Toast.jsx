// Custom Toast Notification Component for Tea Boy App
import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose, title }) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Swipe handling state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const toastRef = useRef(null);

  // Minimum swipe distance to trigger dismiss (in pixels)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  // Touch handlers for swipe-to-dismiss
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    // Calculate offset for visual feedback
    const offset = currentTouch - touchStart;
    setSwipeOffset(offset);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }

    const distance = touchEnd - touchStart;
    const isSwipeRight = distance > minSwipeDistance;
    const isSwipeLeft = distance < -minSwipeDistance;

    if (isSwipeRight || isSwipeLeft) {
      // Trigger dismiss animation
      setIsDismissing(true);
      setSwipeOffset(isSwipeRight ? 400 : -400);

      // Close after animation
      setTimeout(() => {
        onCloseRef.current();
      }, 200);
    } else {
      // Reset position if swipe wasn't far enough
      setSwipeOffset(0);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse handlers for desktop swipe support
  const [mouseStart, setMouseStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = (e) => {
    setMouseStart(e.clientX);
    setIsDragging(true);
  };

  const onMouseMove = (e) => {
    if (!isDragging || !mouseStart) return;
    const offset = e.clientX - mouseStart;
    setSwipeOffset(offset);
  };

  const onMouseUp = () => {
    if (!isDragging) return;

    const isSwipeRight = swipeOffset > minSwipeDistance;
    const isSwipeLeft = swipeOffset < -minSwipeDistance;

    if (isSwipeRight || isSwipeLeft) {
      setIsDismissing(true);
      setSwipeOffset(isSwipeRight ? 400 : -400);
      setTimeout(() => {
        onCloseRef.current();
      }, 200);
    } else {
      setSwipeOffset(0);
    }

    setMouseStart(null);
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    if (isDragging) {
      setSwipeOffset(0);
      setMouseStart(null);
      setIsDragging(false);
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-500',
          text: 'text-green-800',
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          defaultTitle: 'Success'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-500',
          text: 'text-red-800',
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          defaultTitle: 'Error'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-500',
          text: 'text-yellow-800',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
          defaultTitle: 'Warning'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-500',
          text: 'text-blue-800',
          icon: <Info className="w-6 h-6 text-blue-500" />,
          defaultTitle: 'Info'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      ref={toastRef}
      className={`${styles.bg} border-l-4 ${styles.text} p-4 rounded-lg shadow-lg max-w-md w-full animate-slide-in cursor-grab active:cursor-grabbing select-none`}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        opacity: isDismissing ? 0 : Math.max(0.3, 1 - Math.abs(swipeOffset) / 200),
        transition: isDragging || touchStart ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-semibold mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm whitespace-pre-line">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Swipe hint indicator */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
        <div className="w-8 h-1 bg-gray-300 rounded-full opacity-50"></div>
      </div>
    </div>
  );
};

// Toast Container Component - positioned below navbar
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          title={toast.title}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
