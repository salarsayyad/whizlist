/*
  # Fix folders RLS policies

  1. Changes
    - Drop existing RLS policies for folders table
    - Create new, optimized RLS policies that avoid recursion
    
  2. Security
    - Enable RLS on folders table (maintained)
    - Add new policies for:
      - Viewing folders (owned, shared, or public)
      - Creating folders (authenticated users)
      - Updating folders (owners and editors)
      - Deleting folders (owners only)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;

-- Create new policies that avoid recursion
CREATE POLICY "Enable read access for owned folders"
ON folders FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
);

CREATE POLICY "Enable read access for public folders"
ON folders FOR SELECT
TO authenticated
USING (
  is_public = true
);

CREATE POLICY "Enable read access for shared folders"
ON folders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM folder_shares
    WHERE folder_shares.folder_id = folders.id
    AND folder_shares.user_id = auth.uid()
  )
);

CREATE POLICY "Enable insert for authenticated users"
ON folders FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
);

CREATE POLICY "Enable update for folder owners"
ON folders FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
)
WITH CHECK (
  owner_id = auth.uid()
);

CREATE POLICY "Enable update for folder editors"
ON folders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM folder_shares
    WHERE folder_shares.folder_id = folders.id
    AND folder_shares.user_id = auth.uid()
    AND folder_shares.permission = 'editor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM folder_shares
    WHERE folder_shares.folder_id = folders.id
    AND folder_shares.user_id = auth.uid()
    AND folder_shares.permission = 'editor'
  )
);

CREATE POLICY "Enable delete for folder owners"
ON folders FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
);