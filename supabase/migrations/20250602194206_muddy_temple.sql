/*
  # Fix recursive RLS policies for lists table

  1. Changes
    - Drop existing problematic policies on lists table
    - Create new, optimized policies without recursion
    
  2. Security
    - Maintain same level of security but with better performance
    - Policies ensure users can only access lists they own or have been shared with
    - Public lists remain accessible to authenticated users
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable delete for list owners" ON lists;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lists;
DROP POLICY IF EXISTS "Enable read access for owned lists" ON lists;
DROP POLICY IF EXISTS "Enable read access for public lists" ON lists;
DROP POLICY IF EXISTS "Enable read access for shared lists" ON lists;
DROP POLICY IF EXISTS "Enable update for list editors" ON lists;
DROP POLICY IF EXISTS "Enable update for list owners" ON lists;

-- Create new optimized policies
CREATE POLICY "lists_select_policy" ON lists
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid() OR
  is_public = true OR
  id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "lists_insert_policy" ON lists
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lists_update_policy" ON lists
FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  )
)
WITH CHECK (
  owner_id = auth.uid() OR
  id IN (
    SELECT list_id 
    FROM list_shares 
    WHERE user_id = auth.uid() 
    AND permission = 'editor'
  )
);

CREATE POLICY "lists_delete_policy" ON lists
FOR DELETE TO authenticated
USING (owner_id = auth.uid());