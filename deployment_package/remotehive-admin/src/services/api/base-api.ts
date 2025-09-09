// ============================================================================
// BASE API CLIENT
// ============================================================================
// Centralized API client configuration for RemoteHive Admin Panel
// Handles authentication, request/response interceptors, and error handling

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================================
// TYPES AND INTERFACES
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
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
}

// ============================================================================
// BASE API CLIENT CLASS
// ============================================================================

class BaseApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Extract the base URL without the /api/v1 suffix if it exists
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.baseURL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl.slice(0, -7) : rawApiUrl;
    
    // Create axios instance
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Setup request interceptor for authentication and logging
   */
  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add admin session token if available
        const adminToken = this.getAdminToken();
        if (adminToken) {
          config.headers['X-Admin-Token'] = adminToken;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor for error handling and logging
   */
  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      (error) => {
        // Handle different types of errors
        const apiError = this.handleApiError(error);
        
        // Log error
        console.error('❌ API Error:', {
          message: apiError.message,
          status: apiError.status,
          errors: apiError.errors,
          url: error.config?.url,
          method: error.config?.method,
        });

        // Handle specific error cases
        if (apiError.status !== undefined) {
          if (apiError.status === 401) {
            this.handleUnauthorized();
          } else if (apiError.status === 403) {
            this.handleForbidden();
          } else if (apiError.status >= 500) {
            this.handleServerError(apiError);
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Handle API errors and normalize error format
   */
  private handleApiError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        message: data?.message || data?.error || `HTTP Error ${status}`,
        status,
        errors: data?.errors || data?.details || [],
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0,
        errors: ['No response from server'],
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        errors: [error.message || 'Unknown error'],
      };
    }
  }

  /**
   * Handle unauthorized access (401)
   */
  private handleUnauthorized(): void {
    // Clear tokens
    this.clearAuthTokens();
    
    // Redirect to login if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/admin/login';
    }
  }

  /**
   * Handle forbidden access (403)
   */
  private handleForbidden(): void {
    // Show forbidden message or redirect to unauthorized page
    if (typeof window !== 'undefined') {
      // You can implement a toast notification here
      console.warn('Access forbidden - insufficient permissions');
    }
  }

  /**
   * Handle server errors (5xx)
   */
  private handleServerError(error: ApiError): void {
    // You can implement error reporting or user notification here
    console.error('Server error occurred:', error);
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  /**
   * Get admin token from storage
   */
  private getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  }

  /**
   * Clear authentication tokens
   */
  private clearAuthTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('admin_token');
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string, persistent: boolean = true): void {
    if (typeof window === 'undefined') return;
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem('auth_token', token);
  }

  /**
   * Set admin token
   */
  public setAdminToken(token: string, persistent: boolean = true): void {
    if (typeof window === 'undefined') return;
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem('admin_token', token);
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  /**
   * GET request
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  /**
   * POST request
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  /**
   * Upload file
   */
  public async uploadFile<T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
    additionalData?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data if provided
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  }

  /**
   * Download file
   */
  public async downloadFile(
    url: string,
    filename?: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Check if user has admin access
   */
  public hasAdminAccess(): boolean {
    return !!this.getAdminToken();
  }

  /**
   * Get current base URL
   */
  public getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Update base URL
   */
  public setBaseURL(url: string): void {
    this.baseURL = url;
    this.instance.defaults.baseURL = url;
  }

  /**
   * Get axios instance for advanced usage
   */
  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const apiClient = new BaseApiClient();
export default apiClient;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  data: T,
  message?: string,
  success: boolean = true
): ApiResponse<T> {
  return {
    success,
    data,
    message,
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  errors?: string[]
): ApiResponse {
  return {
    success: false,
    message,
    errors,
  };
}

/**
 * Format API error for display
 */
export function formatApiError(error: ApiError): string {
  if (error.errors && error.errors.length > 0) {
    return error.errors.join(', ');
  }
  return error.message;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: ApiError): boolean {
  return error.status === 0 || !error.status;
}

/**
 * Check if error is a server error
 */
export function isServerError(error: ApiError): boolean {
  return !!error.status && error.status >= 500;
}

/**
 * Check if error is a client error
 */
export function isClientError(error: ApiError): boolean {
  return !!error.status && error.status >= 400 && error.status < 500;
}