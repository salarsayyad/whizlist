/*
  # Fix recursive RLS policies for folders table

  1. Changes
    - Drop existing RLS policies for folders table
    - Create new, simplified RLS policies that avoid recursion
    
  2. Security
    - Enable RLS on folders table
    - Add policies for:
      - Owners can do everything
      - Shared users can view folders shared with them
      - Public folders are viewable by authenticated users
      - Editors can update folders
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for folder owners" ON folders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON folders;
DROP POLICY IF EXISTS "Enable read access for owned folders" ON folders;
DROP POLICY IF EXISTS "Enable read access for public folders" ON folders;
DROP POLICY IF EXISTS "Enable read access for shared folders" ON folders;
DROP POLICY IF EXISTS "Enable update for folder editors" ON folders;
DROP POLICY IF EXISTS "Enable update for folder owners" ON folders;

-- Create new, simplified policies
CREATE POLICY "Enable all actions for owners"
ON folders
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable read for shared users"
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

CREATE POLICY "Enable read for public folders"
ON folders
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Enable update for editors"
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