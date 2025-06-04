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

async function invokeEdgeFunction(functionName: string, payload: any, retries = 2) {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
}

export async function extractProductDetails(url: string) {
  try {
    let productData;
    
    // Try extract-metadata first
    try {
      productData = await invokeEdgeFunction('extract-metadata', { url });
    } catch (metaError) {
      console.warn('Metadata extraction failed, trying firecrawl:', metaError);
      
      // Fallback to extract-firecrawl
      try {
        productData = await invokeEdgeFunction('extract-firecrawl', { url });
      } catch (firecrawlError) {
        console.error('Both extraction methods failed:', firecrawlError);
        throw new Error('Product extraction failed. Please try again or enter details manually.');
      }
    }

    // Create initial product with available data
    const initialProduct = {
      title: productData?.title || new URL(url).hostname,
      description: productData?.description || '',
      price: productData?.price || null,
      imageUrl: productData?.imageUrl || productData?.image_url || null,
      productUrl: url,
      isPinned: false,
      tags: []
    };

    return {
      product: initialProduct,
      updateDetails: async (productId: string) => {
        try {
          useProductStore.getState().setExtracting(productId, true);

          // Try to get enhanced details if initial extraction was basic
          if (!productData?.price || !productData?.imageUrl) {
            const enhancedData = await invokeEdgeFunction('extract-firecrawl', { url })
              .catch(() => null);

            if (enhancedData) {
              const { data: updatedProduct, error: updateError } = await supabase
                .from('products')
                .update({
                  title: enhancedData.title || initialProduct.title,
                  description: enhancedData.description || initialProduct.description,
                  price: enhancedData.price || initialProduct.price,
                  image_url: enhancedData.image_url || initialProduct.imageUrl
                })
                .eq('id', productId)
                .select()
                .single();

              if (!updateError && updatedProduct) {
                useProductStore.getState().updateProductInStore(mapDbProductToUiProduct(updatedProduct));
              }
            }
          }
        } catch (error) {
          console.error('Error updating product details:', error);
        } finally {
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