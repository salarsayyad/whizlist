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
          title: { type: 'string', description: 'Product title' },
          description: { type: 'string', description: 'Product description' },
          imageUrl: { type: 'string', description: 'Product image URL' },
          price: { type: 'string', description: 'Product price' }
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract metadata');
    }

    const { data } = await response.json();
    const { title, description, imageUrl, price } = data;

    return {
      title,
      description,
      imageUrl,
      price: price || null,
      productUrl: url,
      isPinned: false,
      tags: [],
    };
  } catch (error) {
    console.error('Error extracting product details:', error);
    throw error;
  }
}