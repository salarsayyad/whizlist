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

export async function extractProductDetails(url: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-hyperbrowser`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        fields: [
          {
            name: 'title',
            description: 'Product name/title',
            dataType: 'string'
          },
          {
            name: 'description',
            description: 'Full product description',
            dataType: 'string'
          },
          {
            name: 'price',
            description: 'Current price of the product',
            dataType: 'string'
          },
          {
            name: 'imageUrl',
            description: 'URL of the main/primary product image',
            dataType: 'string'
          },
          {
            name: 'features',
            description: 'List of product features or highlights',
            dataType: 'array',
            arrayItemType: 'string'
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract metadata');
    }

    const { data, success } = await response.json();
    
    if (!success || !data) {
      throw new Error('Failed to extract product data');
    }

    // Ensure title is never null
    if (!data.title) {
      throw new Error('Could not extract product title');
    }

    return {
      title: data.title.trim(),
      description: data.description || '',
      imageUrl: data.imageUrl || null,
      price: data.price || null,
      productUrl: url,
      isPinned: false,
      tags: data.features || [], // Use extracted features as initial tags
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw error;
  }
}