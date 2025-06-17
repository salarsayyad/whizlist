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
  productUrl: string;
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
  description?: string | null;
  isPublic: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  folderId?: string | null;
  products: string[]; // Array of product IDs
  ownerId: string;
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
  content: string;
  productId?: string; // Keep for backward compatibility
  entityType: 'product' | 'folder' | 'list';
  entityId: string;
  userId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

export interface Collaborator {
  userId: string;
  permission: 'viewer' | 'editor' | 'admin';
  addedAt: string;
}

export type ViewMode = 'grid' | 'list';