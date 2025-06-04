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
    // Validate URL before making the request
    const validUrl = new URL(url);
    if (!validUrl.protocol.startsWith('http')) {
      throw new Error('Invalid URL format. Must start with http:// or https://');
    }

    const { data, error } = await supabase.functions.invoke('extract-firecrawl', {
      body: { url },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      if (error.message.includes('Failed to send')) {
        throw new Error('Unable to connect to the product extraction service. Please check your connection and try again.');
      }
      throw new Error(`Error extracting product details: ${error.message}`);
    }

    if (!data || !data.title) {
      throw new Error('Could not extract product details from the provided URL');
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
    if (error instanceof Error) {
      // Provide more user-friendly error messages
      if (error.message.includes('NetworkError')) {
        throw new Error('Network connection error. Please check your internet connection and try again.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred while extracting product details');
  }
}