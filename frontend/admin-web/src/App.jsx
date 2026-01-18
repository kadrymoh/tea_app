// frontend/admin-web/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import Activate from './pages/Activate';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Activation Route - Public */}
      <Route path="/tenant/admin/activate" element={<Activate />} />

      {/* Login Route */}
      <Route
        path="/tenant/admin/login"
        element={
          isAuthenticated && user ? (
            <Navigate to="/tenant/admin/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Admin Dashboard - Protected */}
      <Route
        path="/tenant/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      {/* Legacy routes redirect to new paths */}
      <Route path="/activate" element={<Navigate to="/tenant/admin/activate" replace />} />
      <Route path="/login" element={<Navigate to="/tenant/admin/login" replace />} />
      <Route path="/admin" element={<Navigate to="/tenant/admin/dashboard" replace />} />

      {/* Default redirect */}
      <Route
        path="/tenant/admin"
        element={
          isAuthenticated && user ? (
            <Navigate to="/tenant/admin/dashboard" replace />
          ) : (
            <Navigate to="/tenant/admin/login" replace />
          )
        }
      />
      <Route
        path="/tenant/admin/"
        element={
          isAuthenticated && user ? (
            <Navigate to="/tenant/admin/dashboard" replace />
          ) : (
            <Navigate to="/tenant/admin/login" replace />
          )
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to="/tenant/admin/login" replace />}
      />

      {/* 404 - Redirect to login */}
      <Route path="*" element={<Navigate to="/tenant/admin/login" replace />} />
    </Routes>
  );
}

export default App;
