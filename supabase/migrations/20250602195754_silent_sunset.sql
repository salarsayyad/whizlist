/*
  # Fix recursive RLS policies for lists table

  1. Changes
    - Drop existing problematic policies on lists table
    - Create new, optimized policies without recursion:
      - Owner access policy
      - Public lists access policy
      - Shared lists access policy
      - Editor update policy
  
  2. Security
    - Maintains RLS protection
    - Simplifies policy logic to prevent recursion
    - Preserves all necessary access controls
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable read access for owned lists" ON lists;
DROP POLICY IF EXISTS "Enable read access for public lists" ON lists;
DROP POLICY IF EXISTS "Enable read access for shared lists" ON lists;
DROP POLICY IF EXISTS "Enable update for list editors" ON lists;
DROP POLICY IF EXISTS "Enable update for list owners" ON lists;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lists;
DROP POLICY IF EXISTS "Enable delete for list owners" ON lists;

-- Create new, optimized policies
CREATE POLICY "lists_owner_select" ON lists
FOR SELECT TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "lists_public_select" ON lists
FOR SELECT TO authenticated
USING (is_public = true);

CREATE POLICY "lists_shared_select" ON lists
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.list_id = lists.id
    AND list_shares.user_id = auth.uid()
  )
);

CREATE POLICY "lists_owner_insert" ON lists
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lists_owner_update" ON lists
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lists_editor_update" ON lists
FOR UPDATE TO authenticated
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

CREATE POLICY "lists_owner_delete" ON lists
FOR DELETE TO authenticated
USING (owner_id = auth.uid());