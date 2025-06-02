import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ 
        user: session?.user ?? null,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isLoading: false 
      });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;
      set({ user: data.user });
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      set({ user: data.user });
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Always clear the user state first to ensure the UI updates immediately
      set({ user: null });
      
      const { error } = await supabase.auth.signOut();
      
      // If there's an error during sign out, we don't throw it since the user is already signed out locally
      if (error) {
        console.warn('Error during sign out:', error.message);
      }
      
    } catch (error) {
      // Log the error but don't throw it or update the error state
      console.warn('Unexpected error during sign out:', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState({ 
    user: session?.user ?? null,
    isLoading: false 
  });
});