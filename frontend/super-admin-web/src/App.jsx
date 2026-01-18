// frontend/super-admin-web/src/App.jsx
import { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ActivationPage from './pages/ActivationPage';

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Protected Route Component with Auto Logout
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('superAdminAuth') === 'true';

  // Auto logout after inactivity
  const resetTimer = useCallback(() => {
    const lastActivity = Date.now();
    localStorage.setItem('superAdminLastActivity', lastActivity.toString());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check session timeout
    const checkSession = () => {
      const lastActivity = parseInt(localStorage.getItem('superAdminLastActivity') || '0');
      const now = Date.now();

      if (lastActivity && (now - lastActivity) > SESSION_TIMEOUT) {
        // Session expired - logout
        localStorage.removeItem('superAdminAuth');
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminLastActivity');
        navigate('/super-admin/login', { replace: true });
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60000);

    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Set initial activity
    resetTimer();

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, navigate, resetTimer]);

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return children;
};

// Public Route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('superAdminAuth') === 'true';

  if (isAuthenticated) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route
          path="/super-admin/login"
          element={
            <PublicRoute>
              <SuperAdminLogin />
            </PublicRoute>
          }
        />

        {/* Activation Page (Public) */}
        <Route path="/super-admin/activate" element={<ActivationPage />} />

        {/* Dashboard (Protected) */}
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Route - redirect to login */}
        <Route path="/super-admin" element={<Navigate to="/super-admin/login" replace />} />
        <Route path="/super-admin/" element={<Navigate to="/super-admin/login" replace />} />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/super-admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
