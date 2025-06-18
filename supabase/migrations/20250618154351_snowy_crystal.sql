/*
  # Add list_id column to products table

  1. Schema Changes
    - Add `list_id` column to `products` table
      - Type: uuid (nullable)
      - Foreign key reference to `lists.id`
      - Default: null
      - ON DELETE SET NULL (if list is deleted, product remains but loses list association)

  2. Security
    - No RLS policy changes needed as existing product policies will handle access control

  3. Notes
    - This allows products to optionally belong to a specific list
    - Products can exist without being assigned to any list (list_id = null)
    - If a list is deleted, associated products will have their list_id set to null
*/

-- Add list_id column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'list_id'
  ) THEN
    ALTER TABLE products ADD COLUMN list_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_list_id_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_list_id_fkey 
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS products_list_id_idx ON products(list_id);