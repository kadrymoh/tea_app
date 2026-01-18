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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Activation Route - Public */}
      <Route path="/tenant/tea-boy/activate" element={<Activate />} />

      {/* Login Route */}
      <Route
        path="/tenant/tea-boy/login"
        element={
          isAuthenticated && user?.role === 'TEA_BOY' ? (
            <Navigate to="/tenant/tea-boy/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Dashboard Route */}
      <Route
        path="/tenant/tea-boy/dashboard"
        element={
          isAuthenticated && user?.role === 'TEA_BOY' ? (
            <TeaBoyDashboard />
          ) : (
            <Navigate to="/tenant/tea-boy/login" replace />
          )
        }
      />

      {/* Default redirect for /tenant/tea-boy */}
      <Route
        path="/tenant/tea-boy"
        element={
          isAuthenticated && user?.role === 'TEA_BOY' ? (
            <Navigate to="/tenant/tea-boy/dashboard" replace />
          ) : (
            <Navigate to="/tenant/tea-boy/login" replace />
          )
        }
      />

      {/* 404 - Redirect to tea-boy login */}
      <Route path="*" element={<Navigate to="/tenant/tea-boy/login" replace />} />
    </Routes>
  );
}

export default App;
