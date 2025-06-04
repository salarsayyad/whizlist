import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

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
      console.warn('GPT extraction failed:', gptError);
      throw gptError;
    }

    // Initial product data from GPT
    const initialProduct = {
      title: gptData?.data?.title || new URL(url).hostname,
      description: gptData?.data?.description || url,
      price: gptData?.data?.price || null,
      imageUrl: gptData?.data?.image_url || null,
      productUrl: url,
      isPinned: false,
      tags: []
    };

    return {
      product: initialProduct,
      updateDetails: async (productId: string) => {
        try {
          const { data: firecrawlData, error: firecrawlError } = await supabase.functions.invoke('extract-firecrawl', {
            body: { url }
          });

          if (firecrawlError) {
            console.warn('Firecrawl extraction failed:', firecrawlError);
            return;
          }

          if (firecrawlData) {
            // Update the product with enhanced details
            const { error: updateError } = await supabase
              .from('products')
              .update({
                title: firecrawlData.title || initialProduct.title,
                description: firecrawlData.description || initialProduct.description,
                price: firecrawlData.price || initialProduct.price,
                image_url: firecrawlData.image_url || initialProduct.imageUrl
              })
              .eq('id', productId);

            if (updateError) {
              console.error('Failed to update product with enhanced details:', updateError);
            }
          }
        } catch (error) {
          console.error('Error updating product details:', error);
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