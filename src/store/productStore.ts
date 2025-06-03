import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { useAuthStore } from './authStore';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  fetchProducts: () => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  viewMode: 'grid',

  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ products: data || [] });
      
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createProduct: async (product) => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...product, owner_id: userId }])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ products: [data, ...state.products] }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProduct: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        products: state.products.map(product => 
          product.id === id ? { ...product, ...data } : product
        )
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProduct: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        products: state.products.filter(product => product.id !== id)
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  togglePin: async (id) => {
    const product = get().products.find(p => p.id === id);
    if (!product) return;

    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .update({ is_pinned: !product.is_pinned })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        products: state.products.map(p => 
          p.id === id ? { ...p, is_pinned: !p.is_pinned } : p
        )
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),
}));