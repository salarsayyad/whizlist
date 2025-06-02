import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { List } from '../types/database';
import { useAuthStore } from './authStore';

interface ListState {
  lists: List[];
  isLoading: boolean;
  error: string | null;
  fetchLists: () => Promise<void>;
  createList: (list: Pick<List, 'name' | 'description' | 'is_public' | 'folder_id'>) => Promise<void>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,

  fetchLists: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ lists: data });
      
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
        .insert([{ ...list, owner_id: userId }])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ lists: [data, ...state.lists] }));
      
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
      
      const { data, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        lists: state.lists.map(list => 
          list.id === id ? { ...list, ...data } : list
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
}));