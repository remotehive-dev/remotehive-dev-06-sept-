/**
 * Authentication and authorization utilities for the admin panel
 */

import { AdminUser } from '@/store/adminStore';

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Permissions
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  
  // Employer management
  VIEW_EMPLOYERS: 'view_employers',
  APPROVE_EMPLOYERS: 'approve_employers',
  UPDATE_EMPLOYERS: 'update_employers',
  DELETE_EMPLOYERS: 'delete_employers',
  MANAGE_EMPLOYER_PREMIUM: 'manage_employer_premium',
  
  // Job seeker management
  VIEW_JOBSEEKERS: 'view_jobseekers',
  UPDATE_JOBSEEKERS: 'update_jobseekers',
  DELETE_JOBSEEKERS: 'delete_jobseekers',
  MANAGE_JOBSEEKER_PREMIUM: 'manage_jobseeker_premium',
  
  // Job post management
  VIEW_JOBPOSTS: 'view_jobposts',
  APPROVE_JOBPOSTS: 'approve_jobposts',
  UPDATE_JOBPOSTS: 'update_jobposts',
  DELETE_JOBPOSTS: 'delete_jobposts',
  FLAG_JOBPOSTS: 'flag_jobposts',
  FEATURE_JOBPOSTS: 'feature_jobposts',
  
  // Content management
  VIEW_CONTENT: 'view_content',
  CREATE_CONTENT: 'create_content',
  UPDATE_CONTENT: 'update_content',
  DELETE_CONTENT: 'delete_content',
  PUBLISH_CONTENT: 'publish_content',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_ANALYTICS: 'export_analytics',
  
  // Settings
  VIEW_SETTINGS: 'view_settings',
  UPDATE_SETTINGS: 'update_settings',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  
  // Notifications
  SEND_NOTIFICATIONS: 'send_notifications',
  MANAGE_TEMPLATES: 'manage_templates',
  
  // System
  VIEW_LOGS: 'view_logs',
  MANAGE_BACKUPS: 'manage_backups',
  SYSTEM_MAINTENANCE: 'system_maintenance',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_EMPLOYERS,
    PERMISSIONS.APPROVE_EMPLOYERS,
    PERMISSIONS.UPDATE_EMPLOYERS,
    PERMISSIONS.VIEW_JOBSEEKERS,
    PERMISSIONS.UPDATE_JOBSEEKERS,
    PERMISSIONS.VIEW_JOBPOSTS,
    PERMISSIONS.APPROVE_JOBPOSTS,
    PERMISSIONS.UPDATE_JOBPOSTS,
    PERMISSIONS.FLAG_JOBPOSTS,
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.UPDATE_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_SETTINGS,
  ],
};

// Check if user has a specific role
export const hasRole = (user: AdminUser | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

// Check if user has super admin role
export const isSuperAdmin = (user: AdminUser | null): boolean => {
  return hasRole(user, USER_ROLES.SUPER_ADMIN);
};

// Check if user has admin role (includes super admin)
export const isAdmin = (user: AdminUser | null): boolean => {
  if (!user) return false;
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN;
};

// Check if user has a specific permission
export const hasPermission = (user: AdminUser | null, permission: Permission): boolean => {
  if (!user) return false;
  
  // Check explicit permissions first
  if (user.permissions.includes(permission)) {
    return true;
  }
  
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user: AdminUser | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (user: AdminUser | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

// Get all permissions for a user
export const getUserPermissions = (user: AdminUser | null): Permission[] => {
  if (!user) return [];
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const explicitPermissions = user.permissions as Permission[];
  
  // Combine and deduplicate permissions
  return Array.from(new Set([...rolePermissions, ...explicitPermissions]));
};

// Check if user can access a specific route
export const canAccessRoute = (user: AdminUser | null, route: string): boolean => {
  if (!user) return false;
  
  // Route-based access control
  const routePermissions: Record<string, Permission[]> = {
    '/admin': [PERMISSIONS.VIEW_ANALYTICS],
    '/admin/employers': [PERMISSIONS.VIEW_EMPLOYERS],
    '/admin/jobseekers': [PERMISSIONS.VIEW_JOBSEEKERS],
    '/admin/jobposts': [PERMISSIONS.VIEW_JOBPOSTS],
    '/admin/content': [PERMISSIONS.VIEW_CONTENT],
    '/admin/analytics': [PERMISSIONS.VIEW_ANALYTICS],
    '/admin/settings': [PERMISSIONS.VIEW_SETTINGS],
  };
  
  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) {
    // If no specific permissions required, allow access for any admin
    return isAdmin(user);
  }
  
  return hasAnyPermission(user, requiredPermissions);
};

// Check if user can perform an action on a resource
export const canPerformAction = (
  user: AdminUser | null,
  action: string,
  resource: string,
  resourceData?: any
): boolean => {
  if (!user) return false;
  
  // Action-based permission mapping
  const actionPermissions: Record<string, Record<string, Permission[]>> = {
    view: {
      employers: [PERMISSIONS.VIEW_EMPLOYERS],
      jobseekers: [PERMISSIONS.VIEW_JOBSEEKERS],
      jobposts: [PERMISSIONS.VIEW_JOBPOSTS],
      content: [PERMISSIONS.VIEW_CONTENT],
      analytics: [PERMISSIONS.VIEW_ANALYTICS],
      settings: [PERMISSIONS.VIEW_SETTINGS],
    },
    create: {
      employers: [PERMISSIONS.CREATE_USERS],
      jobseekers: [PERMISSIONS.CREATE_USERS],
      jobposts: [PERMISSIONS.UPDATE_JOBPOSTS],
      content: [PERMISSIONS.CREATE_CONTENT],
    },
    update: {
      employers: [PERMISSIONS.UPDATE_EMPLOYERS],
      jobseekers: [PERMISSIONS.UPDATE_JOBSEEKERS],
      jobposts: [PERMISSIONS.UPDATE_JOBPOSTS],
      content: [PERMISSIONS.UPDATE_CONTENT],
      settings: [PERMISSIONS.UPDATE_SETTINGS],
    },
    delete: {
      employers: [PERMISSIONS.DELETE_EMPLOYERS],
      jobseekers: [PERMISSIONS.DELETE_JOBSEEKERS],
      jobposts: [PERMISSIONS.DELETE_JOBPOSTS],
      content: [PERMISSIONS.DELETE_CONTENT],
    },
    approve: {
      employers: [PERMISSIONS.APPROVE_EMPLOYERS],
      jobposts: [PERMISSIONS.APPROVE_JOBPOSTS],
    },
    flag: {
      jobposts: [PERMISSIONS.FLAG_JOBPOSTS],
    },
    feature: {
      jobposts: [PERMISSIONS.FEATURE_JOBPOSTS],
    },
  };
  
  const requiredPermissions = actionPermissions[action]?.[resource];
  if (!requiredPermissions) {
    return false;
  }
  
  return hasAnyPermission(user, requiredPermissions);
};

// Generate user session token (for client-side storage)
export const generateSessionToken = (user: AdminUser): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    timestamp: Date.now(),
  };
  
  // In a real app, this would be a proper JWT token
  return btoa(JSON.stringify(payload));
};

// Validate session token
export const validateSessionToken = (token: string): AdminUser | null => {
  try {
    const payload = JSON.parse(atob(token));
    
    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - payload.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (tokenAge > maxAge) {
      return null;
    }
    
    return payload as AdminUser;
  } catch {
    return null;
  }
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

// Generate secure password
export const generateSecurePassword = (length = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

// Check if user session is about to expire
export const isSessionExpiring = (user: AdminUser | null, warningMinutes = 5): boolean => {
  if (!user || !user.last_login) return false;
  
  const lastLogin = new Date(user.last_login);
  const now = new Date();
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  const warningTime = warningMinutes * 60 * 1000;
  
  const timeElapsed = now.getTime() - lastLogin.getTime();
  const timeRemaining = sessionDuration - timeElapsed;
  
  return timeRemaining <= warningTime && timeRemaining > 0;
};

// Get session time remaining
export const getSessionTimeRemaining = (user: AdminUser | null): number => {
  if (!user || !user.last_login) return 0;
  
  const lastLogin = new Date(user.last_login);
  const now = new Date();
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  
  const timeElapsed = now.getTime() - lastLogin.getTime();
  const timeRemaining = sessionDuration - timeElapsed;
  
  return Math.max(0, timeRemaining);
};

// Format session time remaining
export const formatSessionTimeRemaining = (user: AdminUser | null): string => {
  const timeRemaining = getSessionTimeRemaining(user);
  
  if (timeRemaining <= 0) {
    return 'Session expired';
  }
  
  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  
  return `${minutes}m remaining`;
};

// Security utilities
export const sanitizeUserInput = (input: string): string => {
  return input
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
};

// Rate limiting helpers
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return {
    isAllowed: (identifier: string): boolean => {
      const now = Date.now();
      const userAttempts = attempts.get(identifier);
      
      if (!userAttempts || now > userAttempts.resetTime) {
        attempts.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
      }
      
      if (userAttempts.count >= maxAttempts) {
        return false;
      }
      
      userAttempts.count++;
      return true;
    },
    
    getRemainingTime: (identifier: string): number => {
      const userAttempts = attempts.get(identifier);
      if (!userAttempts) return 0;
      
      return Math.max(0, userAttempts.resetTime - Date.now());
    },
    
    reset: (identifier: string): void => {
      attempts.delete(identifier);
    },
  };
};

// Login rate limiter (5 attempts per 15 minutes)
export const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000);