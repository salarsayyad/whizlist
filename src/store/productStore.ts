import { create } from 'zustand';
import { Product } from '../types';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeProduct: (id: string) => void;
  togglePin: (id: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

// Sample initial data
const initialProducts: Product[] = [
  {
    id: '1',
    title: 'Apple MacBook Pro 16-inch',
    description: 'The most powerful MacBook Pro ever is here. With the blazing-fast M1 Pro or M1 Max chip — the first Apple silicon designed for pros.',
    price: '$2,499.00',
    image: 'https://images.pexels.com/photos/7974/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600',
    url: 'https://www.amazon.com/macbook-pro',
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['tech', 'laptop', 'apple'],
    createdBy: 'user1',
  },
  {
    id: '2',
    title: 'Sony WH-1000XM4 Wireless Noise-Canceling Headphones',
    description: 'Industry-leading noise cancellation technology means you hear every word, note, and tune with incredible clarity.',
    price: '$348.00',
    image: 'https://images.pexels.com/photos/577769/pexels-photo-577769.jpeg?auto=compress&cs=tinysrgb&w=600',
    url: 'https://www.amazon.com/sony-headphones',
    isPinned: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['tech', 'audio', 'headphones'],
    createdBy: 'user1',
  },
  {
    id: '3',
    title: 'Minimalist Ceramic Vase',
    description: 'Beautiful handcrafted ceramic vase with a modern design. Perfect for your home decor.',
    price: '$45.99',
    image: 'https://images.pexels.com/photos/6069552/pexels-photo-6069552.jpeg?auto=compress&cs=tinysrgb&w=600',
    url: 'https://www.etsy.com/ceramic-vase',
    isPinned: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    listId: '1',
    tags: ['home', 'decor', 'ceramic'],
    createdBy: 'user1',
  },
  {
    id: '4',
    title: 'Fiddle Leaf Fig Plant',
    description: 'Live indoor house plant. The Fiddle Leaf Fig is the perfect statement piece for any room in your home.',
    price: '$65.00',
    image: 'https://images.pexels.com/photos/6913639/pexels-photo-6913639.jpeg?auto=compress&cs=tinysrgb&w=600',
    url: 'https://www.amazon.com/plants',
    isPinned: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    listId: '1',
    folderId: '1',
    tags: ['home', 'plants', 'decor'],
    createdBy: 'user1',
  },
  {
    id: '5',
    title: 'Modern Desk Lamp',
    description: 'Sleek desk lamp with adjustable brightness and color temperature. Perfect for your home office.',
    price: '$49.99',
    image: 'https://images.pexels.com/photos/6492402/pexels-photo-6492402.jpeg?auto=compress&cs=tinysrgb&w=600',
    url: 'https://www.amazon.com/desk-lamp',
    isPinned: false,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
    folderId: '1',
    tags: ['home', 'office', 'lighting'],
    createdBy: 'user1',
  },
];

export const useProductStore = create<ProductState>((set) => ({
  products: initialProducts,
  isLoading: false,
  error: null,
  viewMode: 'grid',
  
  addProduct: (product) => set((state) => ({
    products: [
      {
        ...product,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...state.products,
    ],
  })),
  
  removeProduct: (id) => set((state) => ({
    products: state.products.filter((product) => product.id !== id),
  })),
  
  togglePin: (id) => set((state) => ({
    products: state.products.map((product) => 
      product.id === id 
        ? { ...product, isPinned: !product.isPinned, updatedAt: new Date().toISOString() } 
        : product
    ),
  })),
  
  setViewMode: (mode) => set({ viewMode: mode }),
}));