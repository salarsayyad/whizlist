import { create } from 'zustand';

interface GlobalCommentsState {
  isOpen: boolean;
  productId: string | null;
  productTitle: string | null;
  openComments: (productId: string, productTitle?: string) => void;
  closeComments: () => void;
}

export const useGlobalCommentsStore = create<GlobalCommentsState>((set) => ({
  isOpen: false,
  productId: null,
  productTitle: null,
  
  openComments: (productId: string, productTitle?: string) => {
    set({ 
      isOpen: true, 
      productId, 
      productTitle: productTitle || null 
    });
  },
  
  closeComments: () => {
    set({ 
      isOpen: false, 
      productId: null, 
      productTitle: null 
    });
  },
}));