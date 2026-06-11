import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext();

/* ── Mock API helpers (replace with real endpoints later) ──── */
const fakeApiDelay = () => new Promise((res) => setTimeout(res, 800));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // JWT kept in memory only

  const isAuthenticated = !!user;

  const login = useCallback(async (email, password) => {
    await fakeApiDelay();
    // Simulate server response — replace with real fetch later
    const fakeUser = {
      id: '1',
      name: email.split('@')[0],
      email,
      avatar: null,
    };
    const fakeToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.fake';
    setUser(fakeUser);
    setToken(fakeToken);
    // In production the server would set an httpOnly refresh cookie
    return fakeUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    await fakeApiDelay();
    const fakeUser = { id: '2', name, email, avatar: null };
    const fakeToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.fake-reg';
    setUser(fakeUser);
    setToken(fakeToken);
    return fakeUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    // In production: call /api/auth/logout to clear httpOnly cookie
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, login, logout, register }}
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
