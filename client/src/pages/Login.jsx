import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Message passed from Register page after successful registration
  const successMessage = location.state?.message || '';


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left — Image Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/80 to-primary/90" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200')] bg-cover bg-center mix-blend-overlay opacity-60" />
          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <h2 className="text-4xl font-bold leading-tight animate-slide-in-left">
              Welcome back,
              <br />
              adventurer ✈️
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-md animate-slide-in-left animation-delay-200">
              Your next perfect journey is just a few clicks away. Sign in to access your trips.
            </p>
            <div className="mt-10 flex gap-6 animate-slide-in-left animation-delay-300">
              {[
                
              
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold">{s.num}</p>
                  <p className="text-sm text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Form Panel */}
        <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-fade-in">
            <h1 className="text-3xl font-bold text-on-surface dark:text-white">Sign In</h1>
            <p className="mt-2 text-secondary dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-container hover:underline font-medium">
                Sign up
              </Link>
            </p>



            {/* Success message from Register redirect */}
            {successMessage && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                {successMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-error-container/50 dark:bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 pr-12 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary dark:text-gray-500 hover:text-on-surface dark:hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-outline-variant accent-primary-container" />
                  <span className="text-sm text-secondary dark:text-gray-400">Remember me</span>
                </label>
                <Link to="/reset-password" className="text-sm text-primary-container hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-container px-4 py-3.5 text-sm font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" /></svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
