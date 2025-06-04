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
    const { data, error } = await supabase.functions.invoke('extract-firecrawl', {
      body: { url }
    });
  
    if (error) throw error;
    // For now, return a basic product structure with just the URL
    // This can be enhanced later with metadata extraction if needed
    return {
      title: data.title, // Use the hostname as a temporary title
      description: data.description, // Use the full URL as the description for now
      imageUrl: null,
      price: data.price,
      productUrl: url,
      isPinned: false,
      tags: []
    };
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