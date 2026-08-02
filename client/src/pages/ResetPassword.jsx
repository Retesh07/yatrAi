import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { apiRequestPasswordReset, apiConfirmPasswordReset } from '../api/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    try {
      setLoading(true);
      await apiRequestPasswordReset(email);
      setToast('Reset code sent if the email exists. Check your inbox.');
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Unable to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !otp || !newPassword) {
      setError('Please enter email, reset code, and new password.');
      return;
    }

    try {
      setLoading(true);
      await apiConfirmPasswordReset(email, otp, newPassword);
      setToast('Password reset successfully. Please sign in.');
      setEmail('');
      setOtp('');
      setNewPassword('');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="text-3xl font-bold text-on-surface dark:text-white">Reset Password</h1>
          <p className="mt-2 text-secondary dark:text-gray-400">
            {step === 'request'
              ? 'Enter your email and we will send a reset code to your inbox.'
              : 'Enter the code sent to your email and choose a new password.'}
          </p>

          <form onSubmit={step === 'request' ? handleRequestReset : handleConfirmReset} className="space-y-5 mt-8">
            {error && (
              <div className="rounded-xl bg-error-container/50 dark:bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
              />
            </div>

            {step === 'confirm' && (
              <>
                <div>
                  <label htmlFor="reset-otp" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                    Reset Code
                  </label>
                  <input
                    id="reset-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="reset-password" className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-container px-4 py-3.5 text-sm font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading
                ? step === 'request'
                  ? 'Sending code...'
                  : 'Resetting password...'
                : step === 'request'
                ? 'Send Reset Code'
                : 'Confirm New Password'}
            </button>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
