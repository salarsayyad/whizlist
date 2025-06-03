import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { List } from '../types';
import { useAuthStore } from './authStore';

interface ListState {
  lists: List[];
  isLoading: boolean;
  error: string | null;
  fetchLists: () => Promise<void>;
  createList: (list: Pick<List, 'name' | 'description' | 'isPublic' | 'folderId'>) => Promise<List>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addProductToList: (listId: string, productId: string) => Promise<void>;
  removeProductFromList: (listId: string, productId: string) => Promise<void>;
}

const mapDbListToUiList = (dbList: any, products: string[] = []): List => ({
  id: dbList.id,
  name: dbList.name,
  description: dbList.description,
  isPublic: dbList.is_public,
  isPinned: false, // Not stored in DB
  createdAt: dbList.created_at,
  updatedAt: dbList.updated_at,
  folderId: dbList.folder_id,
  products,
  ownerId: dbList.owner_id,
  collaborators: [], // Fetch separately if needed
});

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,

  fetchLists: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Fetch lists with folder information
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select(`
          *,
          folders (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      // Fetch list_products relationships
      const { data: listProductsData, error: listProductsError } = await supabase
        .from('list_products')
        .select('list_id, product_id');

      if (listProductsError) throw listProductsError;

      // Group products by list
      const productsByList = listProductsData.reduce((acc: { [key: string]: string[] }, curr) => {
        if (!acc[curr.list_id]) {
          acc[curr.list_id] = [];
        }
        acc[curr.list_id].push(curr.product_id);
        return acc;
      }, {});

      // Map DB lists to UI lists with their products
      const lists = listsData.map((list) => 
        mapDbListToUiList(list, productsByList[list.id] || [])
      );

      set({ lists });
      
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createList: async (list) => {
    try {
      set({ isLoading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lists')
        .insert([{
          name: list.name,
          description: list.description,
          is_public: list.isPublic,
          folder_id: list.folderId,
          owner_id: userId
        }])
        .select(`
          *,
          folders (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      const newList = mapDbListToUiList(data, []);
      set(state => ({ lists: [newList, ...state.lists] }));
      return newList;
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateList: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const dbUpdates = {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.isPublic !== undefined && { is_public: updates.isPublic }),
        ...(updates.folderId !== undefined && { folder_id: updates.folderId }),
      };
      
      const { data, error } = await supabase
        .from('lists')
        .update(dbUpdates)
        .eq('id', id)
        .select(`
          *,
          folders (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      // Preserve products array from existing state
      const existingList = get().lists.find(list => list.id === id);
      const updatedList = mapDbListToUiList(data, existingList?.products || []);
      
      set(state => ({
        lists: state.lists.map(list => 
          list.id === id ? updatedList : list
        )
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteList: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        lists: state.lists.filter(list => list.id !== id)
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addProductToList: async (listId, productId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('list_products')
        .insert([{ list_id: listId, product_id: productId }]);

      if (error) throw error;

      set(state => ({
        lists: state.lists.map(list =>
          list.id === listId
            ? { ...list, products: [...list.products, productId] }
            : list
        )
      }));

    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeProductFromList: async (listId, productId) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('list_products')
        .delete()
        .match({ list_id: listId, product_id: productId });

      if (error) throw error;

      set(state => ({
        lists: state.lists.map(list =>
          list.id === listId
            ? { ...list, products: list.products.filter(id => id !== productId) }
            : list
        )
      }));

    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));