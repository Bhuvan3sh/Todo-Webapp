import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEMO_USER_KEY = 'neurotask_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isDemo = !isSupabaseConfigured();

  // Attempt to silently recover the session when token refresh fails
  const recoverSession = useCallback(async () => {
    if (isDemo || !supabase) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('[Task Buddy] Session recovery error:', error.message);
        // Don't sign out — keep user logged in with stale data
        // The user can still view their cached tasks
        return;
      }

      if (session?.user) {
        setUser(session.user);
      }
    } catch (e) {
      console.warn('[Task Buddy] Session recovery failed:', e);
      // Silently fail — don't log user out
    }
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Only clear user on explicit sign-out
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            setUser(session.user);
          }
          setLoading(false);
          return;
        }

        // For any other event, preserve the existing user if session is null
        // This prevents auto-logout on transient network errors
        if (session?.user) {
          setUser(session.user);
        }
        setLoading(false);
      });

      // Periodically refresh the session to keep it alive (every 10 minutes)
      const refreshInterval = setInterval(async () => {
        if (!supabase) return;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Force a token refresh if the token will expire within 5 minutes
            const expiresAt = session.expires_at;
            const now = Math.floor(Date.now() / 1000);
            if (expiresAt && expiresAt - now < 300) {
              await supabase.auth.refreshSession();
            }
          }
        } catch (e) {
          console.warn('[Task Buddy] Background token refresh failed:', e);
          // Don't log out — just retry next interval
        }
      }, 10 * 60 * 1000); // Every 10 minutes

      // Also refresh when the page becomes visible again (user returns to tab/app)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          recoverSession();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Also refresh when the app comes back online
      const handleOnline = () => {
        recoverSession();
      };
      window.addEventListener('online', handleOnline);

      return () => {
        subscription.unsubscribe();
        clearInterval(refreshInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
      };
    } else {
      // Demo mode fallback
      const savedUserStr = localStorage.getItem(LOCAL_STORAGE_DEMO_USER_KEY);
      if (savedUserStr) {
        try {
          setUser(JSON.parse(savedUserStr));
        } catch (e) {
          setUser(null);
        }
      } else {
        const defaultUser = {
          id: 'demo-user-123',
          email: 'demo@taskbuddy.app',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as unknown as User;
        setUser(defaultUser);
        localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(defaultUser));
      }
      setLoading(false);
    }
  }, [isDemo, recoverSession]);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    if (!isDemo && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } else {
      if (!email || !password) {
        return { error: 'Please enter both email and password' };
      }
      const demoUser = {
        id: 'demo-user-' + btoa(email).slice(0, 8),
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(demoUser);
      if (rememberMe) {
        localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
      }
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isDemo && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.user && !data.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) {
          return { error: signInErr.message };
        }
      }

      return { error: null };
    } else {
      if (!email || !password) {
        return { error: 'Please enter both email and password' };
      }
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long' };
      }
      const demoUser = {
        id: 'demo-user-' + btoa(email).slice(0, 8),
        email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(demoUser);
      localStorage.setItem(LOCAL_STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
      return { error: null };
    }
  };

  const resetPassword = async (email: string) => {
    if (!isDemo && supabase) {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } else {
      return { error: null };
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!isDemo && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } else {
      return { error: null };
    }
  };

  const signOut = async () => {
    if (!isDemo && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_DEMO_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        resetPassword,
        updatePassword,
        signOut,
        isDemoMode: isDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
