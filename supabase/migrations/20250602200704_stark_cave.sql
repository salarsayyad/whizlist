/*
  # Fix Lists Table RLS Policies

  1. Changes
    - Drop existing problematic RLS policies for the lists table
    - Create new, optimized RLS policies that avoid recursion
    
  2. Security
    - Maintain same level of security but with more efficient policy definitions
    - Policies cover all necessary access patterns:
      - Owners have full access
      - Public lists are viewable by authenticated users
      - Shared lists are accessible based on list_shares permissions
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "owners_full_access" ON lists;
DROP POLICY IF EXISTS "public_lists_viewable" ON lists;
DROP POLICY IF EXISTS "shared_users_select" ON lists;
DROP POLICY IF EXISTS "shared_users_update" ON lists;

-- Create new optimized policies
CREATE POLICY "enable_full_access_for_owners"
ON lists
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "enable_select_for_public_lists"
ON lists
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "enable_select_for_shared_users"
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

CREATE POLICY "enable_update_for_editors"
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.list_id = id
    AND list_shares.user_id = auth.uid()
    AND list_shares.permission = 'editor'
  )
);