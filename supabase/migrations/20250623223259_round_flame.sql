/*
  # Add Comment Likes System

  1. New Tables
    - `comment_likes`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, references comments)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on comment_likes table
    - Add policies for:
      - Users can view likes on comments they can access
      - Users can create/delete their own likes
      - Prevent duplicate likes per user per comment

  3. Indexes
    - Add indexes for performance on comment_id and user_id
    - Add unique constraint to prevent duplicate likes
*/

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON comment_likes(user_id);

-- RLS Policies

-- Users can view likes on comments they can access
CREATE POLICY "Users can view likes on accessible comments"
  ON comment_likes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comments
      WHERE comments.id = comment_likes.comment_id
      AND (
        -- Product comments
        (comments.entity_type = 'product' AND EXISTS (
          SELECT 1 FROM products
          WHERE products.id = comments.entity_id
          AND products.owner_id = auth.uid()
        )) OR
        -- Folder comments
        (comments.entity_type = 'folder' AND EXISTS (
          SELECT 1 FROM folders
          WHERE folders.id = comments.entity_id
          AND (
            folders.owner_id = auth.uid() OR
            folders.is_public = true OR
            EXISTS (
              SELECT 1 FROM folder_shares
              WHERE folder_shares.folder_id = folders.id
              AND folder_shares.user_id = auth.uid()
            )
          )
        )) OR
        -- List comments
        (comments.entity_type = 'list' AND EXISTS (
          SELECT 1 FROM lists
          WHERE lists.id = comments.entity_id
          AND (
            lists.owner_id = auth.uid() OR
            lists.is_public = true OR
            EXISTS (
              SELECT 1 FROM list_shares
              WHERE list_shares.list_id = lists.id
              AND list_shares.user_id = auth.uid()
            )
          )
        ))
      )
    )
  );

-- Users can create their own likes
CREATE POLICY "Users can create their own likes"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM comments
      WHERE comments.id = comment_likes.comment_id
      AND (
        -- Product comments
        (comments.entity_type = 'product' AND EXISTS (
          SELECT 1 FROM products
          WHERE products.id = comments.entity_id
          AND products.owner_id = auth.uid()
        )) OR
        -- Folder comments
        (comments.entity_type = 'folder' AND EXISTS (
          SELECT 1 FROM folders
          WHERE folders.id = comments.entity_id
          AND (
            folders.owner_id = auth.uid() OR
            folders.is_public = true OR
            EXISTS (
              SELECT 1 FROM folder_shares
              WHERE folder_shares.folder_id = folders.id
              AND folder_shares.user_id = auth.uid()
            )
          )
        )) OR
        -- List comments
        (comments.entity_type = 'list' AND EXISTS (
          SELECT 1 FROM lists
          WHERE lists.id = comments.entity_id
          AND (
            lists.owner_id = auth.uid() OR
            lists.is_public = true OR
            EXISTS (
              SELECT 1 FROM list_shares
              WHERE list_shares.list_id = lists.id
              AND list_shares.user_id = auth.uid()
            )
          )
        ))
      )
    )
  );

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());