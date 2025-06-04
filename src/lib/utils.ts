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

    // Call the Edge Function with proper error handling
    const { data, error } = await supabase.functions.invoke('extract-firecrawl', {
      body: JSON.stringify({ url }), // Ensure body is properly stringified
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      console.error('Extraction error:', error);
      if (error.message.includes('status code 500')) {
        throw new Error('Server error: The product extraction service is currently unavailable. Please ensure the FIRECRAWL_API_KEY is properly configured.');
      }
      throw new Error(`Failed to extract product details: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data received from the extraction service');
    }

    if (!data.title) {
      throw new Error('Could not extract product details from the provided URL');
    }

    // Map the extracted data to our product format
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
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('NetworkError')) {
        throw new Error('Network connection error. Please check your internet connection and try again.');
      } else if (error.message.includes('Failed to extract')) {
        throw new Error('Could not extract product details. Please check if the product page is accessible and try again.');
      } else if (error.message.includes('Invalid URL')) {
        throw new Error('Please enter a valid product URL starting with http:// or https://');
      } else if (error.message.includes('FIRECRAWL_API_KEY')) {
        throw new Error('Product extraction is currently unavailable. Please contact support.');
      }
      throw error;
    }
    
    throw new Error('An unexpected error occurred while extracting product details');
  }
}