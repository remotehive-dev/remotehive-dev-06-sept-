// ============================================================================
// API TYPES AND INTERFACES
// ============================================================================
// Shared types and interfaces for RemoteHive API services

// ============================================================================
// COMMON API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
  code?: string;
}

// ============================================================================
// PAGINATION AND SORTING
// ============================================================================

export interface PaginationParams {
  page?: number;
  per_page?: number;
  limit?: number;
  offset?: number;
}

export interface SortingParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  order_by?: string;
  direction?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  filter?: Record<string, any>;
  where?: Record<string, any>;
}

export interface QueryParams extends PaginationParams, SortingParams, FilterParams {
  include?: string[];
  fields?: string[];
  expand?: string[];
}

// ============================================================================
// DATE AND TIME TYPES
// ============================================================================

export interface DateRange {
  start: string;
  end: string;
}

export interface TimeRange {
  start_time: string;
  end_time: string;
}

export interface DateTimeRange extends DateRange {
  start_time?: string;
  end_time?: string;
  timezone?: string;
}

// ============================================================================
// FILE AND UPLOAD TYPES
// ============================================================================

export interface FileUpload {
  file: File;
  name?: string;
  description?: string;
  tags?: string[];
}

export interface UploadResponse {
  id: string;
  filename: string;
  original_name: string;
  size: number;
  mime_type: string;
  url: string;
  thumbnail_url?: string;
  upload_date: string;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// USER AND AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  permissions?: string[];
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  expires_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirmation: string;
  first_name?: string;
  last_name?: string;
  terms_accepted: boolean;
}

// ============================================================================
// VALIDATION AND ERROR TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface FormErrors {
  [field: string]: string | string[];
}

export interface ApiValidationError extends ApiError {
  validation_errors?: ValidationError[];
  field_errors?: FormErrors;
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sort?: SortingParams;
  pagination?: PaginationParams;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  query: string;
  filters_applied: Record<string, any>;
  search_time_ms: number;
  suggestions?: string[];
}

export interface FilterOption {
  value: string | number;
  label: string;
  count?: number;
  selected?: boolean;
}

export interface FilterGroup {
  name: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'boolean';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

// ============================================================================
// ANALYTICS AND STATISTICS TYPES
// ============================================================================

export interface StatisticItem {
  label: string;
  value: number | string;
  change?: number;
  change_type?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percentage' | 'currency' | 'duration';
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface AnalyticsData {
  period: DateRange;
  statistics: StatisticItem[];
  charts: Record<string, ChartData>;
  trends: Record<string, number>;
}

// ============================================================================
// NOTIFICATION AND MESSAGE TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
}

export interface ToastMessage {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

// ============================================================================
// SYSTEM AND CONFIGURATION TYPES
// ============================================================================

export interface SystemInfo {
  version: string;
  environment: string;
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  active_users: number;
  last_backup?: string;
}

export interface ConfigOption {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  default_value?: any;
  required?: boolean;
  validation?: string;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  response_time_ms: number;
  last_check: string;
  error_message?: string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ResponseStatus = 'success' | 'error' | 'loading' | 'idle';
export type SortDirection = 'asc' | 'desc';
export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'range' | 'boolean';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type UserRole = 'admin' | 'moderator' | 'user' | 'guest';
export type PermissionLevel = 'read' | 'write' | 'delete' | 'admin';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Maybe<T> = T | undefined;
export type ID = string | number;
export type Timestamp = string;
export type URL = string;
export type Email = string;
export type PhoneNumber = string;
export type Currency = string;
export type Percentage = number;
export type Count = number;