/*
  # Fix Lists RLS Policies

  1. Changes
    - Remove recursive policies from lists table
    - Rewrite policies to avoid circular dependencies
    - Simplify policy conditions for better performance
  
  2. Security
    - Maintain existing security model
    - Ensure proper access control for all operations
    - Policies cover all necessary use cases:
      * Owner access
      * Public list access
      * Shared list access
      * Editor permissions
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "lists_editor_update" ON "public"."lists";
DROP POLICY IF EXISTS "lists_owner_delete" ON "public"."lists";
DROP POLICY IF EXISTS "lists_owner_insert" ON "public"."lists";
DROP POLICY IF EXISTS "lists_owner_select" ON "public"."lists";
DROP POLICY IF EXISTS "lists_owner_update" ON "public"."lists";
DROP POLICY IF EXISTS "lists_public_select" ON "public"."lists";
DROP POLICY IF EXISTS "lists_shared_select" ON "public"."lists";

-- Recreate policies without recursive dependencies
-- Owner policies
CREATE POLICY "enable_owner_all" ON "public"."lists"
FOR ALL 
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Public access policy
CREATE POLICY "enable_public_read" ON "public"."lists"
FOR SELECT 
TO authenticated
USING (is_public = true);

-- Shared access policies
CREATE POLICY "enable_shared_read" ON "public"."lists"
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM list_shares
    WHERE list_shares.list_id = id 
    AND list_shares.user_id = auth.uid()
  )
);

CREATE POLICY "enable_shared_update" ON "public"."lists"
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