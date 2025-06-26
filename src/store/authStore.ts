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

// Helper function to convert Supabase errors to user-friendly messages
const getAuthErrorMessage = (error: any): string => {
  // First, try to parse the error body if it exists (for Supabase API errors)
  if (error?.body && typeof error.body === 'string') {
    try {
      const parsedBody = JSON.parse(error.body);
      
      // Check for specific error codes in the parsed body
      if (parsedBody.code === 'user_already_exists' || parsedBody.message?.includes('User already registered')) {
        return 'An account with this email already exists. Please try logging in or use a different email.';
      }
      
      if (parsedBody.code === 'invalid_credentials' || parsedBody.message?.includes('Invalid login credentials')) {
        return 'Invalid email or password. Please check your credentials and try again.';
      }
      
      if (parsedBody.code === 'email_not_confirmed' || parsedBody.message?.includes('email not confirmed')) {
        return 'Please check your email and click the confirmation link before signing in.';
      }
      
      if (parsedBody.code === 'weak_password' || parsedBody.message?.includes('Password')) {
        return 'Password must be at least 6 characters long.';
      }
      
      if (parsedBody.code === 'invalid_email' || parsedBody.message?.includes('email')) {
        return 'Please enter a valid email address.';
      }
      
      // If we have a user-friendly message in the parsed body, use it
      if (parsedBody.message && parsedBody.message.length < 100) {
        return parsedBody.message;
      }
    } catch (parseError) {
      // If parsing fails, continue with other error handling methods
    }
  }
  
  // Handle Supabase auth errors from error.message
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // User already exists
    if (message.includes('user already registered') || message.includes('user_already_exists')) {
      return 'An account with this email already exists. Please try logging in or use a different email.';
    }
    
    // Invalid email format
    if (message.includes('invalid email') || message.includes('email not valid')) {
      return 'Please enter a valid email address.';
    }
    
    // Password too weak
    if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('minimum'))) {
      return 'Password must be at least 6 characters long.';
    }
    
    // Invalid login credentials
    if (message.includes('invalid login credentials') || message.includes('email not confirmed')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    
    // Email not confirmed
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    
    // Network or connection errors
    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      return 'Connection error. Please check your internet connection and try again.';
    }
  }
  
  // Handle HTTP status codes
  if (error?.status) {
    switch (error.status) {
      case 422:
        return 'Invalid request. Please check your information and try again.';
      case 429:
        return 'Too many attempts. Please wait a moment before trying again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
    }
  }
  
  // Fallback to original error message if it's user-friendly, otherwise use generic message
  if (error?.message && error.message.length < 100 && !error.message.includes('HTTP')) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

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
        error: getAuthErrorMessage(error),
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
            full_name: name // Pass the name as metadata
          }
        }
      });

      if (error) throw error;
      set({ user: data.user });
      
    } catch (error) {
      const friendlyMessage = getAuthErrorMessage(error);
      set({ error: friendlyMessage });
      throw new Error(friendlyMessage);
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
      const friendlyMessage = getAuthErrorMessage(error);
      set({ error: friendlyMessage });
      throw new Error(friendlyMessage);
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