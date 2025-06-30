import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';
import { useProductStore } from '../store/productStore';
import { uploadImageFromUrl } from './imageUpload';

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
    // First try extract-gpt for quick initial data
    let initialProduct;
    
    try {
      const { data: gptData, error: gptError } = await supabase.functions.invoke('extract-gpt', {
        body: { 
          url,
          fields: [
            { name: 'title', type: 'string', description: 'Product title or name' },
            { name: 'description', type: 'string', description: 'Product description' },
            { name: 'price', type: 'string', description: 'Product price with currency symbol' },
            { name: 'image_url', type: 'string', description: 'Main product image URL' }
          ]
        }
      });

      if (gptError) {
        console.warn('GPT extraction failed, using fallback data:', gptError);
        throw gptError;
      }

      // Initial product data from GPT
      initialProduct = {
        title: gptData?.data?.title || new URL(url).hostname,
        description: gptData?.data?.description || url,
        price: gptData?.data?.price || null,
        imageUrl: gptData?.data?.image_url || null,
        productUrl: url,
        isPinned: false,
        tags: []
      };
    } catch (gptError) {
      console.warn('GPT extraction failed, using minimal fallback data:', gptError);
      
      // Fallback to minimal product data if GPT extraction fails
      initialProduct = {
        title: new URL(url).hostname,
        description: url,
        price: null,
        imageUrl: null,
        productUrl: url,
        isPinned: false,
        tags: []
      };
    }

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
            let finalImageUrl = firecrawlData.image_url || initialProduct.imageUrl;

            // If we have an image URL, upload it to Supabase Storage
            if (finalImageUrl && finalImageUrl.startsWith('http')) {
              try {
                const { user } = await supabase.auth.getUser();
                if (user.data.user) {
                  const uploadResult = await uploadImageFromUrl(
                    finalImageUrl,
                    productId,
                    user.data.user.id
                  );

                  if (uploadResult.success && uploadResult.url) {
                    finalImageUrl = uploadResult.url;
                  }
                }
              } catch (uploadError) {
                console.warn('Failed to upload image to storage, using original URL:', uploadError);
                // Continue with original URL if upload fails
              }
            }

            // Update the product with enhanced details
            const { data: updatedProduct, error: updateError } = await supabase
              .from('products')
              .update({
                title: firecrawlData.title || initialProduct.title,
                description: firecrawlData.description || initialProduct.description,
                price: firecrawlData.price || initialProduct.price,
                image_url: finalImageUrl
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
    
    // Even if everything fails, provide a minimal fallback
    try {
      const fallbackProduct = {
        title: new URL(url).hostname,
        description: url,
        price: null,
        imageUrl: null,
        productUrl: url,
        isPinned: false,
        tags: []
      };

      return {
        product: fallbackProduct,
        updateDetails: async (productId: string) => {
          // Still attempt Firecrawl extraction even if initial extraction failed
          try {
            useProductStore.getState().setExtracting(productId, true);

            const { data: firecrawlData, error: firecrawlError } = await supabase.functions.invoke('extract-firecrawl', {
              body: { url }
            });

            if (!firecrawlError && firecrawlData) {
              let finalImageUrl = firecrawlData.image_url;

              // If we have an image URL, upload it to Supabase Storage
              if (finalImageUrl && finalImageUrl.startsWith('http')) {
                try {
                  const { user } = await supabase.auth.getUser();
                  if (user.data.user) {
                    const uploadResult = await uploadImageFromUrl(
                      finalImageUrl,
                      productId,
                      user.data.user.id
                    );

                    if (uploadResult.success && uploadResult.url) {
                      finalImageUrl = uploadResult.url;
                    }
                  }
                } catch (uploadError) {
                  console.warn('Failed to upload image to storage, using original URL:', uploadError);
                }
              }

              // Update the product with enhanced details
              const { data: updatedProduct, error: updateError } = await supabase
                .from('products')
                .update({
                  title: firecrawlData.title || fallbackProduct.title,
                  description: firecrawlData.description || fallbackProduct.description,
                  price: firecrawlData.price || fallbackProduct.price,
                  image_url: finalImageUrl
                })
                .eq('id', productId)
                .select()
                .single();

              if (!updateError && updatedProduct) {
                useProductStore.getState().updateProductInStore(mapDbProductToUiProduct(updatedProduct));
              }
            }
          } catch (firecrawlError) {
            console.warn('Firecrawl extraction also failed:', firecrawlError);
          } finally {
            useProductStore.getState().setExtracting(productId, false);
          }
        }
      };
    } catch (urlError) {
      // If even URL parsing fails, throw a user-friendly error
      throw new Error('Please enter a valid product URL starting with http:// or https://');
    }
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
    listId: dbProduct.list_id,
    ownerId: dbProduct.owner_id,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at
  };
}