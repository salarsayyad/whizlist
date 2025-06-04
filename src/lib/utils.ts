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
    // First try extract-metadata for quick initial data
    const { data: metaData, error: metaError } = await supabase.functions.invoke('extract-metadata', {
      body: { url }
    });

    if (metaError) {
      console.warn('Metadata extraction failed:', metaError);
      throw metaError;
    }

    // Initial product data from metadata
    const initialProduct = {
      title: metaData.title || new URL(url).hostname,
      description: metaData.description || url,
      price: null,
      imageUrl: metaData.imageUrl || null,
      productUrl: url,
      isPinned: false,
      tags: []
    };

    return {
      product: initialProduct,
      updateDetails: async (productId: string) => {
        try {
          // Set extracting state
          useProductStore.getState().setExtracting(productId, true);

          const { data: firecrawlData, error: firecrawlError } = await supabase.functions.invoke('extract-firecrawl', {
            body: { url }
          });

          if (firecrawlError) {
            console.warn('Firecrawl extraction failed:', firecrawlError);
            return;
          }

          if (firecrawlData) {
            // Update the product with enhanced details
            const { data: updatedProduct, error: updateError } = await supabase
              .from('products')
              .update({
                title: firecrawlData.title || initialProduct.title,
                description: firecrawlData.description || initialProduct.description,
                price: firecrawlData.price || initialProduct.price,
                image_url: firecrawlData.image_url || initialProduct.imageUrl
              })
              .eq('id', productId)
              .select()
              .single();

            if (updateError) {
              console.error('Failed to update product with enhanced details:', updateError);
            } else if (updatedProduct) {
              // Update the store with the new product details
              useProductStore.getState().updateProductInStore(mapDbProductToUiProduct(updatedProduct));
            }
          }
        } catch (error) {
          console.error('Error updating product details:', error);
        } finally {
          // Clear extracting state
          useProductStore.getState().setExtracting(productId, false);
        }
      }
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL')) {
        throw new Error('Please enter a valid product URL starting with http:// or https://');
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