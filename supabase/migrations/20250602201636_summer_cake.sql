/*
  # Simplify RLS policies
  
  1. Changes
    - Remove all sharing and public access policies
    - Implement simple owner-only access policies
    - Clean up existing complex policies
  
  2. Security
    - Enable RLS on both tables
    - Users can only access their own folders and lists
    - All operations (SELECT, INSERT, UPDATE, DELETE) restricted to owners
*/

-- Clean up existing policies
DROP POLICY IF EXISTS "folders_owner_access" ON folders;
DROP POLICY IF EXISTS "folders_public_access" ON folders;
DROP POLICY IF EXISTS "folders_shared_access" ON folders;
DROP POLICY IF EXISTS "folders_editor_update" ON folders;

DROP POLICY IF EXISTS "enable_owner_full_access" ON lists;
DROP POLICY IF EXISTS "enable_shared_read_access" ON lists;
DROP POLICY IF EXISTS "enable_shared_update_access" ON lists;
DROP POLICY IF EXISTS "lists_owner_access" ON lists;
DROP POLICY IF EXISTS "lists_public_access" ON lists;
DROP POLICY IF EXISTS "lists_shared_access" ON lists;
DROP POLICY IF EXISTS "lists_editor_update" ON lists;

-- Simple folder policy: owner-only access
CREATE POLICY "folders_owner_access" ON folders
  FOR ALL 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Simple list policy: owner-only access
CREATE POLICY "lists_owner_access" ON lists
  FOR ALL 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());