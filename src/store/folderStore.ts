import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Folder } from '../types/database';

interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  createFolder: (folder: Pick<Folder, 'name' | 'description' | 'is_public' | 'parent_id'>) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  isLoading: false,
  error: null,

  fetchFolders: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ folders: data });
      
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createFolder: async (folder) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('folders')
        .insert([folder])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ folders: [data, ...state.folders] }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateFolder: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set(state => ({
        folders: state.folders.map(folder => 
          folder.id === id ? { ...folder, ...data } : folder
        )
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteFolder: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        folders: state.folders.filter(folder => folder.id !== id)
      }));
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));