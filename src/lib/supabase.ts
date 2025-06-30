import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/authStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced error handling for missing environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Supabase URL is required. Please check your environment configuration.');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Supabase Anonymous Key is required. Please check your environment configuration.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Must start with https://');
}

// Log environment status (without exposing sensitive data)
console.log('Supabase configuration:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  hasAnonKey: !!supabaseAnonKey,
  environment: import.meta.env.MODE
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'whizlist_auth_token',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
    fetch: async (...args) => {
      try {
        const response = await fetch(...args);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      } catch (err) {
        console.error('Supabase connection error:', err);
        if (err instanceof TypeError && err.message.includes('NetworkError')) {
          throw new Error('Unable to connect to Supabase. Please check your internet connection and try again.');
        }
        throw new Error(`Failed to connect to Supabase: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
  },
});

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  try {
    useAuthStore.setState({ 
      user: session?.user ?? null,
      isLoading: false 
    });
  } catch (error) {
    console.error('Auth state change error:', error);
    useAuthStore.setState({ 
      user: null,
      isLoading: false,
      error: 'Failed to update authentication state'
    });
  }
});