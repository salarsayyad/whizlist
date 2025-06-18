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
  getProductCount: (listId: string) => Promise<number>;
}

const mapDbListToUiList = (dbList: any, productCount: number = 0): List => ({
  id: dbList.id,
  name: dbList.name,
  description: dbList.description,
  isPublic: dbList.is_public,
  isPinned: false, // Not stored in DB
  createdAt: dbList.created_at,
  updatedAt: dbList.updated_at,
  folderId: dbList.folder_id,
  productCount,
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

      // Get product counts for each list using the junction table
      const listsWithCounts = await Promise.all(
        listsData.map(async (list) => {
          const { count, error: countError } = await supabase
            .from('list_products')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          if (countError) {
            console.warn(`Error counting products for list ${list.id}:`, countError);
            return mapDbListToUiList(list, 0);
          }

          return mapDbListToUiList(list, count || 0);
        })
      );

      set({ lists: listsWithCounts });
      
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

      const newList = mapDbListToUiList(data, 0);
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

      // Preserve product count from existing state
      const existingList = get().lists.find(list => list.id === id);
      const updatedList = mapDbListToUiList(data, existingList?.productCount || 0);
      
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
      
      // First, remove all product associations from this list
      const { error: removeProductsError } = await supabase
        .from('list_products')
        .delete()
        .eq('list_id', id);

      if (removeProductsError) throw removeProductsError;

      // Then delete the list
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

  getProductCount: async (listId: string) => {
    try {
      const { count, error } = await supabase
        .from('list_products')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting product count:', error);
      return 0;
    }
  },
}));