/*
  # Make product_id nullable in comments table

  1. Changes
    - Alter the `product_id` column in the `comments` table to allow NULL values
    - This enables comments on folders and lists without requiring a product_id
    
  2. Security
    - No changes to RLS policies needed
    - Existing policies already handle entity-based access control
    
  3. Notes
    - This change maintains backward compatibility with existing product comments
    - The `entity_type` and `entity_id` columns are used for proper entity association
*/

-- Make product_id nullable to support comments on folders and lists
ALTER TABLE comments ALTER COLUMN product_id DROP NOT NULL;