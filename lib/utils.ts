import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateEmail(email: string) {
  if (email.length < 3) {
    return false;
  }
  // Count the occurrences of '@' and '.'
  const atCount = (email.match(/@/g) || []).length;
  const dotCount = (email.match(/\./g) || []).length;

  // Check if there is exactly one '@' and at least one '.'
  if (atCount === 1 && dotCount >= 1) {
    // Check if '.' comes after '@'
    if (email.indexOf('@') < email.lastIndexOf('.')) {
      return true;
    }
  }
  return false;
}
