/*
  # Fix Lists RLS Policies

  1. Changes
    - Remove existing RLS policies that may cause recursion
    - Create new, simplified RLS policies for the lists table
    - Policies are designed to avoid circular references while maintaining security

  2. Security
    - Enable RLS on lists table (in case it was disabled)
    - Add policies for:
      - Owners can do everything
      - Shared users can view lists shared with them
      - Public lists are viewable by authenticated users
      - Editors can update lists
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "enable_full_access_for_owners" ON lists;
DROP POLICY IF EXISTS "enable_select_for_public_lists" ON lists;
DROP POLICY IF EXISTS "enable_select_for_shared_users" ON lists;
DROP POLICY IF EXISTS "enable_update_for_editors" ON lists;

-- Ensure RLS is enabled
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies

-- 1. Owner has full access
CREATE POLICY "lists_owner_all"
ON lists
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 2. Public lists are viewable by authenticated users
CREATE POLICY "lists_public_select"
ON lists
FOR SELECT
TO authenticated
USING (is_public = true);

-- 3. Shared users can view lists shared with them
CREATE POLICY "lists_shared_select"
ON lists
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.list_id = lists.id
    AND list_shares.user_id = auth.uid()
  )
);

-- 4. Users with editor permission can update lists
CREATE POLICY "lists_editor_update"
ON lists
FOR UPDATE
TO authenticated
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