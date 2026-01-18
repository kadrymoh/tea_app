// Custom Hook for Toast Notifications
import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = null, duration = 3000) => {
    const id = toastId++;
    const toast = { id, message, type, title, duration };

    setToasts((prevToasts) => [...prevToasts, toast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, title = 'Success', duration = 3000) => {
    return addToast(message, 'success', title, duration);
  }, [addToast]);

  const error = useCallback((message, title = 'Error', duration = 5000) => {
    return addToast(message, 'error', title, duration);
  }, [addToast]);

  const warning = useCallback((message, title = 'Warning', duration = 4000) => {
    return addToast(message, 'warning', title, duration);
  }, [addToast]);

  const info = useCallback((message, title = 'Info', duration = 3000) => {
    return addToast(message, 'info', title, duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

export default useToast;
