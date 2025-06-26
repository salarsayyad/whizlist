/**
 * Utility functions for username validation and generation
 */

import { supabase } from './supabase';

/**
 * Generates a slug from a full name
 */
export function generateUsernameFromName(fullName: string): string {
  if (!fullName) return '';
  
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 30); // Limit to 30 characters
}

/**
 * Validates username format
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Username must be 30 characters or less' };
  }

  if (!/^[a-z][a-z0-9-]*$/.test(username)) {
    return { isValid: false, error: 'Username must start with a letter and contain only lowercase letters, numbers, and hyphens' };
  }

  if (username.endsWith('-')) {
    return { isValid: false, error: 'Username cannot end with a hyphen' };
  }

  if (username.includes('--')) {
    return { isValid: false, error: 'Username cannot contain consecutive hyphens' };
  }

  return { isValid: true };
}

/**
 * Checks if a username is available
 */
export async function checkUsernameAvailability(username: string): Promise<{ isAvailable: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', username)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { isAvailable: !data };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return { 
      isAvailable: false, 
      error: 'Unable to check username availability. Please try again.' 
    };
  }
}

/**
 * Generates a unique username suggestion based on a base username
 */
export async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const { isAvailable } = await checkUsernameAvailability(username);
    
    if (isAvailable) {
      return username;
    }

    // Try with a number suffix
    username = `${baseUsername}-${counter}`;
    counter++;

    // Prevent infinite loop
    if (counter > 999) {
      // Fallback to random suffix
      const randomSuffix = Math.floor(Math.random() * 10000);
      return `${baseUsername}-${randomSuffix}`;
    }
  }
}

/**
 * Updates user's username in the database
 */
export async function updateUsername(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating username:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update username' 
    };
  }
}