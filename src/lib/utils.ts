import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
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
  // In a real app, this would call a backend service to scrape the URL
  // For now, let's simulate a response after a short delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock response based on URL
  if (url.includes('amazon')) {
    return {
      title: 'Amazon Product',
      price: '$99.99',
      image: 'https://images.pexels.com/photos/1667088/pexels-photo-1667088.jpeg?auto=compress&cs=tinysrgb&w=600',
      description: 'This is a sample product description for an Amazon product.',
      url,
    };
  } else if (url.includes('etsy')) {
    return {
      title: 'Handmade Craft Item',
      price: '$45.00',
      image: 'https://images.pexels.com/photos/4041285/pexels-photo-4041285.jpeg?auto=compress&cs=tinysrgb&w=600',
      description: 'Beautiful handmade item with unique craftsmanship.',
      url,
    };
  } else {
    // Generic response for any other URL
    return {
      title: 'Product from the web',
      price: '$XX.XX',
      image: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=600',
      description: 'A product you saved from the web.',
      url,
    };
  }
}