/**
 * Validation utilities for the admin panel
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Phone number validation
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleaned);
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

// Required field validation
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// String length validation
export const validateLength = (
  value: string,
  min?: number,
  max?: number
): { isValid: boolean; message?: string } => {
  const length = value.length;
  
  if (min !== undefined && length < min) {
    return {
      isValid: false,
      message: `Must be at least ${min} characters long`,
    };
  }
  
  if (max !== undefined && length > max) {
    return {
      isValid: false,
      message: `Must be no more than ${max} characters long`,
    };
  }
  
  return { isValid: true };
};

// Number range validation
export const validateRange = (
  value: number,
  min?: number,
  max?: number
): { isValid: boolean; message?: string } => {
  if (min !== undefined && value < min) {
    return {
      isValid: false,
      message: `Must be at least ${min}`,
    };
  }
  
  if (max !== undefined && value > max) {
    return {
      isValid: false,
      message: `Must be no more than ${max}`,
    };
  }
  
  return { isValid: true };
};

// Date validation
export const isValidDate = (date: string | Date): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const isDateInRange = (
  date: string | Date,
  minDate?: string | Date,
  maxDate?: string | Date
): boolean => {
  const d = new Date(date);
  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;
  
  if (min && d < min) return false;
  if (max && d > max) return false;
  
  return true;
};

// File validation
export const validateFile = (
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { isValid: boolean; message?: string } => {
  const { maxSize, allowedTypes, allowedExtensions } = options;
  
  if (maxSize && file.size > maxSize) {
    return {
      isValid: false,
      message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }
  
  if (allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        message: `File extension must be one of: ${allowedExtensions.join(', ')}`,
      };
    }
  }
  
  return { isValid: true };
};

// JSON validation
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Slug validation
export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

// Credit card validation (basic Luhn algorithm)
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Social security number validation (US format)
export const isValidSSN = (ssn: string): boolean => {
  const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
  return ssnRegex.test(ssn);
};

// IP address validation
export const isValidIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// Hex color validation
export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

// Username validation
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Domain validation
export const isValidDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
};

// Form validation helper
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any) => { isValid: boolean; message?: string }>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;
  
  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field as keyof T];
    
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        errors[field as keyof T] = result.message || 'Invalid value';
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }
  
  return { isValid, errors };
};

// Common validation rules
export const validationRules = {
  required: (value: any) => ({
    isValid: isRequired(value),
    message: 'This field is required',
  }),
  
  email: (value: string) => ({
    isValid: !value || isValidEmail(value),
    message: 'Please enter a valid email address',
  }),
  
  url: (value: string) => ({
    isValid: !value || isValidUrl(value),
    message: 'Please enter a valid URL',
  }),
  
  phone: (value: string) => ({
    isValid: !value || isValidPhoneNumber(value),
    message: 'Please enter a valid phone number',
  }),
  
  minLength: (min: number) => (value: string) => ({
    isValid: !value || value.length >= min,
    message: `Must be at least ${min} characters long`,
  }),
  
  maxLength: (max: number) => (value: string) => ({
    isValid: !value || value.length <= max,
    message: `Must be no more than ${max} characters long`,
  }),
  
  min: (min: number) => (value: number) => ({
    isValid: value == null || value >= min,
    message: `Must be at least ${min}`,
  }),
  
  max: (max: number) => (value: number) => ({
    isValid: value == null || value <= max,
    message: `Must be no more than ${max}`,
  }),
  
  pattern: (regex: RegExp, message: string) => (value: string) => ({
    isValid: !value || regex.test(value),
    message,
  }),
  
  oneOf: (options: any[], message?: string) => (value: any) => ({
    isValid: !value || options.includes(value),
    message: message || `Must be one of: ${options.join(', ')}`,
  }),
};

// Sanitization functions
export const sanitizeInput = {
  // Remove HTML tags
  stripHtml: (str: string): string => {
    return str.replace(/<[^>]*>/g, '');
  },
  
  // Escape HTML entities
  escapeHtml: (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  // Remove special characters
  alphanumeric: (str: string): string => {
    return str.replace(/[^a-zA-Z0-9]/g, '');
  },
  
  // Remove non-numeric characters
  numeric: (str: string): string => {
    return str.replace(/[^0-9]/g, '');
  },
  
  // Trim whitespace
  trim: (str: string): string => {
    return str.trim();
  },
  
  // Convert to lowercase
  lowercase: (str: string): string => {
    return str.toLowerCase();
  },
  
  // Convert to uppercase
  uppercase: (str: string): string => {
    return str.toUpperCase();
  },
};