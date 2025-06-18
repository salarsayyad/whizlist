import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { useAuthStore } from './authStore';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  extractingProducts: string[];
  fetchProducts: () => Promise<void>;
  fetchProductsByList: (listId: string | null) => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  moveProductToList: (productId: string, listId: string | null) => Promise<void>;
  copyProductToList: (productId: string, listId: string | null) => Promise<Product>;
  setViewMode: (mode: 'grid' | 'list') => void;
  setExtracting: (productId: string, isExtracting: boolean) => void;
  updateProductInStore: (product: Product) => void;
}

// Helper function to map database product to UI product
const mapDbProductToUiProduct = (dbProduct: any): Product => ({
  id: dbProduct.id,
  title: dbProduct.title,
  description: dbProduct.description,
  price: dbProduct.price,
  imageUrl: dbProduct.image_url,
  productUrl: dbProduct.product_url,
  isPinned: dbProduct.is_pinned || false,
  tags: dbProduct.tags || [],
  listId: dbProduct.list_id,
  ownerId: dbProduct.owner_id,
  createdAt: dbProduct.created_at,
  updatedAt: dbProduct.updated_at
});

// Helper function to map UI product to database format
const mapUiProductToDbProduct = (uiProduct: Partial<Product>) => ({
  title: uiProduct.title,
  description: uiProduct.description,
  price: uiProduct.price,
  image_url: uiProduct.imageUrl,
  product_url: uiProduct.productUrl,
  is_pinned: uiProduct.isPinned,
  tags: uiProduct.tags,
  list_id: uiProduct.listId,
  owner_id: uiProduct.ownerId
});

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  viewMode: 'grid',
  extractingProducts: [],

  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedProducts = (data || []).map(mapDbProductToUiProduct);
      set({ products: mappedProducts });
      
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProductsByList: async (listId: string | null) => {
    try {
      set({ isLoading: true, error: null });
      
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (listId === null) {
        // Fetch unassigned products
        query = query.is('list_id', null);
      } else {
        // Fetch products for specific list
        query = query.eq('list_id', listId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const mappedProducts = (data || []).map(mapDbProductToUiProduct);
      set({ products: mappedProducts });
      
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

      const dbProduct = mapUiProductToDbProduct({ ...product, ownerId: userId });

      const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

      if (error) throw error;
      
      const mappedProduct = mapDbProductToUiProduct(data);
      set(state => ({ products: [mappedProduct, ...state.products] }));
      return mappedProduct;
      
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
      
      const dbUpdates = mapUiProductToDbProduct(updates);
      
      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const mappedProduct = mapDbProductToUiProduct(data);
      set(state => ({
        products: state.products.map(product => 
          product.id === id ? mappedProduct : product
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
        .update({ is_pinned: !product.isPinned })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const mappedProduct = mapDbProductToUiProduct(data);
      set(state => ({
        products: state.products.map(p => 
          p.id === id ? mappedProduct : p
        )
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  moveProductToList: async (productId: string, listId: string | null) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('products')
        .update({ list_id: listId })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      
      const mappedProduct = mapDbProductToUiProduct(data);
      set(state => ({
        products: state.products.map(product => 
          product.id === productId ? mappedProduct : product
        )
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  copyProductToList: async (productId: string, listId: string | null) => {
    try {
      set({ isLoading: true, error: null });
      
      const originalProduct = get().products.find(p => p.id === productId);
      if (!originalProduct) throw new Error('Product not found');

      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');

      // Create a copy of the product with new list assignment
      const productCopy = {
        title: originalProduct.title,
        description: originalProduct.description,
        price: originalProduct.price,
        image_url: originalProduct.imageUrl,
        product_url: originalProduct.productUrl,
        is_pinned: false, // Reset pin status for copy
        tags: [...(originalProduct.tags || [])],
        list_id: listId,
        owner_id: userId
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productCopy])
        .select()
        .single();

      if (error) throw error;
      
      const mappedProduct = mapDbProductToUiProduct(data);
      set(state => ({ products: [mappedProduct, ...state.products] }));
      return mappedProduct;
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setExtracting: (productId, isExtracting) => {
    set(state => ({
      extractingProducts: isExtracting 
        ? [...state.extractingProducts, productId]
        : state.extractingProducts.filter(id => id !== productId)
    }));
  },

  updateProductInStore: (product) => {
    set(state => ({
      products: state.products.map(p => 
        p.id === product.id ? product : p
      )
    }));
  },
}));