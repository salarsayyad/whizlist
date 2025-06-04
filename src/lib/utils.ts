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
    // First try extract-metadata for quick initial data
    const { data: metaData, error: metaError } = await supabase.functions.invoke('extract-metadata', {
      body: { 
        url,
        fields: [
          { name: 'title', type: 'string', description: 'Product title or name' },
          { name: 'description', type: 'string', description: 'Product description' },
          { name: 'price', type: 'string', description: 'Product price' },
          { name: 'image_url', type: 'string', description: 'Main product image URL' }
        ]
      }
    });

    if (metaError) {
      console.warn('Metadata extraction failed:', metaError);
    }

    // Initial product data from metadata
    const initialProduct = {
      title: metaData?.data?.title || new URL(url).hostname,
      description: metaData?.data?.description || url,
      price: metaData?.data?.price || null,
      imageUrl: metaData?.data?.image_url || null,
      productUrl: url,
      isPinned: false,
      tags: []
    };

    // Start Firecrawl extraction asynchronously
    supabase.functions.invoke('extract-firecrawl', {
      body: { url }
    }).then(({ data: firecrawlData, error: firecrawlError }) => {
      if (firecrawlError) {
        console.warn('Firecrawl extraction failed:', firecrawlError);
        return;
      }

      // Just log the Firecrawl data instead of attempting to update
      if (firecrawlData) {
        console.log('Firecrawl data received:', firecrawlData);
      }
    });

    return initialProduct;
  } catch (error) {
    console.error('Error extracting product details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL')) {
        throw new Error('Please enter a valid product URL starting with http:// or https://');
      }
    }
    
    throw new Error('An unexpected error occurred while processing the URL');
  }
}