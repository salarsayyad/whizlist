/*
  # Initial Schema Setup for Whizlist

  1. New Tables
    - `profiles`
      - Extends auth.users with additional user information
      - Stores user profile data like full name and avatar URL
    
    - `folders`
      - Stores user-created folders for organizing lists
      - Supports nested folders through parent_id
      - Includes metadata like name, description, and visibility
    
    - `lists`
      - Stores user-created lists
      - Can be organized within folders
      - Includes metadata and sharing settings
    
    - `products`
      - Stores saved products from around the web
      - Includes product details and metadata
    
    - `list_products`
      - Junction table for products in lists
      - Allows the same product to be in multiple lists
    
    - `folder_shares`
      - Manages folder sharing and permissions
    
    - `list_shares`
      - Manages list sharing and permissions

  2. Security
    - Enable RLS on all tables
    - Add policies for:
      - Owners to have full CRUD access
      - Shared users to have access based on permissions
      - Public items to be viewable by all authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create folders table
CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  parent_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lists table
CREATE TABLE lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price text,
  image_url text,
  product_url text NOT NULL,
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create list_products junction table
CREATE TABLE list_products (
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (list_id, product_id)
);

-- Create folder_shares table
CREATE TABLE folder_shares (
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (folder_id, user_id)
);

-- Create list_shares table
CREATE TABLE list_shares (
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (list_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_shares ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Folders policies
CREATE POLICY "Users can view their own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM folder_shares
      WHERE folder_id = folders.id
      AND user_id = auth.uid()
    ) OR
    is_public = true
  );

CREATE POLICY "Users can create folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM folder_shares
      WHERE folder_id = folders.id
      AND user_id = auth.uid()
      AND permission = 'editor'
    )
  );

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Lists policies
CREATE POLICY "Users can view their own lists and shared lists"
  ON lists FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM list_shares
      WHERE list_id = lists.id
      AND user_id = auth.uid()
    ) OR
    is_public = true
  );

CREATE POLICY "Users can create lists"
  ON lists FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM list_shares
      WHERE list_id = lists.id
      AND user_id = auth.uid()
      AND permission = 'editor'
    )
  );

CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Products policies
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- List products policies
CREATE POLICY "Users can view list products they have access to"
  ON list_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE id = list_products.list_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_shares
          WHERE list_id = lists.id
          AND user_id = auth.uid()
        ) OR
        is_public = true
      )
    )
  );

CREATE POLICY "Users can manage list products they own"
  ON list_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE id = list_products.list_id
      AND owner_id = auth.uid()
    )
  );

-- Shares policies
CREATE POLICY "Users can view their shares"
  ON folder_shares FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage shares for their folders"
  ON folder_shares FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM folders
      WHERE id = folder_shares.folder_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their list shares"
  ON list_shares FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage shares for their lists"
  ON list_shares FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE id = list_shares.list_id
      AND owner_id = auth.uid()
    )
  );

-- Create a trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create a trigger to create profile after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();