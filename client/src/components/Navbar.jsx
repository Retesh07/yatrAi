import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-outline-variant/30 dark:border-white/10 bg-surface/80 dark:bg-[#0F0F0F]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container font-bold text-lg transition-transform group-hover:scale-105">
            Y
          </div>
          <span className="text-xl font-bold text-on-surface dark:text-white tracking-tight">
            Yatr<span className="text-primary-container">AI</span>
          </span>
        </Link>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Notifications bell */}
              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/10 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold text-on-primary-container">
                  3
                </span>
              </Link>

              {/* User avatar dropdown */}
              <div className="relative">
                <button
                  id="user-avatar-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container font-semibold text-sm hover:brightness-110 transition-all duration-200"
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#1a1a1a] shadow-xl animate-fade-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-outline-variant/20 dark:border-white/10">
                      <p className="text-sm font-semibold text-on-surface dark:text-white">{user?.name}</p>
                      <p className="text-xs text-secondary dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
                      Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-container/30 dark:hover:bg-error/10 transition-colors">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-5 py-2.5 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all duration-200"
              >
                Log In
              </Link>
              <Link
                to="/plan"
                className="rounded-xl bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary-container hover:brightness-110 transition-all duration-200 shadow-md shadow-primary-container/25"
              >
                Plan a Trip
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/40 dark:border-white/10 text-on-surface dark:text-white"
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant/30 dark:border-white/10 bg-surface dark:bg-[#0F0F0F] animate-fade-in">
          <div className="flex flex-col gap-2 px-4 py-4">
            <button onClick={toggleTheme} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-colors">
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-colors">Dashboard</Link>
                <Link to="/notifications" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-colors">Notifications</Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-colors">Settings</Link>
                <button onClick={handleLogout} className="rounded-xl px-4 py-3 text-sm text-left text-error hover:bg-error-container/30 transition-colors">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-colors">Log In</Link>
                <Link to="/plan" onClick={() => setMobileOpen(false)} className="rounded-xl bg-primary-container px-4 py-3 text-sm font-semibold text-on-primary-container text-center">Plan a Trip</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
