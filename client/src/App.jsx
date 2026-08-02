import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TripWizard from './pages/TripWizard';
import TripGenerator from './pages/TripGenerator';
import TripDetail from './pages/TripDetail';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';

/* ── Protected Route wrapper ──────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();

  // Still checking session — don't redirect yet
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[#0F0F0F]">
        <svg className="h-10 w-10 animate-spin text-primary-container" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

/* ── App Routes ───────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/explore" element={<Explore />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/plan" element={<ProtectedRoute><TripWizard /></ProtectedRoute>} />
      <Route path="/generate" element={<ProtectedRoute><TripGenerator /></ProtectedRoute>} />
      <Route path="/trip/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ── Root App Component ───────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
