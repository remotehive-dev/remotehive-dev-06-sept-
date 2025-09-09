/**
 * Application constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Supabase Tables
export const TABLES = {
  USERS: 'users',
  EMPLOYERS: 'employers',
  JOB_SEEKERS: 'job_seekers',
  JOB_POSTS: 'job_posts',
  APPLICATIONS: 'applications',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  CONTENT: 'content',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYER: 'employer',
  JOB_SEEKER: 'job_seeker',
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
  BANNED: 'banned',
} as const;

// Employer Status
export const EMPLOYER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

// Job Post Status
export const JOB_POST_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CLOSED: 'closed',
  FLAGGED: 'flagged',
} as const;

// Application Status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEWED: 'interviewed',
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

// Employment Types
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  FREELANCE: 'freelance',
  INTERNSHIP: 'internship',
  TEMPORARY: 'temporary',
} as const;

// Remote Types
export const REMOTE_TYPES = {
  REMOTE: 'remote',
  HYBRID: 'hybrid',
  ON_SITE: 'on_site',
} as const;

// Experience Levels
export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  EXECUTIVE: 'executive',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  SYSTEM: 'system',
} as const;

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Content Types
export const CONTENT_TYPES = {
  BLOG_POST: 'blog_post',
  PAGE: 'page',
  ANNOUNCEMENT: 'announcement',
  TESTIMONIAL: 'testimonial',
  FAQ: 'faq',
} as const;

// File Types
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  SPREADSHEET: ['xls', 'xlsx', 'csv'],
  PRESENTATION: ['ppt', 'pptx'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
} as const;

// File Size Limits (in bytes)
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  RESUME: 5 * 1024 * 1024, // 5MB
  COMPANY_LOGO: 1 * 1024 * 1024, // 1MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  LIMITS: [10, 25, 50, 100],
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
  RELATIVE: 'relative',
} as const;

// Currency
export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOL: '$',
  SUPPORTED: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
} as const;

// Salary Ranges
export const SALARY_RANGES = [
  { label: 'Under $30k', min: 0, max: 30000 },
  { label: '$30k - $50k', min: 30000, max: 50000 },
  { label: '$50k - $75k', min: 50000, max: 75000 },
  { label: '$75k - $100k', min: 75000, max: 100000 },
  { label: '$100k - $150k', min: 100000, max: 150000 },
  { label: '$150k - $200k', min: 150000, max: 200000 },
  { label: 'Over $200k', min: 200000, max: null },
] as const;

// Industries
export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Construction',
  'Transportation',
  'Hospitality',
  'Media',
  'Government',
  'Non-profit',
  'Energy',
  'Real Estate',
  'Agriculture',
  'Other',
] as const;

// Company Sizes
export const COMPANY_SIZES = [
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '501-1000 employees', value: '501-1000' },
  { label: '1001-5000 employees', value: '1001-5000' },
  { label: '5000+ employees', value: '5000+' },
] as const;

// Skills Categories
export const SKILL_CATEGORIES = {
  TECHNICAL: 'technical',
  SOFT: 'soft',
  LANGUAGE: 'language',
  CERTIFICATION: 'certification',
  TOOL: 'tool',
} as const;

// Popular Skills
export const POPULAR_SKILLS = {
  TECHNICAL: [
    'JavaScript',
    'Python',
    'React',
    'Node.js',
    'TypeScript',
    'Java',
    'C#',
    'PHP',
    'Go',
    'Rust',
    'Swift',
    'Kotlin',
    'SQL',
    'MongoDB',
    'PostgreSQL',
    'AWS',
    'Docker',
    'Kubernetes',
    'Git',
    'Linux',
  ],
  SOFT: [
    'Communication',
    'Leadership',
    'Problem Solving',
    'Teamwork',
    'Time Management',
    'Critical Thinking',
    'Adaptability',
    'Creativity',
    'Project Management',
    'Customer Service',
  ],
} as const;

// Locations (Major Cities)
export const LOCATIONS = [
  'New York, NY',
  'San Francisco, CA',
  'Los Angeles, CA',
  'Chicago, IL',
  'Boston, MA',
  'Seattle, WA',
  'Austin, TX',
  'Denver, CO',
  'Atlanta, GA',
  'Miami, FL',
  'Toronto, ON',
  'Vancouver, BC',
  'London, UK',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
  'Remote',
] as const;

// Time Zones
export const TIME_ZONES = [
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'UTC', value: 'UTC' },
  { label: 'Central European Time (CET)', value: 'Europe/Berlin' },
  { label: 'British Summer Time (BST)', value: 'Europe/London' },
] as const;

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'remotehive_auth_token',
  REFRESH_TOKEN: 'remotehive_refresh_token',
  USER_SESSION: 'remotehive_user_session',
  THEME: 'remotehive_theme',
  SIDEBAR_STATE: 'remotehive_sidebar_state',
  FILTERS: 'remotehive_filters',
  PAGINATION: 'remotehive_pagination',
  RECENT_SEARCHES: 'remotehive_recent_searches',
  DRAFT_CONTENT: 'remotehive_draft_content',
  SETTINGS: 'remotehive_settings',
} as const;

// Session Storage Keys
export const SESSION_KEYS = {
  TEMP_DATA: 'remotehive_temp_data',
  FORM_DATA: 'remotehive_form_data',
  NAVIGATION_STATE: 'remotehive_navigation_state',
} as const;

// Cookie Names
export const COOKIE_NAMES = {
  AUTH: 'remotehive_auth',
  PREFERENCES: 'remotehive_preferences',
  CONSENT: 'remotehive_consent',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created!',
  UPDATED: 'Successfully updated!',
  DELETED: 'Successfully deleted!',
  SAVED: 'Successfully saved!',
  SENT: 'Successfully sent!',
  UPLOADED: 'Successfully uploaded!',
  APPROVED: 'Successfully approved!',
  REJECTED: 'Successfully rejected!',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s]+$/,
  },
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  API: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  SEARCH: {
    MAX_REQUESTS: 20,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ANALYTICS_DASHBOARD: true,
  BULK_OPERATIONS: true,
  ADVANCED_SEARCH: true,
  EXPORT_DATA: true,
  REAL_TIME_NOTIFICATIONS: true,
  DARK_MODE: true,
  BETA_FEATURES: false,
} as const;

// Environment
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  CURRENT: process.env.NODE_ENV || 'development',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/admin/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    BULK: '/users/bulk',
  },
  EMPLOYERS: {
    LIST: '/employers',
    CREATE: '/employers',
    UPDATE: '/employers/:id',
    DELETE: '/employers/:id',
    APPROVE: '/employers/:id/approve',
    REJECT: '/employers/:id/reject',
    SUSPEND: '/employers/:id/suspend',
    STATS: '/employers/stats',
  },
  JOB_SEEKERS: {
    LIST: '/job-seekers',
    CREATE: '/job-seekers',
    UPDATE: '/job-seekers/:id',
    DELETE: '/job-seekers/:id',
    STATS: '/job-seekers/stats',
  },
  JOB_POSTS: {
    LIST: '/job-posts',
    CREATE: '/job-posts',
    UPDATE: '/job-posts/:id',
    DELETE: '/job-posts/:id',
    APPROVE: '/job-posts/:id/approve',
    REJECT: '/job-posts/:id/reject',
    FLAG: '/job-posts/:id/flag',
    STATS: '/job-posts/stats',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    USERS: '/analytics/users',
    JOBS: '/analytics/jobs',
    REVENUE: '/analytics/revenue',
    EXPORT: '/analytics/export',
  },
  CONTENT: {
    LIST: '/content',
    CREATE: '/content',
    UPDATE: '/content/:id',
    DELETE: '/content/:id',
    PUBLISH: '/content/:id/publish',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    CREATE: '/notifications',
    UPDATE: '/notifications/:id',
    DELETE: '/notifications/:id',
    MARK_READ: '/notifications/:id/read',
    BULK_READ: '/notifications/bulk-read',
  },
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
    RESET: '/settings/reset',
  },
  UPLOAD: {
    FILE: '/upload/file',
    IMAGE: '/upload/image',
    DOCUMENT: '/upload/document',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Export all constants as a single object
export const CONSTANTS = {
  API_CONFIG,
  TABLES,
  USER_ROLES,
  USER_STATUS,
  EMPLOYER_STATUS,
  JOB_POST_STATUS,
  APPLICATION_STATUS,
  EMPLOYMENT_TYPES,
  REMOTE_TYPES,
  EXPERIENCE_LEVELS,
  NOTIFICATION_TYPES,
  TOAST_TYPES,
  PRIORITY_LEVELS,
  CONTENT_TYPES,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  PAGINATION,
  DATE_FORMATS,
  CURRENCY,
  SALARY_RANGES,
  INDUSTRIES,
  COMPANY_SIZES,
  SKILL_CATEGORIES,
  POPULAR_SKILLS,
  LOCATIONS,
  TIME_ZONES,
  THEME_COLORS,
  ANIMATION_DURATION,
  BREAKPOINTS,
  Z_INDEX,
  STORAGE_KEYS,
  SESSION_KEYS,
  COOKIE_NAMES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  RATE_LIMITS,
  FEATURE_FLAGS,
  ENVIRONMENT,
  API_ENDPOINTS,
  HTTP_STATUS,
} as const;

export default CONSTANTS;