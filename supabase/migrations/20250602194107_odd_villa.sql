/*
  # Fix Lists RLS Policies

  1. Changes
    - Remove existing problematic RLS policies for lists table
    - Add new, optimized RLS policies that avoid recursion
    
  2. Security
    - Enable RLS on lists table
    - Add policies for:
      - Viewing lists (owned, shared, or public)
      - Creating lists (authenticated users)
      - Updating lists (owners and editors)
      - Deleting lists (owners only)
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own lists and shared lists" ON lists;
DROP POLICY IF EXISTS "Users can create lists" ON lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON lists;

-- Create new, optimized policies
CREATE POLICY "Enable read access for owned lists"
ON lists
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Enable read access for shared lists"
ON lists
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.list_id = id
    AND list_shares.user_id = auth.uid()
  )
);

CREATE POLICY "Enable read access for public lists"
ON lists
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Enable insert for authenticated users"
ON lists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Enable update for list owners"
ON lists
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable update for list editors"
ON lists
FOR UPDATE
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
ON lists
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());