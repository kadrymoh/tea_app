// hooks/useAdminData.js
import { useEffect, useState, useCallback } from "react";

const API_BASE_URL = 'http://localhost:4000/api';

export function useAdminData() {
  const [rooms, setRooms] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [users, setUsers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Get authentication token from localStorage
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch all data in parallel
      const [roomsRes, kitchensRes, usersRes, menuRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/rooms`, { headers }),
        fetch(`${API_BASE_URL}/kitchens`, { headers }),
        fetch(`${API_BASE_URL}/users?role=tea_boy`, { headers }),
        fetch(`${API_BASE_URL}/menu`, { headers }),
        fetch(`${API_BASE_URL}/orders`, { headers })
      ]);

      // Check for authentication errors
      if (roomsRes.status === 401 || kitchensRes.status === 401 ||
          usersRes.status === 401 || menuRes.status === 401 || ordersRes.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        throw new Error('Session expired. Please login again.');
      }

      // Parse responses
      const roomsData = await roomsRes.json();
      const kitchensData = await kitchensRes.json();
      const usersData = await usersRes.json();
      const menuData = await menuRes.json();
      const ordersData = await ordersRes.json();

      // Update state
      setRooms(roomsData?.data || []);
      setKitchens(kitchensData?.data || []);
      setUsers(usersData?.data || []);
      setMenuItems(menuData?.data || []);
      setOrders(ordersData?.data || []);

    } catch (e) {
      console.error("Failed to load admin data:", e);
      setError(e.message || "Failed to load data from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Auto-refresh orders every 10 seconds
    const interval = setInterval(() => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!token) {
        console.warn('No token available for auto-refresh');
        return;
      }

      fetch(`${API_BASE_URL}/orders`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrders(data.data || []);
          }
        })
        .catch(err => console.error("Failed to refresh orders:", err));
    }, 10000);

    return () => clearInterval(interval);
  }, [load]);

  return {
    rooms,
    kitchens,
    users,
    menuItems,
    orders,
    loading,
    error,
    reload: load,
    setRooms,
    setKitchens,
    setUsers
  };
}