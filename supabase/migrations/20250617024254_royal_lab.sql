/*
  # Add Comments System for Products

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `content` (text, required)
      - `product_id` (uuid, references products)
      - `user_id` (uuid, references auth.users)
      - `parent_id` (uuid, references comments for replies)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_edited` (boolean, default false)

  2. Security
    - Enable RLS on comments table
    - Add policies for:
      - Users can view comments on products they can access
      - Users can create comments on products they can access
      - Users can update/delete their own comments
      - Product owners can delete any comments on their products

  3. Indexes
    - Add indexes for performance on product_id and parent_id
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_edited boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS comments_product_id_idx ON comments(product_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Users can view comments on products they can access
CREATE POLICY "Users can view comments on accessible products"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = comments.product_id
      AND products.owner_id = auth.uid()
    )
  );

-- Users can create comments on products they can access
CREATE POLICY "Users can create comments on accessible products"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = comments.product_id
      AND products.owner_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Product owners can delete any comments on their products
CREATE POLICY "Product owners can delete comments on their products"
  ON comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = comments.product_id
      AND products.owner_id = auth.uid()
    )
  );