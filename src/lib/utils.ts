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
        urls: [url],
        prompt: "Extract the product name, description, price, and main image URL from the page.",
        schema: {
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          price: {
            type: "string"
          },
          imageUrl: {
            type: "string"
          }
        }
      }),
    });

    const responseJson = await response.json();

    if (!response.ok || !responseJson.success) {
      throw new Error(responseJson.error || responseJson.details || 'Failed to extract metadata');
    }

    if (!responseJson.data) {
      throw new Error(`No data returned from metadata extraction: ${data}`);
    }

    const { data } = responseJson.data;

    // Ensure title exists and is not empty after trimming
    if (!data.title || !data.title.trim()) {
      throw new Error(`Could not extract product title ${data}`);
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