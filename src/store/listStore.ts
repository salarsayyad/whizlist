import { create } from 'zustand';
import { List } from '../types';

interface ListState {
  lists: List[];
  isLoading: boolean;
  error: string | null;
  addList: (list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeList: (id: string) => void;
  togglePin: (id: string) => void;
  addProductToList: (listId: string, productId: string) => void;
  removeProductFromList: (listId: string, productId: string) => void;
}

// Sample initial data
const initialLists: List[] = [
  {
    id: '1',
    name: 'Shopping List',
    description: 'Things to buy for the apartment',
    isPublic: false,
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    products: ['3', '4'],
    createdBy: 'user1',
    collaborators: [],
  },
  {
    id: '2',
    name: 'Gift Ideas',
    description: 'Gift ideas for friends and family',
    isPublic: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    products: [],
    createdBy: 'user1',
    collaborators: [
      {
        userId: 'user2',
        permission: 'viewer',
        addedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
];

export const useListStore = create<ListState>((set) => ({
  lists: initialLists,
  isLoading: false,
  error: null,
  
  addList: (list) => set((state) => ({
    lists: [
      {
        ...list,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...state.lists,
    ],
  })),
  
  removeList: (id) => set((state) => ({
    lists: state.lists.filter((list) => list.id !== id),
  })),
  
  togglePin: (id) => set((state) => ({
    lists: state.lists.map((list) => 
      list.id === id 
        ? { ...list, isPinned: !list.isPinned, updatedAt: new Date().toISOString() } 
        : list
    ),
  })),
  
  addProductToList: (listId, productId) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === listId
        ? { 
            ...list, 
            products: list.products.includes(productId) ? list.products : [...list.products, productId],
            updatedAt: new Date().toISOString(),
          }
        : list
    ),
  })),
  
  removeProductFromList: (listId, productId) => set((state) => ({
    lists: state.lists.map((list) =>
      list.id === listId
        ? { 
            ...list, 
            products: list.products.filter((id) => id !== productId),
            updatedAt: new Date().toISOString(),
          }
        : list
    ),
  })),
}));