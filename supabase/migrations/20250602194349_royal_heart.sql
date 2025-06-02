/*
  # Fix Lists RLS Policies

  1. Changes
    - Remove existing problematic RLS policies on lists table
    - Add new, simplified RLS policies that avoid recursion
    
  2. Security
    - Enable RLS on lists table
    - Add policies for:
      - Owners can do all operations
      - Shared users can view and edit based on list_shares
      - Public lists are viewable by all authenticated users
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "lists_select_policy" ON lists;
DROP POLICY IF EXISTS "lists_insert_policy" ON lists;
DROP POLICY IF EXISTS "lists_update_policy" ON lists;
DROP POLICY IF EXISTS "lists_delete_policy" ON lists;

-- Create new, simplified policies
CREATE POLICY "Enable read access for owned lists"
ON lists FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
);

CREATE POLICY "Enable read access for shared lists"
ON lists FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.list_id = id
    AND list_shares.user_id = auth.uid()
  )
);

CREATE POLICY "Enable read access for public lists"
ON lists FOR SELECT
TO authenticated
USING (
  is_public = true
);

CREATE POLICY "Enable insert for authenticated users"
ON lists FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
);

CREATE POLICY "Enable update for list owners"
ON lists FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
);

CREATE POLICY "Enable update for list editors"
ON lists FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.list_id = id
    AND list_shares.user_id = auth.uid()
    AND list_shares.permission = 'editor'
  )
);

CREATE POLICY "Enable delete for list owners"
ON lists FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
);