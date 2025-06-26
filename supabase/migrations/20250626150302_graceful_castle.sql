/*
  # Create Storage Bucket for Product Images

  1. Storage Setup
    - Create 'product-images' bucket for storing product images
    - Enable public access for images
    - Set up RLS policies for bucket access

  2. Security
    - Users can upload images for their own products
    - Images are publicly readable
    - Users can delete their own product images
*/

-- Create the storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Users can view product images"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'product-images');

CREATE POLICY "Users can update their own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);