import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { useAuthStore } from './authStore';
import { uploadImageFromUrl, deleteProductImage } from '../lib/imageUpload';

interface ProductState {
  products: Product[];
  allProducts: Product[]; // New: Store all products separately for search
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  extractingProducts: string[];
  fetchProducts: () => Promise<void>;
  fetchAllProducts: () => Promise<void>; // New: Fetch all products for search
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
  allProducts: [], // Initialize empty
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
      set({ products: mappedProducts, allProducts: mappedProducts });
      
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllProducts: async () => {
    try {
      // Don't set loading state for this background fetch
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedProducts = (data || []).map(mapDbProductToUiProduct);
      set({ allProducts: mappedProducts });
      
    } catch (error) {
      console.error('Error fetching all products for search:', error);
      // Don't update error state for background fetch
    }
  },

  fetchProductsByList: async (listId: string | null) => {
    try {
      set({ isLoading: true, error: null, products: [] }); // Clear products immediately
      
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
      
      // Also update allProducts in the background to keep search current
      get().fetchAllProducts();
      
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

      let finalImageUrl = product.imageUrl;

      // If we have an image URL, upload it to Supabase Storage
      if (finalImageUrl && finalImageUrl.startsWith('http')) {
        try {
          // Generate a temporary product ID for the image upload
          const tempProductId = crypto.randomUUID();
          
          const uploadResult = await uploadImageFromUrl(
            finalImageUrl,
            tempProductId,
            userId
          );

          if (uploadResult.success && uploadResult.url) {
            finalImageUrl = uploadResult.url;
          }
        } catch (uploadError) {
          console.warn('Failed to upload image to storage, using original URL:', uploadError);
          // Continue with original URL if upload fails
        }
      }

      const dbProduct = mapUiProductToDbProduct({ 
        ...product, 
        imageUrl: finalImageUrl,
        ownerId: userId 
      });

      const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

      if (error) throw error;
      
      const mappedProduct = mapDbProductToUiProduct(data);

      // If we uploaded with a temp ID, we need to rename the file to use the actual product ID
      if (finalImageUrl && finalImageUrl.includes('supabase') && product.imageUrl !== finalImageUrl) {
        try {
          const tempProductId = crypto.randomUUID();
          const oldPath = `${userId}/${tempProductId}`;
          const newPath = `${userId}/${mappedProduct.id}`;
          
          // Copy the file to the new location
          const { error: copyError } = await supabase.storage
            .from('product-images')
            .copy(oldPath, newPath);

          if (!copyError) {
            // Delete the old file
            await supabase.storage
              .from('product-images')
              .remove([oldPath]);

            // Update the product with the new image URL
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(newPath);

            await supabase
              .from('products')
              .update({ image_url: publicUrl })
              .eq('id', mappedProduct.id);

            mappedProduct.imageUrl = publicUrl;
          }
        } catch (renameError) {
          console.warn('Failed to rename uploaded image:', renameError);
        }
      }

      set(state => ({ 
        products: [mappedProduct, ...state.products],
        allProducts: [mappedProduct, ...state.allProducts]
      }));

      // Update list product count if product was assigned to a list
      if (mappedProduct.listId) {
        const { useListStore } = await import('./listStore');
        useListStore.getState().refreshProductCounts();
      }

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
        ),
        allProducts: state.allProducts.map(product => 
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
      
      // Get the product to know which list it was in and for image cleanup
      const product = get().products.find(p => p.id === id) || get().allProducts.find(p => p.id === id);
      const oldListId = product?.listId;
      const userId = useAuthStore.getState().user?.id;
      
      // Delete the product from database first
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete associated image from storage
      if (userId) {
        try {
          await deleteProductImage(id, userId);
        } catch (imageError) {
          console.warn('Failed to delete product image:', imageError);
          // Don't fail the entire operation if image deletion fails
        }
      }

      set(state => ({
        products: state.products.filter(product => product.id !== id),
        allProducts: state.allProducts.filter(product => product.id !== id)
      }));

      // Update list product count if product was in a list
      if (oldListId) {
        const { useListStore } = await import('./listStore');
        useListStore.getState().refreshProductCounts();
      }
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  togglePin: async (id) => {
    const product = get().products.find(p => p.id === id) || get().allProducts.find(p => p.id === id);
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
        ),
        allProducts: state.allProducts.map(p => 
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
      
      // Get the current product to know its old list
      const currentProduct = get().products.find(p => p.id === productId) || get().allProducts.find(p => p.id === productId);
      const oldListId = currentProduct?.listId;
      
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
        ),
        allProducts: state.allProducts.map(product => 
          product.id === productId ? mappedProduct : product
        )
      }));

      // Update product counts for affected lists
      const { useListStore } = await import('./listStore');
      useListStore.getState().refreshProductCounts();
      
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
      
      const originalProduct = get().products.find(p => p.id === productId) || get().allProducts.find(p => p.id === productId);
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

      // If the original product has a Supabase-hosted image, copy it for the new product
      if (originalProduct.imageUrl && originalProduct.imageUrl.includes('supabase')) {
        try {
          const oldPath = `${userId}/${originalProduct.id}`;
          const newPath = `${userId}/${mappedProduct.id}`;
          
          const { error: copyError } = await supabase.storage
            .from('product-images')
            .copy(oldPath, newPath);

          if (!copyError) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(newPath);

            await supabase
              .from('products')
              .update({ image_url: publicUrl })
              .eq('id', mappedProduct.id);

            mappedProduct.imageUrl = publicUrl;
          }
        } catch (copyError) {
          console.warn('Failed to copy product image:', copyError);
        }
      }

      set(state => ({ 
        products: [mappedProduct, ...state.products],
        allProducts: [mappedProduct, ...state.allProducts]
      }));

      // Update product counts for the target list
      const { useListStore } = await import('./listStore');
      useListStore.getState().refreshProductCounts();

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
      ),
      allProducts: state.allProducts.map(p => 
        p.id === product.id ? product : p
      )
    }));
  },
}));