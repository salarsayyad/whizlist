import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/authStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'whizlist_auth_token',
  },
  global: {
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        // Log the error for debugging
        console.error('Supabase fetch error:', err);
        // Throw a more descriptive error
        throw new Error(`Failed to connect to Supabase: ${err.message}`);
      });
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
    // Handle the error gracefully without breaking the app
    useAuthStore.setState({ 
      user: null,
      isLoading: false,
      error: 'Failed to update authentication state'
    });
  }
});