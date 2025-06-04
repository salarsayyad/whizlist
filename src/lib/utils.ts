import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

interface ProductField {
  name: string;
  description: string;
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  selector?: string;
  fallbackSelectors?: string[];
}

export async function extractProductDetails(url: string) {
  try {
    // Define the fields to extract with detailed selectors and fallbacks
    const fields: ProductField[] = [
      {
        name: 'title',
        description: 'Product name/title',
        dataType: 'string',
        required: true,
        selector: 'h1',
        fallbackSelectors: [
          'title',
          '[itemprop="name"]',
          '.product-title',
          '.product-name',
          '#product-title'
        ]
      },
      {
        name: 'description',
        description: 'Product description',
        dataType: 'string',
        selector: '[itemprop="description"]',
        fallbackSelectors: [
          'meta[name="description"]',
          '.product-description',
          '#product-description',
          '.description'
        ]
      },
      {
        name: 'price',
        description: 'Current price of the product',
        dataType: 'string',
        selector: '[itemprop="price"]',
        fallbackSelectors: [
          '.price',
          '.product-price',
          '#product-price',
          '[class*="price"]'
        ]
      },
      {
        name: 'imageUrl',
        description: 'Main product image URL',
        dataType: 'string',
        selector: '[itemprop="image"]',
        fallbackSelectors: [
          'meta[property="og:image"]',
          '.product-image img',
          '#product-image img',
          '.gallery img:first-child'
        ]
      }
    ];

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-hyperbrowser`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        fields,
        options: {
          // Additional extraction options
          waitForSelectors: fields.map(f => f.selector).filter(Boolean),
          timeout: 30000,
          retries: 2
        }
      }),
    });

    const responseData = await response.json();

    if (!responseData.success) {
      throw new Error(responseData.error || 'Failed to extract metadata');
    }

    const { data } = responseData;

    // Check if title exists and is not empty after trimming
    if (!data.title || !data.title.trim()) {
      throw new Error('Could not extract product title');
    }
    
    return {
      title: data.title.trim(),
      description: data.description || '',
      imageUrl: data.imageUrl || null,
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