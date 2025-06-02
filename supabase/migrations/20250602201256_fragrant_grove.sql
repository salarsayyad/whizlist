/*
  # Simplified RLS Policies

  1. Changes
    - Removes all existing policies
    - Creates new simplified policies for folders and lists
    - Avoids recursive checks
    - Maintains security model

  2. Security
    - Owners have full access to their content
    - Public items are readable by authenticated users
    - Shared items are accessible based on permissions
    - Editor permissions for updates
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
  USING (folder_id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "folders_editor_update" ON folders
  FOR UPDATE 
  TO authenticated
  USING (folder_id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  ))
  WITH CHECK (folder_id IN (
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
  USING (list_id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "lists_editor_update" ON lists
  FOR UPDATE 
  TO authenticated
  USING (list_id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  ))
  WITH CHECK (list_id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  ));