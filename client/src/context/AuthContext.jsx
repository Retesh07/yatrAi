import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiLogin, apiRegister, apiLogout, apiRefreshToken } from '../api/auth';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);   // access token — kept in memory only
  const [authLoading, setAuthLoading] = useState(true); // true while restoring session

  const isAuthenticated = !!user && !!token;

  /* ── Restore session on page load ──────────────────────────
     The httpOnly refresh cookie is sent automatically by the
     browser, so we just call /refresh and restore user state.
  ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('yatrai_user');

      try {
        const data = await apiRefreshToken();
        setToken(data.accessToken);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          // Default user object if not in localStorage
          setUser({ name: 'Traveler' });
        }
      } catch (err) {
        // Refresh token expired or invalid — clear state completely
        setUser(null);
        setToken(null);
        localStorage.removeItem('yatrai_user');
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (token) {
      initSocket(token);
    } else {
      disconnectSocket();
    }
  }, [token]);

  /* ── Login ──────────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setToken(data.accessToken);
    localStorage.setItem('yatrai_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  /* ── Register ───────────────────────────────────────────── */
  const register = useCallback(async (name, email, password) => {
    const data = await apiRegister(name, email, password);
    return data;
  }, []);

  /* ── Logout ─────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    try {
      if (token) await apiLogout(token);
    } catch {
      // Ignore logout errors
    }
    disconnectSocket();
    setUser(null);
    setToken(null);
    localStorage.removeItem('yatrai_user');
    sessionStorage.clear();
  }, [token]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('yatrai_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, authLoading, login, logout, register, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
