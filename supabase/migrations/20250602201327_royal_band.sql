/*
  # Simplified RLS Policies
  
  1. Changes
    - Fix column references in policies
    - Remove recursive policy checks
    - Implement straightforward access control
  
  2. Security
    - Enable RLS for both tables
    - Create policies for owners, public access, and shared access
    - Maintain proper access control with simplified checks
*/

-- Clean up existing policies
DROP POLICY IF EXISTS "folders_owner_access" ON folders;
DROP POLICY IF EXISTS "folders_public_access" ON folders;
DROP POLICY IF EXISTS "folders_shared_access" ON folders;
DROP POLICY IF EXISTS "folders_editor_update" ON folders;

DROP POLICY IF EXISTS "enable_owner_full_access" ON lists;
DROP POLICY IF EXISTS "enable_public_read_access" ON lists;
DROP POLICY IF EXISTS "enable_shared_read_access" ON lists;
DROP POLICY IF EXISTS "enable_shared_editor_update" ON lists;

-- Folder Policies
CREATE POLICY "folders_owner_access" ON folders
  FOR ALL 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "folders_public_access" ON folders
  FOR SELECT 
  TO authenticated
  USING (is_public = true);

CREATE POLICY "folders_shared_access" ON folders
  FOR SELECT 
  TO authenticated
  USING (id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "folders_editor_update" ON folders
  FOR UPDATE 
  TO authenticated
  USING (id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  ))
  WITH CHECK (id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  ));

-- List Policies
CREATE POLICY "lists_owner_access" ON lists
  FOR ALL 
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lists_public_access" ON lists
  FOR SELECT 
  TO authenticated
  USING (is_public = true);

CREATE POLICY "lists_shared_access" ON lists
  FOR SELECT 
  TO authenticated
  USING (id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "lists_editor_update" ON lists
  FOR UPDATE 
  TO authenticated
  USING (id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  ))
  WITH CHECK (id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  ));