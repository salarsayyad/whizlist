/*
  # Add Comments System for Folders and Lists

  1. Database Changes
    - Add `entity_type` and `entity_id` columns to comments table
    - Update foreign key constraints to support multiple entity types
    - Add indexes for performance
    - Update RLS policies to handle folder and list comments

  2. Security
    - Update RLS policies to allow comments on folders and lists
    - Maintain existing security model for product comments
    - Add policies for folder/list access permissions

  3. Migration Strategy
    - Add new columns with defaults
    - Update existing product comments to use new schema
    - Add new policies for folder and list comments
*/

-- Add new columns to support comments on different entity types
ALTER TABLE comments 
ADD COLUMN entity_type text DEFAULT 'product' CHECK (entity_type IN ('product', 'folder', 'list')),
ADD COLUMN entity_id uuid;

-- Update existing comments to use the new schema
UPDATE comments 
SET entity_type = 'product', entity_id = product_id 
WHERE entity_id IS NULL;

-- Make entity_id required now that we've populated it
ALTER TABLE comments 
ALTER COLUMN entity_id SET NOT NULL;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS comments_entity_type_idx ON comments(entity_type);
CREATE INDEX IF NOT EXISTS comments_entity_id_idx ON comments(entity_id);
CREATE INDEX IF NOT EXISTS comments_entity_type_id_idx ON comments(entity_type, entity_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view comments on accessible products" ON comments;
DROP POLICY IF EXISTS "Users can create comments on accessible products" ON comments;

-- Create new RLS policies for different entity types

-- Product comments (existing functionality)
CREATE POLICY "Users can view comments on accessible products"
  ON comments FOR SELECT
  TO authenticated
  USING (
    entity_type = 'product' AND
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = comments.entity_id
      AND products.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on accessible products"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    entity_type = 'product' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = comments.entity_id
      AND products.owner_id = auth.uid()
    )
  );

-- Folder comments
CREATE POLICY "Users can view comments on accessible folders"
  ON comments FOR SELECT
  TO authenticated
  USING (
    entity_type = 'folder' AND
    EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = comments.entity_id
      AND (
        folders.owner_id = auth.uid() OR
        folders.is_public = true OR
        EXISTS (
          SELECT 1 FROM folder_shares
          WHERE folder_shares.folder_id = folders.id
          AND folder_shares.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible folders"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    entity_type = 'folder' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = comments.entity_id
      AND (
        folders.owner_id = auth.uid() OR
        folders.is_public = true OR
        EXISTS (
          SELECT 1 FROM folder_shares
          WHERE folder_shares.folder_id = folders.id
          AND folder_shares.user_id = auth.uid()
        )
      )
    )
  );

-- List comments
CREATE POLICY "Users can view comments on accessible lists"
  ON comments FOR SELECT
  TO authenticated
  USING (
    entity_type = 'list' AND
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = comments.entity_id
      AND (
        lists.owner_id = auth.uid() OR
        lists.is_public = true OR
        EXISTS (
          SELECT 1 FROM list_shares
          WHERE list_shares.list_id = lists.id
          AND list_shares.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create comments on accessible lists"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    entity_type = 'list' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = comments.entity_id
      AND (
        lists.owner_id = auth.uid() OR
        lists.is_public = true OR
        EXISTS (
          SELECT 1 FROM list_shares
          WHERE list_shares.list_id = lists.id
          AND list_shares.user_id = auth.uid()
        )
      )
    )
  );

-- Owner deletion policies for folders and lists
CREATE POLICY "Folder owners can delete comments on their folders"
  ON comments FOR DELETE
  TO authenticated
  USING (
    entity_type = 'folder' AND
    EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = comments.entity_id
      AND folders.owner_id = auth.uid()
    )
  );

CREATE POLICY "List owners can delete comments on their lists"
  ON comments FOR DELETE
  TO authenticated
  USING (
    entity_type = 'list' AND
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = comments.entity_id
      AND lists.owner_id = auth.uid()
    )
  );