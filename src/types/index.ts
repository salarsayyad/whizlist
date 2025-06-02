export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price?: string;
  image?: string;
  url: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  listId?: string;
  folderId?: string;
  tags: string[];
  createdBy: string;
}

export interface List {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  products: string[]; // Array of product IDs
  createdBy: string;
  collaborators: Collaborator[];
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  lists: string[]; // Array of list IDs
  createdBy: string;
  collaborators: Collaborator[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  productId?: string;
  listId?: string;
  userId: string;
}

export interface Collaborator {
  userId: string;
  permission: 'viewer' | 'editor' | 'admin';
  addedAt: string;
}

export type ViewMode = 'grid' | 'list';