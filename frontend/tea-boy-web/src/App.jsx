import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import TeaBoyDashboard from './pages/TeaBoyDashboard';
import Activate from './pages/Activate';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🔥 APP DEBUG:', {
    isAuthenticated,
    hasUser: !!user,
    loading,
    path: window.location.pathname
  });

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-blue-600 text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Activation Route - Public */}
      <Route path="/tenant/kitchen/activate" element={<Activate />} />

      {/* Login Route */}
      <Route
        path="/tenant/kitchen/login"
        element={
          isAuthenticated && user?.role === 'KITCHEN' ? (
            <Navigate to="/tenant/kitchen/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Dashboard Route */}
      <Route
        path="/tenant/kitchen/dashboard"
        element={
          isAuthenticated && user?.role === 'KITCHEN' ? (
            <TeaBoyDashboard />
          ) : (
            <Navigate to="/tenant/kitchen/login" replace />
          )
        }
      />

      {/* Default redirect for /tenant/kitchen */}
      <Route
        path="/tenant/kitchen"
        element={
          isAuthenticated && user?.role === 'KITCHEN' ? (
            <Navigate to="/tenant/kitchen/dashboard" replace />
          ) : (
            <Navigate to="/tenant/kitchen/login" replace />
          )
        }
      />

      {/* 404 - Redirect to kitchen login */}
      <Route path="*" element={<Navigate to="/tenant/kitchen/login" replace />} />
    </Routes>
  );
}

export default App;
