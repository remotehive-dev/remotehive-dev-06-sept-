/**
 * Helper utilities for common operations
 */

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone function
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    
    return clonedObj as T;
  }
  
  return obj;
};

// Deep merge function
export const deepMerge = <T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T => {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
};

// Check if value is object
const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Generate unique ID
export const generateId = (prefix = '', length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return prefix ? `${prefix}_${result}` : result;
};

// Generate UUID v4
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Sleep function
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> => {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === retries) {
        throw lastError;
      }
      
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }
      
      const waitTime = delay * Math.pow(backoff, attempt);
      await sleep(waitTime);
    }
  }
  
  throw lastError!;
};

// Array utilities
export const arrayUtils = {
  // Remove duplicates
  unique: <T>(array: T[], key?: keyof T): T[] => {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },
  
  // Group by key
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
  
  // Sort by multiple keys
  sortBy: <T>(array: T[], ...keys: (keyof T)[]): T[] => {
    return [...array].sort((a, b) => {
      for (const key of keys) {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  },
  
  // Chunk array
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  // Flatten array
  flatten: <T>(array: (T | T[])[]): T[] => {
    return array.reduce<T[]>((flat, item) => {
      return flat.concat(Array.isArray(item) ? arrayUtils.flatten(item) : item);
    }, []);
  },
  
  // Find differences between arrays
  difference: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter(item => !array2.includes(item));
  },
  
  // Find intersection of arrays
  intersection: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter(item => array2.includes(item));
  },
  
  // Shuffle array
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  // Sample random items
  sample: <T>(array: T[], count = 1): T[] => {
    const shuffled = arrayUtils.shuffle(array);
    return shuffled.slice(0, count);
  },
};

// Object utilities
export const objectUtils = {
  // Pick specific keys
  pick: <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },
  
  // Omit specific keys
  omit: <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },
  
  // Check if object is empty
  isEmpty: (obj: Record<string, any>): boolean => {
    return Object.keys(obj).length === 0;
  },
  
  // Get nested value safely
  get: (obj: any, path: string, defaultValue?: any): any => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  },
  
  // Set nested value
  set: (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  },
  
  // Transform object keys
  mapKeys: <T extends Record<string, any>>(
    obj: T,
    mapper: (key: string) => string
  ): Record<string, any> => {
    const result: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
      result[mapper(key)] = obj[key];
    });
    return result;
  },
  
  // Transform object values
  mapValues: <T extends Record<string, any>, U>(
    obj: T,
    mapper: (value: T[keyof T], key: string) => U
  ): Record<keyof T, U> => {
    const result = {} as Record<keyof T, U>;
    Object.keys(obj).forEach(key => {
      result[key as keyof T] = mapper(obj[key], key);
    });
    return result;
  },
};

// String utilities
export const stringUtils = {
  // Convert to camelCase
  camelCase: (str: string): string => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  },
  
  // Convert to PascalCase
  pascalCase: (str: string): string => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
      .replace(/\s+/g, '');
  },
  
  // Convert to kebab-case
  kebabCase: (str: string): string => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },
  
  // Convert to snake_case
  snakeCase: (str: string): string => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  },
  
  // Truncate string
  truncate: (str: string, length: number, suffix = '...'): string => {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  },
  
  // Escape HTML
  escapeHtml: (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  // Unescape HTML
  unescapeHtml: (str: string): string => {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || div.innerText || '';
  },
  
  // Remove HTML tags
  stripHtml: (str: string): string => {
    return str.replace(/<[^>]*>/g, '');
  },
  
  // Generate random string
  random: (length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// Number utilities
export const numberUtils = {
  // Clamp number between min and max
  clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },
  
  // Round to specific decimal places
  round: (num: number, decimals = 0): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  },
  
  // Check if number is in range
  inRange: (num: number, min: number, max: number): boolean => {
    return num >= min && num <= max;
  },
  
  // Generate random number in range
  random: (min = 0, max = 1): number => {
    return Math.random() * (max - min) + min;
  },
  
  // Generate random integer in range
  randomInt: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // Calculate percentage
  percentage: (value: number, total: number): number => {
    return total === 0 ? 0 : (value / total) * 100;
  },
  
  // Calculate average
  average: (numbers: number[]): number => {
    return numbers.length === 0 ? 0 : numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },
  
  // Find median
  median: (numbers: number[]): number => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  },
};

// URL utilities
export const urlUtils = {
  // Parse query string
  parseQuery: (queryString: string): Record<string, string> => {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(queryString);
    
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    
    return params;
  },
  
  // Build query string
  buildQuery: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  },
  
  // Join URL parts
  join: (...parts: string[]): string => {
    return parts
      .map((part, index) => {
        if (index === 0) {
          return part.replace(/\/$/, '');
        }
        return part.replace(/^\//, '').replace(/\/$/, '');
      })
      .join('/');
  },
  
  // Check if URL is absolute
  isAbsolute: (url: string): boolean => {
    return /^https?:\/\//i.test(url);
  },
  
  // Get domain from URL
  getDomain: (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  },
};

// Color utilities
export const colorUtils = {
  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },
  
  // Convert RGB to hex
  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  },
  
  // Generate random color
  random: (): string => {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  },
  
  // Lighten color
  lighten: (hex: string, amount: number): string => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return hex;
    
    const { r, g, b } = rgb;
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    return colorUtils.rgbToHex(newR, newG, newB);
  },
  
  // Darken color
  darken: (hex: string, amount: number): string => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return hex;
    
    const { r, g, b } = rgb;
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    
    return colorUtils.rgbToHex(newR, newG, newB);
  },
};

// Performance utilities
export const performanceUtils = {
  // Measure execution time
  measure: async <T>(fn: () => Promise<T> | T, label?: string): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    
    if (label) {
      console.log(`${label}: ${time.toFixed(2)}ms`);
    }
    
    return { result, time };
  },
  
  // Create performance marker
  mark: (name: string): void => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },
  
  // Measure between markers
  measureBetween: (startMark: string, endMark: string, measureName?: string): number => {
    if (typeof performance !== 'undefined' && performance.measure) {
      const name = measureName || `${startMark}-${endMark}`;
      performance.measure(name, startMark, endMark);
      
      const entries = performance.getEntriesByName(name);
      return entries.length > 0 ? entries[0].duration : 0;
    }
    return 0;
  },
};

// Browser utilities
export const browserUtils = {
  // Check if running in browser
  isBrowser: (): boolean => {
    return typeof window !== 'undefined';
  },
  
  // Get user agent info
  getUserAgent: (): string => {
    return browserUtils.isBrowser() ? navigator.userAgent : '';
  },
  
  // Check if mobile device
  isMobile: (): boolean => {
    return browserUtils.isBrowser() && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Copy to clipboard
  copyToClipboard: async (text: string): Promise<boolean> => {
    if (!browserUtils.isBrowser()) return false;
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch {
      return false;
    }
  },
  
  // Get viewport dimensions
  getViewport: (): { width: number; height: number } => {
    if (!browserUtils.isBrowser()) {
      return { width: 0, height: 0 };
    }
    
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight,
    };
  },
  
  // Scroll to element
  scrollToElement: (element: Element | string, options?: ScrollIntoViewOptions): void => {
    if (!browserUtils.isBrowser()) return;
    
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', ...options });
    }
  },
};

// Event utilities
export const eventUtils = {
  // Create event emitter
  createEmitter: <T extends Record<string, any[]>>() => {
    const listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {};
    
    return {
      on: <K extends keyof T>(event: K, listener: (...args: T[K]) => void) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event]!.push(listener);
      },
      
      off: <K extends keyof T>(event: K, listener: (...args: T[K]) => void) => {
        if (listeners[event]) {
          const index = listeners[event]!.indexOf(listener);
          if (index > -1) {
            listeners[event]!.splice(index, 1);
          }
        }
      },
      
      emit: <K extends keyof T>(event: K, ...args: T[K]) => {
        if (listeners[event]) {
          listeners[event]!.forEach(listener => listener(...args));
        }
      },
      
      once: <K extends keyof T>(event: K, listener: (...args: T[K]) => void) => {
        const onceListener = (...args: T[K]) => {
          listener(...args);
          this.off(event, onceListener);
        };
        this.on(event, onceListener);
      },
    };
  },
};

// File utilities
export const fileUtils = {
  // Get file extension
  getExtension: (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  },
  
  // Get file name without extension
  getNameWithoutExtension: (filename: string): string => {
    return filename.replace(/\.[^/.]+$/, '');
  },
  
  // Format file size
  formatSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Check if file type is allowed
  isAllowedType: (filename: string, allowedTypes: string[]): boolean => {
    const extension = fileUtils.getExtension(filename).toLowerCase();
    return allowedTypes.map(type => type.toLowerCase()).includes(extension);
  },
  
  // Read file as text
  readAsText: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },
  
  // Read file as data URL
  readAsDataURL: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },
};

// Export all utilities
export const utils = {
  debounce,
  throttle,
  deepClone,
  deepMerge,
  generateId,
  generateUUID,
  sleep,
  retry,
  array: arrayUtils,
  object: objectUtils,
  string: stringUtils,
  number: numberUtils,
  url: urlUtils,
  color: colorUtils,
  performance: performanceUtils,
  browser: browserUtils,
  event: eventUtils,
  file: fileUtils,
};

export default utils;