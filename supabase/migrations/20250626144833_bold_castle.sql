/*
  # Add is_pinned column to lists table

  1. Changes
    - Add `is_pinned` column to `lists` table with boolean type and default false
  
  2. Security
    - No RLS changes needed as existing policies will cover the new column
*/

-- Add is_pinned column to lists table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lists' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE lists ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;
END $$;