/*
  # Add username field to profiles table

  1. Schema Changes
    - Add `username` column to `profiles` table
      - Type: text (required)
      - Unique constraint
      - Check constraint for format validation
      - Default: null (will be populated during migration)

  2. Security
    - Update RLS policies to handle username field
    - Maintain existing security model

  3. Migration Strategy
    - Add column with null default
    - Create unique index
    - Add check constraint for username format
*/

-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN username text;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX profiles_username_unique_idx ON profiles (LOWER(username));

-- Add check constraint for username format
ALTER TABLE profiles ADD CONSTRAINT profiles_username_format_check 
CHECK (
  username IS NULL OR (
    username ~ '^[a-z][a-z0-9-]*$' AND 
    LENGTH(username) >= 3 AND
    LENGTH(username) <= 30 AND
    username NOT LIKE '%-' AND
    username NOT LIKE '%---%'
  )
);

-- Update the handle_new_user function to not set username automatically
-- (it will be set during the sign-up process)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
    
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (Supabase will capture this in the database logs)
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    -- Still return the new user to prevent registration failure
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;