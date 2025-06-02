/*
  # Fix folders table RLS policies
  
  1. Changes
    - Remove existing RLS policies
    - Add new simplified policies for:
      - Owner access (all operations)
      - Shared access (read-only)
      - Public access (read-only)
      - Editor access (update)
  
  2. Security
    - Enable RLS on folders table
    - Policies follow principle of least privilege
    - Clear separation between different access levels
*/

DO $$ 
BEGIN
  -- Remove existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'folders' AND policyname = 'Enable delete for folder owners') THEN
    DROP POLICY "Enable delete for folder owners" ON public.folders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'folders' AND policyname = 'Enable insert for authenticated users') THEN
    DROP POLICY "Enable insert for authenticated users" ON public.folders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'folders' AND policyname = 'Enable read access for owned folders') THEN
    DROP POLICY "Enable read access for owned folders" ON public.folders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'folders' AND policyname = 'Enable read access for public folders') THEN
    DROP POLICY "Enable read access for public folders" ON public.folders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'folders' AND policyname = 'Enable read access for shared folders') THEN
    DROP POLICY "Enable read access for shared folders" ON public.folders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'folders' AND policyname = 'Enable update for folder editors') THEN
    DROP POLICY "Enable update for folder editors" ON public.folders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'folders' AND policyname = 'Enable update for folder owners') THEN
    DROP POLICY "Enable update for folder owners" ON public.folders;
  END IF;
END $$;

-- Create new policies one by one
CREATE POLICY "folders_owner_all"
ON public.folders
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "folders_shared_select"
ON public.folders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.folder_shares
    WHERE folder_shares.folder_id = folders.id
    AND folder_shares.user_id = auth.uid()
  )
);

CREATE POLICY "folders_public_select"
ON public.folders
FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "folders_editor_update"
ON public.folders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.folder_shares
    WHERE folder_shares.folder_id = folders.id
    AND folder_shares.user_id = auth.uid()
    AND folder_shares.permission = 'editor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.folder_shares
    WHERE folder_shares.folder_id = folders.id
    AND folder_shares.user_id = auth.uid()
    AND folder_shares.permission = 'editor'
  )
);