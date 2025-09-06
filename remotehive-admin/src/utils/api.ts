/**
 * API utility functions for HTTP requests and response handling
 */

// API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: any;
  status?: number;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Base API configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Create query string from parameters
export const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

// Build full URL with query parameters
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const baseUrl = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.baseURL}${endpoint}`;
  
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const queryString = createQueryString(params);
  const separator = baseUrl.includes('?') ? '&' : '?';
  
  return `${baseUrl}${separator}${queryString}`;
};

// Get authentication headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('admin_token');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Sleep utility for retries
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error.status) return true; // Network errors
  
  // Retry on server errors (5xx) and some client errors
  return error.status >= 500 || error.status === 408 || error.status === 429;
};

// Parse error response
export const parseErrorResponse = async (response: Response): Promise<ApiError> => {
  let errorData: any = {};
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = { message: await response.text() };
    }
  } catch {
    errorData = { message: 'Failed to parse error response' };
  }
  
  return {
    message: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    code: errorData.code || response.status,
    details: errorData.details,
    status: response.status,
  };
};

// Main API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    headers = {},
    body,
    params,
    timeout = API_CONFIG.timeout,
    retries = API_CONFIG.retries,
    retryDelay = API_CONFIG.retryDelay,
  } = config;
  
  const url = buildUrl(endpoint, method === 'GET' ? params : undefined);
  const authHeaders = getAuthHeaders();
  
  const requestConfig: RequestInit = {
    method,
    headers: {
      ...authHeaders,
      ...headers,
    },
    signal: AbortSignal.timeout(timeout),
  };
  
  // Add body for non-GET requests
  if (body && method !== 'GET') {
    if (body instanceof FormData) {
      // Remove Content-Type header for FormData (browser will set it with boundary)
      delete requestConfig.headers!['Content-Type'];
      requestConfig.body = body;
    } else {
      requestConfig.body = JSON.stringify(body);
    }
  }
  
  let lastError: ApiError;
  
  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, requestConfig);
      
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        
        // Don't retry on client errors (except specific ones)
        if (!isRetryableError(error) || attempt === retries) {
          throw error;
        }
        
        lastError = error;
        await sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }
      
      // Parse successful response
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Return standardized response
      return {
        data: data.data || data,
        message: data.message,
        success: true,
        meta: data.meta,
      };
    } catch (error: any) {
      lastError = {
        message: error.message || 'Network request failed',
        code: error.code || 'NETWORK_ERROR',
        details: error.details,
        status: error.status,
      };
      
      // Don't retry on non-retryable errors or last attempt
      if (!isRetryableError(error) || attempt === retries) {
        break;
      }
      
      await sleep(retryDelay * Math.pow(2, attempt));
    }
  }
  
  // Throw the last error if all retries failed
  throw lastError!;
};

// Convenience methods for different HTTP verbs
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'params'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET', params }),
  
  post: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'POST', body }),
  
  put: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'PUT', body }),
  
  patch: <T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'PATCH', body }),
  
  delete: <T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
};

// File upload utility
export const uploadFile = async (
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>,
  onProgress?: (progress: number) => void
): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }
  
  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            data: response.data || response,
            message: response.message,
            success: true,
            meta: response.meta,
          });
        } catch {
          resolve({
            data: xhr.responseText,
            success: true,
          });
        }
      } else {
        reject({
          message: `Upload failed: ${xhr.statusText}`,
          status: xhr.status,
          response: xhr.responseText,
        });
      }
    });
    
    xhr.addEventListener('error', () => {
      reject({
        message: 'Upload failed: Network error',
        code: 'NETWORK_ERROR',
      });
    });
    
    xhr.open('POST', buildUrl(endpoint));
    
    // Add auth headers
    const authHeaders = getAuthHeaders();
    Object.entries(authHeaders).forEach(([key, value]) => {
      if (key !== 'Content-Type') { // Don't set Content-Type for FormData
        xhr.setRequestHeader(key, value);
      }
    });
    
    xhr.send(formData);
  });
};

// Download file utility
export const downloadFile = async (
  endpoint: string,
  filename?: string,
  params?: Record<string, any>
): Promise<void> => {
  try {
    const url = buildUrl(endpoint, params);
    const authHeaders = getAuthHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: authHeaders,
    });
    
    if (!response.ok) {
      throw await parseErrorResponse(response);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    throw error;
  }
};

// Batch request utility
export const batchRequest = async <T = any>(
  requests: Array<{ endpoint: string; config?: RequestConfig }>
): Promise<Array<ApiResponse<T> | ApiError>> => {
  const promises = requests.map(({ endpoint, config }) =>
    apiRequest<T>(endpoint, config).catch(error => error)
  );
  
  return Promise.all(promises);
};

// Request cancellation utility
export const createCancellableRequest = <T = any>(
  endpoint: string,
  config: RequestConfig = {}
) => {
  const controller = new AbortController();
  
  const request = apiRequest<T>(endpoint, {
    ...config,
    headers: {
      ...config.headers,
    },
  });
  
  return {
    request,
    cancel: () => controller.abort(),
  };
};

// Cache utility for GET requests
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cachedRequest = async <T = any>(
  endpoint: string,
  params?: Record<string, any>,
  ttl = 5 * 60 * 1000 // 5 minutes default
): Promise<ApiResponse<T>> => {
  const cacheKey = `${endpoint}?${createQueryString(params || {})}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  
  const response = await api.get<T>(endpoint, params);
  
  cache.set(cacheKey, {
    data: response,
    timestamp: Date.now(),
    ttl,
  });
  
  return response;
};

// Clear cache
export const clearCache = (pattern?: string): void => {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Request interceptors
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: ApiResponse) => ApiResponse | Promise<ApiResponse>;
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
const errorInterceptors: ErrorInterceptor[] = [];

export const addRequestInterceptor = (interceptor: RequestInterceptor): void => {
  requestInterceptors.push(interceptor);
};

export const addResponseInterceptor = (interceptor: ResponseInterceptor): void => {
  responseInterceptors.push(interceptor);
};

export const addErrorInterceptor = (interceptor: ErrorInterceptor): void => {
  errorInterceptors.push(interceptor);
};

// Apply interceptors (this would be integrated into the main apiRequest function)
export const applyRequestInterceptors = async (config: RequestConfig): Promise<RequestConfig> => {
  let modifiedConfig = config;
  
  for (const interceptor of requestInterceptors) {
    modifiedConfig = await interceptor(modifiedConfig);
  }
  
  return modifiedConfig;
};

export const applyResponseInterceptors = async (response: ApiResponse): Promise<ApiResponse> => {
  let modifiedResponse = response;
  
  for (const interceptor of responseInterceptors) {
    modifiedResponse = await interceptor(modifiedResponse);
  }
  
  return modifiedResponse;
};

export const applyErrorInterceptors = async (error: ApiError): Promise<ApiError> => {
  let modifiedError = error;
  
  for (const interceptor of errorInterceptors) {
    modifiedError = await interceptor(modifiedError);
  }
  
  return modifiedError;
};

// Common error handlers
export const handleApiError = (error: ApiError, showToast = true): void => {
  console.error('API Error:', error);
  
  if (showToast && typeof window !== 'undefined') {
    // This would integrate with your toast system
    // toast.error(error.message);
  }
  
  // Handle specific error codes
  switch (error.status) {
    case 401:
      // Redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
      break;
    case 403:
      // Show access denied message
      break;
    case 429:
      // Show rate limit message
      break;
    default:
      // Generic error handling
      break;
  }
};

// API health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};