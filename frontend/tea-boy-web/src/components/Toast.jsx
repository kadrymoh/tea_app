// Custom Toast Notification Component for Tea Boy App
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose, title }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

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
    <div className={`${styles.bg} border-l-4 ${styles.text} p-4 rounded-lg shadow-lg max-w-md w-full animate-slide-in`}>
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
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
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
