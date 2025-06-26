import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Downloads an image from a URL and uploads it to Supabase Storage
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  productId: string,
  userId: string
): Promise<ImageUploadResult> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Get file extension from URL or content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = getFileExtension(imageUrl, contentType);
    
    // Create a unique filename
    const fileName = `${userId}/${productId}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, blob, {
        contentType,
        upsert: true // Replace if exists
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Uploads a file directly to Supabase Storage
 */
export async function uploadImageFile(
  file: File,
  productId: string,
  userId: string
): Promise<ImageUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image must be smaller than 5MB');
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${productId}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true // Replace if exists
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    console.error('Error uploading image file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteProductImage(
  productId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // List all files for this product (in case there are multiple extensions)
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list(`${userId}`, {
        search: productId
      });

    if (listError) {
      throw listError;
    }

    if (!files || files.length === 0) {
      return { success: true }; // No files to delete
    }

    // Delete all matching files
    const filesToDelete = files
      .filter(file => file.name.startsWith(productId))
      .map(file => `${userId}/${file.name}`);

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove(filesToDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error deleting product image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get file extension from URL or content type
 */
function getFileExtension(url: string, contentType: string): string {
  // Try to get extension from URL
  const urlExtension = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExtension)) {
    return urlExtension;
  }

  // Fallback to content type
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}