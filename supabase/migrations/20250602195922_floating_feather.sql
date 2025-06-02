/*
  # Fix Lists RLS Policies

  1. Changes
    - Remove existing RLS policies for lists table that cause recursion
    - Create new simplified policies that avoid recursive queries
    
  2. Security
    - Enable RLS on lists table
    - Add policies for:
      - Owners can do all operations
      - Shared users can view and edit based on list_shares
      - Public lists are viewable by authenticated users
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "enable_owner_all" ON lists;
DROP POLICY IF EXISTS "enable_public_read" ON lists;
DROP POLICY IF EXISTS "enable_shared_read" ON lists;
DROP POLICY IF EXISTS "enable_shared_update" ON lists;

-- Create new simplified policies
-- Owner has full access
CREATE POLICY "owners_full_access" ON lists
  FOR ALL 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Shared users can view lists shared with them
CREATE POLICY "shared_users_select" ON lists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM list_shares
      WHERE list_shares.list_id = lists.id
      AND list_shares.user_id = auth.uid()
    )
  );

-- Shared users with editor permission can update
CREATE POLICY "shared_users_update" ON lists
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM list_shares
      WHERE list_shares.list_id = lists.id
      AND list_shares.user_id = auth.uid()
      AND list_shares.permission = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM list_shares
      WHERE list_shares.list_id = lists.id
      AND list_shares.user_id = auth.uid()
      AND list_shares.permission = 'editor'
    )
  );

-- Public lists are viewable by any authenticated user
CREATE POLICY "public_lists_viewable" ON lists
  FOR SELECT
  TO authenticated
  USING (is_public = true);