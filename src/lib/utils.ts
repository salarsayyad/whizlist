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
    const { data, error } = await supabase.functions.invoke('extract-metadata', {
      body: { url }
    });

    if (error) {
      throw new Error(`Error calling extract-metadata function: ${error.message}`);
    }

    if (!data || !data.title) {
      throw new Error('Could not extract product details');
    }

    return {
      title: data.title.trim(),
      description: data.description || '',
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