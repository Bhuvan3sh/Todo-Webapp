import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';

export const SignUp: React.FC = () => {
  const { signUp, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signUp(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#E0E5EC] dark:bg-[#121212] transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full neu-raised flex items-center justify-center text-[#6C63FF] mb-3">
          <CheckSquare className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
          Task Buddy
        </h1>
        <p className="text-xs font-light text-gray-500 dark:text-gray-400 mt-1">
          Create your free account
        </p>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-md neu-raised rounded-neu-card p-6 sm:p-8 transition-all">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          Get Started
        </h2>

        {isDemoMode && (
          <div className="mb-5 p-3 rounded-neu-btn neu-sunken text-xs text-gray-600 dark:text-gray-300 flex flex-col gap-1">
            <span className="font-bold text-[#6C63FF]">💡 Localhost Testing Mode:</span>
            <span>Create any test account to launch directly into the dashboard.</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-neu-btn bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-neu-btn neu-accent-button font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 font-light">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#6C63FF] hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};
