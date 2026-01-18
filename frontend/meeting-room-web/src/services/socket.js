// hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

const SOCKET_URL = API_CONFIG.SOCKET_URL;

export const useSocket = (roomId, onOrderUpdate) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
      
      // Join room channel
      if (roomId) {
        socket.emit('join-room', roomId);
        console.log(`📍 Joined room: ${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Order events
    socket.on('order-created', (order) => {
      console.log('🆕 New order created:', order);
      if (onOrderUpdate) {
        onOrderUpdate('created', order);
      }
    });

    socket.on('order-status-updated', (order) => {
      console.log('🔄 Order status updated:', order);
      if (onOrderUpdate) {
        onOrderUpdate('updated', order);
      }
    });

    // Menu events
    socket.on('menu-item-updated', (item) => {
      console.log('📝 Menu item updated:', item);
    });

    socket.on('menu-item-availability-changed', (item) => {
      console.log('⚡ Menu availability changed:', item);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId, onOrderUpdate]);

  return {
    socket: socketRef.current,
    connected
  };
};