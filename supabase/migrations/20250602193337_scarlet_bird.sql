/*
  # Update profile policies
  
  1. Changes
    - Add RLS policies for profiles table with existence checks
    - Ensure policies exist for insert, update, and select operations
  
  2. Security
    - Maintains existing RLS security model
    - Allows authenticated and anonymous users to insert during signup
    - Restricts updates to authenticated users
    - Allows public profile viewing
*/

DO $$ BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
END $$;

-- Recreate policies
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by everyone"
ON profiles
FOR SELECT
TO authenticated, anon
USING (true);