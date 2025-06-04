import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';
import { useProductStore } from '../store/productStore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function extractProductDetails(url: string) {
  try {
    // Try firecrawl first as it's more reliable
    const { data: firecrawlData, error: firecrawlError } = await supabase.functions.invoke('extract-firecrawl', {
      body: { url },
      // Add timeout
      options: {
        timeout: 30000 // 30 seconds
      }
    });

    if (!firecrawlError && firecrawlData) {
      const product = {
        title: firecrawlData.title || new URL(url).hostname,
        description: firecrawlData.description || url,
        price: firecrawlData.price || null,
        imageUrl: firecrawlData.image_url || null,
        productUrl: url,
        isPinned: false,
        tags: []
      };

      return {
        product,
        updateDetails: async (productId: string) => {
          try {
            // Set extracting state
            useProductStore.getState().setExtracting(productId, true);

            // Try to get additional metadata for enhancement
            const { data: metaData, error: metaError } = await supabase.functions.invoke('extract-metadata', {
              body: { url },
              options: {
                timeout: 30000
              }
            });

            if (!metaError && metaData) {
              // Update the product with any additional details
              const { data: updatedProduct, error: updateError } = await supabase
                .from('products')
                .update({
                  title: product.title,
                  description: metaData.description || product.description,
                  image_url: metaData.imageUrl || product.imageUrl
                })
                .eq('id', productId)
                .select()
                .single();

              if (!updateError && updatedProduct) {
                useProductStore.getState().updateProductInStore(mapDbProductToUiProduct(updatedProduct));
              }
            }
          } catch (error) {
            console.error('Error updating product details:', error);
          } finally {
            useProductStore.getState().setExtracting(productId, false);
          }
        }
      };
    }

    // Fallback to metadata extraction if firecrawl fails
    const { data: metaData, error: metaError } = await supabase.functions.invoke('extract-metadata', {
      body: { url },
      options: {
        timeout: 30000
      }
    });

    if (metaError) {
      throw new Error('Failed to extract product details. Please try again.');
    }

    const product = {
      title: metaData.title || new URL(url).hostname,
      description: metaData.description || url,
      price: null,
      imageUrl: metaData.imageUrl || null,
      productUrl: url,
      isPinned: false,
      tags: []
    };

    return {
      product,
      updateDetails: async () => {} // No additional updates needed for fallback case
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL')) {
        throw new Error('Please enter a valid product URL starting with http:// or https://');
      }
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error occurred. Please check your internet connection and try again.');
      }
    }
    
    throw new Error('Could not extract product details. Please check if the product page is accessible and try again.');
  }
}

// Helper function to map database product to UI product
function mapDbProductToUiProduct(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    title: dbProduct.title,
    description: dbProduct.description,
    price: dbProduct.price,
    imageUrl: dbProduct.image_url,
    productUrl: dbProduct.product_url,
    isPinned: dbProduct.is_pinned || false,
    tags: dbProduct.tags || [],
    ownerId: dbProduct.owner_id,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at
  };
}