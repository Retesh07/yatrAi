import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      // Backend returns success message only — redirect to login to sign in
      navigate('/login', { state: { message: 'Account created! Please sign in.' } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-container/90" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200')] bg-cover bg-center mix-blend-overlay opacity-60" />
          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <h2 className="text-4xl font-bold leading-tight animate-slide-in-left">
              Start your
              <br />
              adventure today 🌍
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-md animate-slide-in-left animation-delay-200">
              Create a free account and let AI plan your perfect trip — from itinerary to packing list.
            </p>
            <div className="mt-10 flex gap-6 animate-slide-in-left animation-delay-300">
              {[
                { num: 'Free', label: 'To Get Started' },
                { num: '30s', label: 'Setup Time' },
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
            <h1 className="text-3xl font-bold text-on-surface dark:text-white">Create Account</h1>
            <p className="mt-2 text-secondary dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-container hover:underline font-medium">
                Sign in
              </Link>
            </p>



            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-error-container/50 dark:bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary-container px-4 py-3.5 text-sm font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" /></svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              <p className="text-xs text-center text-secondary dark:text-gray-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary-container hover:underline">Terms</a> and{' '}
                <a href="#" className="text-primary-container hover:underline">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
