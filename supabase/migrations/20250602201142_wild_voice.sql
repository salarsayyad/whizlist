/*
  # Fix Lists Table RLS Policies

  1. Changes
    - Drop existing RLS policies for lists table that are causing recursion
    - Create new, simplified RLS policies that avoid circular dependencies
    
  2. Security
    - Maintain same level of security but with cleaner policy structure
    - Users can still:
      - View their own lists
      - View public lists
      - View lists shared with them
      - Edit lists they own or have editor permissions for
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "lists_editor_update" ON lists;
DROP POLICY IF EXISTS "lists_owner_all" ON lists;
DROP POLICY IF EXISTS "lists_public_select" ON lists;
DROP POLICY IF EXISTS "lists_shared_select" ON lists;

-- Create new, simplified policies
CREATE POLICY "enable_owner_full_access" ON lists
  FOR ALL 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "enable_public_read_access" ON lists
  FOR SELECT 
  TO authenticated
  USING (is_public = true);

CREATE POLICY "enable_shared_read_access" ON lists
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM list_shares
      WHERE list_shares.list_id = lists.id
      AND list_shares.user_id = auth.uid()
    )
  );

CREATE POLICY "enable_shared_editor_update" ON lists
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