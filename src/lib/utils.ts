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
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-metadata`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        fields: {
          title: { type: 'string', description: 'Product name/title' },
          description: { type: 'string', description: 'Full product description' },
          originalPrice: { type: 'string', description: 'Original/regular price of the product' },
          salePrice: { type: 'string', description: 'Current sale price if the product is discounted, null if not on sale' },
          imageUrl: { type: 'string', description: 'URL of the main/primary product image' }
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract metadata');
    }

    const { data } = await response.json();
    const { title, description, originalPrice, salePrice, imageUrl } = data;

    return {
      title,
      description,
      imageUrl,
      price: salePrice || originalPrice || null,
      productUrl: url,
      isPinned: false,
      tags: [],
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw error;
  }
}