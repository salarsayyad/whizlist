/*
  # Fix recursive folder policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify folder access policies to prevent recursion
    - Maintain security while fixing performance issues

  2. Security Updates
    - Rewrite folder access policies to be more efficient
    - Maintain same level of security without recursive checks
    - Ensure proper access control for public and shared folders
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable all actions for owners" ON folders;
DROP POLICY IF EXISTS "Enable read for public folders" ON folders;
DROP POLICY IF EXISTS "Enable read for shared users" ON folders;
DROP POLICY IF EXISTS "Enable update for editors" ON folders;
DROP POLICY IF EXISTS "folders_editor_update" ON folders;
DROP POLICY IF EXISTS "folders_owner_all" ON folders;
DROP POLICY IF EXISTS "folders_public_select" ON folders;
DROP POLICY IF EXISTS "folders_shared_select" ON folders;

-- Create new, simplified policies
CREATE POLICY "folders_owner_access"
ON folders
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "folders_public_access"
ON folders
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "folders_shared_access"
ON folders
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "folders_editor_update"
ON folders
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  )
)
WITH CHECK (
  id IN (
    SELECT folder_id 
    FROM folder_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  )
);