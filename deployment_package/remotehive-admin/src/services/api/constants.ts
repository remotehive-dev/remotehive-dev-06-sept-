// ============================================================================
// API CONSTANTS
// ============================================================================
// Constants for RemoteHive Admin Panel API integration with FastAPI backend

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile',
  },

  // Job Seekers
  JOB_SEEKERS: {
    BASE: '/api/v1/jobseekers',
    BY_ID: (id: string) => `/api/v1/jobseekers/${id}`,
    STATS: '/api/v1/jobseekers/stats',
    TOGGLE_PREMIUM: (id: string) => `/api/v1/jobseekers/${id}/premium`,
    SUSPEND: (id: string) => `/api/v1/jobseekers/${id}/suspend`,
    ACTIVATE: (id: string) => `/api/v1/jobseekers/${id}/activate`,
  },

  // Employers
  EMPLOYERS: {
    BASE: '/api/v1/employers',
    BY_ID: (id: string) => `/api/v1/employers/${id}`,
    STATS: '/api/v1/employers/stats',
    VERIFY: (id: string) => `/api/v1/employers/${id}/verify`,
    SUSPEND: (id: string) => `/api/v1/employers/${id}/suspend',
    ACTIVATE: (id: string) => `/api/v1/employers/${id}/activate`,
  },

  // Job Posts
  JOB_POSTS: {
    BASE: '/api/v1/jobposts',
    BY_ID: (id: string) => `/api/v1/jobposts/${id}`,
    STATS: '/api/v1/jobposts/stats',
    APPROVE: (id: string) => `/api/v1/jobposts/${id}/approve`,
    REJECT: (id: string) => `/api/v1/jobposts/${id}/reject`,
    FEATURE: (id: string) => `/api/v1/jobposts/${id}/feature`,
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/api/v1/analytics/dashboard',
    USERS: '/api/v1/analytics/users',
    JOBS: '/api/v1/analytics/jobs',
    REVENUE: '/api/v1/analytics/revenue',
    TRAFFIC: '/api/v1/analytics/traffic',
  },

  // Applications
  APPLICATIONS: {
    BASE: '/api/v1/applications',
    BY_ID: (id: string) => `/api/v1/applications/${id}`,
    STATS: '/api/v1/applications/stats',
  },

  // Admin
  ADMIN: {
    USERS: '/api/v1/admin/users',
    SETTINGS: '/api/v1/admin/settings',
    LOGS: '/api/v1/admin/logs',
  },
};

// ============================================================================
// STATUS TYPES
// ============================================================================

export const STATUS_TYPES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DRAFT: 'draft',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
  FEATURED: 'featured',
} as const;

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  EMPLOYER: 'employer',
  JOB_SEEKER: 'jobseeker',
} as const;

// ============================================================================
// EXPERIENCE LEVELS
// ============================================================================

export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  EXECUTIVE: 'executive',
} as const;

// ============================================================================
// REMOTE PREFERENCES
// ============================================================================

export const REMOTE_PREFERENCES = {
  REMOTE: 'remote',
  HYBRID: 'hybrid',
  ONSITE: 'onsite',
  FLEXIBLE: 'flexible',
} as const;

// ============================================================================
// APPLICATION STATUS
// ============================================================================

export const APPLICATION_STATUS = {
  APPLIED: 'applied',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEWED: 'interviewed',
  OFFERED: 'offered',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ============================================================================
// SORT OPTIONS
// ============================================================================

export const SORT_OPTIONS = {
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  NAME: 'name',
  EMAIL: 'email',
  STATUS: 'status',
} as const;

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error - please check your connection',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access forbidden - insufficient permissions',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'An internal server error occurred',
  VALIDATION_ERROR: 'Please check your input and try again',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created',
  UPDATED: 'Successfully updated',
  DELETED: 'Successfully deleted',
  SAVED: 'Successfully saved',
  SENT: 'Successfully sent',
} as const;