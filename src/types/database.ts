// Generated types from Supabase schema
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  parent_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type List = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  folder_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  image_url: string | null;
  product_url: string;
  is_pinned: boolean;
  tags: string[];
  owner_id: string;
  list_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ListProduct = {
  list_id: string;
  product_id: string;
  added_at: string;
};

export type Comment = {
  id: string;
  content: string;
  product_id: string | null; // Made nullable to support comments on folders and lists
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  entity_type: 'product' | 'folder' | 'list';
  entity_id: string;
};

export type FolderShare = {
  folder_id: string;
  user_id: string;
  permission: 'viewer' | 'editor';
  created_at: string;
};

export type ListShare = {
  list_id: string;
  user_id: string;
  permission: 'viewer' | 'editor';
  created_at: string;
};