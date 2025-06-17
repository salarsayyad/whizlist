/*
  # Add foreign key relationship between comments and profiles

  1. Database Changes
    - Add foreign key constraint linking comments.user_id to profiles.id
    - This allows Supabase to resolve the relationship when joining comments with profiles

  2. Security
    - No changes to existing RLS policies
    - Maintains current security model

  This migration fixes the Supabase query error by establishing the missing foreign key relationship
  that allows joining comments with profiles directly.
*/

-- Add foreign key constraint between comments.user_id and profiles.id
-- Since both reference users.id, this creates a direct relationship
DO $$
BEGIN
  -- Check if the foreign key constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comments_user_id_profiles_fkey' 
    AND table_name = 'comments'
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT comments_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;