import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound, CheckCircle2, X } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, resetPassword, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password, rememberMe);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);

    const { error: err } = await resetPassword(resetEmail);
    setResetLoading(false);

    if (err) {
      setResetError(err);
    } else {
      setResetSuccess(
        'Password reset link sent! Please check your email inbox (and spam folder) for instructions.'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#E0E5EC] transition-colors duration-300">
      
      {/* Brand Logo Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full neu-raised flex items-center justify-center text-[#6C63FF] mb-3">
          <CheckSquare className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Task Buddy
        </h1>
        <p className="text-xs font-light text-gray-500 mt-1">
          Sign in to your account
        </p>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-md neu-raised rounded-neu-card p-6 sm:p-8 transition-all">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Welcome Back
        </h2>

        {isDemoMode && (
          <div className="mb-5 p-3 rounded-neu-btn neu-sunken text-xs text-gray-600 flex flex-col gap-1">
            <span className="font-bold text-[#6C63FF]">💡 Localhost Testing Mode:</span>
            <span>You can log in with any email & password or click below to enter directly.</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-neu-btn bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setIsForgotModalOpen(true);
                }}
                className="text-xs text-[#6C63FF] hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-400 text-[#6C63FF] focus:ring-[#6C63FF]"
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-neu-btn neu-accent-button font-bold text-sm flex items-center justify-center gap-2 group transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-xs text-gray-500 font-light">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-[#6C63FF] hover:underline">
            Sign up
          </Link>
        </p>

      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md neu-raised rounded-neu-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-300/30">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-[#6C63FF]" />
                <h3 className="text-base font-bold text-gray-800">
                  Reset Password
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="w-8 h-8 rounded-full neu-raised neu-button flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Enter your account email address below to receive a password reset link.
            </p>

            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
              {resetError && (
                <div className="p-3 rounded-neu-btn bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 rounded-neu-btn bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setResetError('');
                    setResetSuccess('');
                  }}
                  className="px-4 py-2 rounded-neu-btn neu-raised neu-button text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="neu-accent-button px-5 py-2.5 rounded-neu-btn text-xs font-bold flex items-center gap-1.5"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
