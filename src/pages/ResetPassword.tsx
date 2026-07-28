import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#E0E5EC] transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full neu-raised flex items-center justify-center text-[#6C63FF] mb-3">
          <CheckSquare className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Task Buddy
        </h1>
        <p className="text-xs font-light text-gray-500 mt-1">
          Set a new password for your account
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md neu-raised rounded-neu-card p-6 sm:p-8 transition-all">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Set New Password
        </h2>

        {success ? (
          <div className="p-4 rounded-neu-btn bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>Password updated successfully! Redirecting to dashboard...</span>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3 rounded-neu-btn bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50"
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

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-neu-btn neu-accent-button font-bold text-sm flex items-center justify-center gap-2 group transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Update Password <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
