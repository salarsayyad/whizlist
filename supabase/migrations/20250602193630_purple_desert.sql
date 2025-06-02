/*
  # Update user profile trigger function
  
  1. Changes
    - Drop existing trigger before function
    - Recreate improved trigger function
    - Add better error handling
    - Add ON CONFLICT handling
    
  2. Details
    - Ensures clean recreation of trigger function
    - Maintains proper dependency order
    - Improves profile creation reliability
*/

-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved trigger function
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();