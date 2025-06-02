/*
  # Fix Lists RLS Policies

  1. Changes
    - Drop existing RLS policies for lists table that may cause recursion
    - Create new, optimized RLS policies for lists table that avoid circular dependencies
    
  2. Security
    - Maintain same level of security but with more efficient policy structure
    - Policies ensure users can only access lists they own or have been shared with
    - Public lists remain accessible to authenticated users
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "lists_editor_update" ON lists;
DROP POLICY IF EXISTS "lists_owner_access" ON lists;
DROP POLICY IF EXISTS "lists_public_access" ON lists;
DROP POLICY IF EXISTS "lists_shared_access" ON lists;

-- Create new optimized policies
CREATE POLICY "enable_owner_full_access" ON lists
  FOR ALL 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "enable_shared_read_access" ON lists
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    id IN (
      SELECT list_id 
      FROM list_shares 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "enable_shared_update_access" ON lists
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT list_id 
      FROM list_shares 
      WHERE user_id = auth.uid() 
      AND permission = 'editor'
    )
  )
  WITH CHECK (
    id IN (
      SELECT list_id 
      FROM list_shares 
      WHERE user_id = auth.uid() 
      AND permission = 'editor'
    )
  );