import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';

// Initialize auth state from stored session
const initializeAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  useAuthStore.setState({ 
    user: session?.user ?? null,
    isLoading: false 
  });
};

// Initialize auth state before rendering
initializeAuth().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
});