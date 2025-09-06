/**
 * Storage utilities for localStorage, sessionStorage, and data persistence
 */

// Storage types
export type StorageType = 'localStorage' | 'sessionStorage';

// Storage item with metadata
interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  version?: string;
}

// Check if storage is available
const isStorageAvailable = (type: StorageType): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Get storage instance
const getStorage = (type: StorageType): Storage | null => {
  if (!isStorageAvailable(type)) return null;
  return window[type];
};

// Serialize data for storage
const serialize = <T>(data: T): string => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to serialize data:', error);
    throw new Error('Failed to serialize data for storage');
  }
};

// Deserialize data from storage
const deserialize = <T>(data: string): T => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to deserialize data:', error);
    throw new Error('Failed to deserialize data from storage');
  }
};

// Create storage item with metadata
const createStorageItem = <T>(value: T, ttl?: number, version?: string): StorageItem<T> => {
  return {
    value,
    timestamp: Date.now(),
    ttl,
    version,
  };
};

// Check if storage item is expired
const isExpired = (item: StorageItem): boolean => {
  if (!item.ttl) return false;
  return Date.now() - item.timestamp > item.ttl;
};

// Storage class
class StorageManager {
  private storage: Storage | null;
  private type: StorageType;
  private prefix: string;
  
  constructor(type: StorageType = 'localStorage', prefix = 'remotehive_admin_') {
    this.type = type;
    this.storage = getStorage(type);
    this.prefix = prefix;
  }
  
  // Get prefixed key
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  // Set item in storage
  set<T>(key: string, value: T, ttl?: number, version?: string): boolean {
    if (!this.storage) return false;
    
    try {
      const item = createStorageItem(value, ttl, version);
      const serialized = serialize(item);
      this.storage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} in ${this.type}:`, error);
      return false;
    }
  }
  
  // Get item from storage
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.storage) return defaultValue;
    
    try {
      const serialized = this.storage.getItem(this.getKey(key));
      if (!serialized) return defaultValue;
      
      const item: StorageItem<T> = deserialize(serialized);
      
      // Check if item is expired
      if (isExpired(item)) {
        this.remove(key);
        return defaultValue;
      }
      
      return item.value;
    } catch (error) {
      console.error(`Failed to get ${key} from ${this.type}:`, error);
      this.remove(key); // Remove corrupted data
      return defaultValue;
    }
  }
  
  // Remove item from storage
  remove(key: string): boolean {
    if (!this.storage) return false;
    
    try {
      this.storage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key} from ${this.type}:`, error);
      return false;
    }
  }
  
  // Check if item exists
  has(key: string): boolean {
    if (!this.storage) return false;
    
    const item = this.get(key);
    return item !== undefined;
  }
  
  // Clear all items with prefix
  clear(): boolean {
    if (!this.storage) return false;
    
    try {
      const keys = this.getKeys();
      keys.forEach(key => this.storage!.removeItem(key));
      return true;
    } catch (error) {
      console.error(`Failed to clear ${this.type}:`, error);
      return false;
    }
  }
  
  // Get all keys with prefix
  getKeys(): string[] {
    if (!this.storage) return [];
    
    const keys: string[] = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    
    return keys;
  }
  
  // Get all items
  getAll(): Record<string, any> {
    const items: Record<string, any> = {};
    const keys = this.getKeys();
    
    keys.forEach(fullKey => {
      const key = fullKey.replace(this.prefix, '');
      const value = this.get(key);
      if (value !== undefined) {
        items[key] = value;
      }
    });
    
    return items;
  }
  
  // Get storage size in bytes
  getSize(): number {
    if (!this.storage) return 0;
    
    let size = 0;
    const keys = this.getKeys();
    
    keys.forEach(key => {
      const value = this.storage!.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    });
    
    return size;
  }
  
  // Clean expired items
  cleanExpired(): number {
    if (!this.storage) return 0;
    
    let cleaned = 0;
    const keys = this.getKeys();
    
    keys.forEach(fullKey => {
      try {
        const serialized = this.storage!.getItem(fullKey);
        if (serialized) {
          const item: StorageItem = deserialize(serialized);
          if (isExpired(item)) {
            this.storage!.removeItem(fullKey);
            cleaned++;
          }
        }
      } catch {
        // Remove corrupted items
        this.storage!.removeItem(fullKey);
        cleaned++;
      }
    });
    
    return cleaned;
  }
  
  // Update item TTL
  updateTTL(key: string, ttl: number): boolean {
    const value = this.get(key);
    if (value === undefined) return false;
    
    return this.set(key, value, ttl);
  }
  
  // Get item metadata
  getMetadata(key: string): Omit<StorageItem, 'value'> | null {
    if (!this.storage) return null;
    
    try {
      const serialized = this.storage.getItem(this.getKey(key));
      if (!serialized) return null;
      
      const item: StorageItem = deserialize(serialized);
      return {
        timestamp: item.timestamp,
        ttl: item.ttl,
        version: item.version,
      };
    } catch {
      return null;
    }
  }
}

// Create storage instances
export const localStorage = new StorageManager('localStorage');
export const sessionStorage = new StorageManager('sessionStorage');

// Specific storage utilities for admin panel
export const adminStorage = {
  // User session
  setUser: (user: any) => localStorage.set('user', user, 24 * 60 * 60 * 1000), // 24 hours
  getUser: () => localStorage.get('user'),
  removeUser: () => localStorage.remove('user'),
  
  // Authentication token
  setToken: (token: string) => localStorage.set('token', token, 24 * 60 * 60 * 1000), // 24 hours
  getToken: () => localStorage.get<string>('token'),
  removeToken: () => localStorage.remove('token'),
  
  // Theme preference
  setTheme: (theme: string) => localStorage.set('theme', theme),
  getTheme: () => localStorage.get<string>('theme', 'system'),
  
  // Sidebar state
  setSidebarCollapsed: (collapsed: boolean) => localStorage.set('sidebar_collapsed', collapsed),
  getSidebarCollapsed: () => localStorage.get<boolean>('sidebar_collapsed', false),
  
  // Filters and preferences
  setFilters: (page: string, filters: any) => sessionStorage.set(`filters_${page}`, filters),
  getFilters: (page: string) => sessionStorage.get(`filters_${page}`, {}),
  
  // Pagination state
  setPagination: (page: string, pagination: any) => sessionStorage.set(`pagination_${page}`, pagination),
  getPagination: (page: string) => sessionStorage.get(`pagination_${page}`, { page: 1, limit: 10 }),
  
  // Recent searches
  addRecentSearch: (query: string) => {
    const searches = localStorage.get<string[]>('recent_searches', []);
    const updated = [query, ...searches.filter(s => s !== query)].slice(0, 10);
    localStorage.set('recent_searches', updated, 7 * 24 * 60 * 60 * 1000); // 7 days
  },
  getRecentSearches: () => localStorage.get<string[]>('recent_searches', []),
  clearRecentSearches: () => localStorage.remove('recent_searches'),
  
  // Draft content
  saveDraft: (id: string, content: any) => {
    localStorage.set(`draft_${id}`, content, 24 * 60 * 60 * 1000); // 24 hours
  },
  getDraft: (id: string) => localStorage.get(`draft_${id}`),
  removeDraft: (id: string) => localStorage.remove(`draft_${id}`),
  
  // Settings backup
  backupSettings: (settings: any) => {
    localStorage.set('settings_backup', settings, 30 * 24 * 60 * 60 * 1000); // 30 days
  },
  getSettingsBackup: () => localStorage.get('settings_backup'),
  
  // Clear all admin data
  clearAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  },
};

// Storage event listener for cross-tab synchronization
export const onStorageChange = (callback: (key: string, newValue: any, oldValue: any) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleStorageChange = (event: StorageEvent) => {
    if (!event.key || !event.key.startsWith('remotehive_admin_')) return;
    
    const key = event.key.replace('remotehive_admin_', '');
    let newValue, oldValue;
    
    try {
      newValue = event.newValue ? deserialize<StorageItem>(event.newValue).value : null;
      oldValue = event.oldValue ? deserialize<StorageItem>(event.oldValue).value : null;
    } catch {
      newValue = event.newValue;
      oldValue = event.oldValue;
    }
    
    callback(key, newValue, oldValue);
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// Storage quota utilities
export const getStorageQuota = async (): Promise<{ used: number; total: number } | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return null;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      total: estimate.quota || 0,
    };
  } catch {
    return null;
  }
};

// Check if storage is nearly full
export const isStorageNearlyFull = async (threshold = 0.8): Promise<boolean> => {
  const quota = await getStorageQuota();
  if (!quota || quota.total === 0) return false;
  
  return (quota.used / quota.total) > threshold;
};

// Migrate storage data between versions
export const migrateStorage = (migrations: Record<string, (data: any) => any>) => {
  const currentVersion = localStorage.get<string>('storage_version', '1.0.0');
  
  Object.entries(migrations).forEach(([version, migrationFn]) => {
    if (version > currentVersion) {
      try {
        const allData = localStorage.getAll();
        const migratedData = migrationFn(allData);
        
        // Clear old data and set migrated data
        localStorage.clear();
        Object.entries(migratedData).forEach(([key, value]) => {
          localStorage.set(key, value);
        });
        
        localStorage.set('storage_version', version);
        console.log(`Storage migrated to version ${version}`);
      } catch (error) {
        console.error(`Failed to migrate storage to version ${version}:`, error);
      }
    }
  });
};

// Export storage manager class for custom instances
export { StorageManager };

// Cleanup function to run periodically
export const cleanupStorage = () => {
  const localCleaned = localStorage.cleanExpired();
  const sessionCleaned = sessionStorage.cleanExpired();
  
  if (localCleaned > 0 || sessionCleaned > 0) {
    console.log(`Cleaned ${localCleaned + sessionCleaned} expired storage items`);
  }
};

// Auto-cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up expired items on page load
  setTimeout(cleanupStorage, 1000);
  
  // Set up periodic cleanup (every 30 minutes)
  setInterval(cleanupStorage, 30 * 60 * 1000);
}