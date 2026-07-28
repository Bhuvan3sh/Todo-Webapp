import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E0E5EC] dark:bg-[#121212] text-[#6C63FF]">
        <div className="w-16 h-16 rounded-full neu-raised flex items-center justify-center animate-spin">
          <div className="w-10 h-10 rounded-full border-4 border-[#6C63FF] border-t-transparent"></div>
        </div>
        <p className="mt-4 font-medium text-gray-600 dark:text-gray-300">Resolving Task Buddy session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
