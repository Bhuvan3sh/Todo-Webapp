import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if valid URL provided
const isConfigured = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Persist session in localStorage so Android PWA doesn't lose it
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Auto-refresh token before it expires
        autoRefreshToken: true,
        // Detect session from URL (for password reset links etc.)
        detectSessionInUrl: true,
        // Storage key for the session
        storageKey: 'task-buddy-auth',
      },
    })
  : null;

export const isSupabaseConfigured = (): boolean => isConfigured;
