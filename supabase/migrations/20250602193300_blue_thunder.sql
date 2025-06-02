/*
  # Add RLS policies for profiles table

  1. Changes
    - Add RLS policies for the profiles table to allow:
      - Public read access to all profiles
      - Users to insert their own profile during signup
      - Users to update their own profile
      - Users to read their own profile
  
  2. Security
    - Enable RLS on profiles table (if not already enabled)
    - Add policies for INSERT, UPDATE, and SELECT operations
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to read any profile (needed for public features)
CREATE POLICY "Profiles are viewable by everyone"
ON profiles
FOR SELECT
TO authenticated, anon
USING (true);