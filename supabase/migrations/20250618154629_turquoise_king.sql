/*
  # Update Foreign Key Constraints for Cascade Deletion

  1. Changes
    - Update lists.folder_id foreign key to CASCADE on delete
    - Update products.list_id foreign key to CASCADE on delete
    
  2. Behavior
    - When a folder is deleted, all lists in that folder are deleted
    - When a list is deleted, all products in that list are deleted
    
  3. Safety
    - Drop existing constraints first
    - Add new constraints with CASCADE behavior
*/

-- Drop existing foreign key constraints
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_folder_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_list_id_fkey;

-- Add new foreign key constraints with CASCADE deletion
ALTER TABLE lists 
ADD CONSTRAINT lists_folder_id_fkey 
FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE;

ALTER TABLE products 
ADD CONSTRAINT products_list_id_fkey 
FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE;