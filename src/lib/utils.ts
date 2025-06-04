import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import FireCrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

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
    const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FireCrawl API key is not configured');
    }

    const app = new FireCrawlApp({ apiKey });

    const schema = z.object({
      product_name: z.string(),
      product_description: z.string().optional(),
      price: z.string().optional(),
      image_url: z.string().optional()
    });

    const extractResult = await app.extract([url], {
      prompt: "I need to extract the product name, product description, current price, and the main product image url for the main product on the page. Ignore everything else.",
      schema,
    });

    if (!extractResult || !extractResult[0]) {
      throw new Error('No data returned from extraction');
    }

    const data = extractResult[0];

    // Ensure product name exists and is not empty after trimming
    if (!data.product_name || !data.product_name.trim()) {
      throw new Error('Could not extract product title');
    }
    
    return {
      title: data.product_name.trim(),
      description: data.product_description || '',
      imageUrl: data.image_url || null,
      price: data.price || null,
      productUrl: url,
      isPinned: false,
      tags: []
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw error;
  }
}