'use client';

import { toast } from 'sonner';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: ApiError) => boolean;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

class ErrorHandlingService {
  private errorLog: ApiError[] = [];
  private maxLogSize = 100;
  private retryAttempts = new Map<string, number>();

  // Default retry configuration
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        !error.statusCode ||
        error.statusCode >= 500 ||
        error.statusCode === 408 ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT'
      );
    }
  };

  /**
   * Handle API errors with automatic retry and user notification
   */
  async handleApiError(
    error: any,
    context: {
      endpoint?: string;
      method?: string;
      operation?: string;
      silent?: boolean;
    } = {},
    retryConfig?: Partial<RetryConfig>
  ): Promise<ApiError> {
    const apiError: ApiError = {
      code: error.code || error.name || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.details || error.response?.data,
      timestamp: new Date().toISOString(),
      endpoint: context.endpoint,
      method: context.method,
      statusCode: error.status || error.statusCode
    };

    // Log the error
    this.logError(apiError);

    // Show user notification if not silent
    if (!context.silent) {
      this.showErrorNotification(apiError, context.operation);
    }

    return apiError;
  }

  /**
   * Retry function with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    const currentAttempts = this.retryAttempts.get(operationId) || 0;

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const apiError = await this.handleApiError(error, { silent: true });
      
      // Check if we should retry
      const shouldRetry = 
        currentAttempts < retryConfig.maxAttempts &&
        (retryConfig.retryCondition ? retryConfig.retryCondition(apiError) : true);

      if (!shouldRetry) {
        this.retryAttempts.delete(operationId);
        throw apiError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, currentAttempts),
        retryConfig.maxDelay
      );

      // Update retry count
      this.retryAttempts.set(operationId, currentAttempts + 1);

      console.log(`Retrying operation ${operationId} in ${delay}ms (attempt ${currentAttempts + 1}/${retryConfig.maxAttempts})`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Recursive retry
      return this.withRetry(operation, operationId, config);
    }
  }

  /**
   * Validate data against rules
   */
  validateData(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);
      const fieldErrors = this.validateField(value, rule);
      errors.push(...fieldErrors.map(msg => ({ field: rule.field, message: msg, value })));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize and normalize data
   */
  sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Remove potentially dangerous properties
        if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }

    if (typeof data === 'string') {
      // Basic XSS prevention
      return data
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    return data;
  }

  /**
   * Create fallback data for failed API calls
   */
  createFallbackData(type: 'metrics' | 'status' | 'health' | 'activity'): any {
    const timestamp = new Date().toISOString();
    
    switch (type) {
      case 'metrics':
        return {
          totalConfigurations: 0,
          runningScrapers: 0,
          jobsScraped: 0,
          successRate: 0,
          avgResponseTime: 0,
          errorRate: 0,
          dataProcessed: 0,
          activeConnections: 0,
          _fallback: true,
          _timestamp: timestamp
        };
        
      case 'status':
        return [];
        
      case 'health':
        return {
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          networkLatency: 0,
          queueSize: 0,
          workerStatus: 'unknown',
          lastHealthCheck: timestamp,
          _fallback: true
        };
        
      case 'activity':
        return [];
        
      default:
        return {
          _fallback: true,
          _timestamp: timestamp
        };
    }
  }

  /**
   * Check if data is stale and needs refresh
   */
  isDataStale(data: any, maxAge: number = 5 * 60 * 1000): boolean {
    if (!data || !data._timestamp) {
      return true;
    }
    
    const age = Date.now() - new Date(data._timestamp).getTime();
    return age > maxAge;
  }

  /**
   * Merge partial data updates safely
   */
  mergeData(existing: any, update: any): any {
    if (!existing || !update) {
      return update || existing;
    }

    // Don't merge if update is a fallback and existing is real data
    if (update._fallback && !existing._fallback) {
      return existing;
    }

    // Deep merge objects
    if (typeof existing === 'object' && typeof update === 'object' && !Array.isArray(existing) && !Array.isArray(update)) {
      const merged = { ...existing };
      for (const [key, value] of Object.entries(update)) {
        if (key === '_timestamp') {
          merged[key] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          merged[key] = this.mergeData(merged[key], value);
        } else {
          merged[key] = value;
        }
      }
      return merged;
    }

    return update;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    byEndpoint: Record<string, number>;
    recent: ApiError[];
  } {
    const byCode: Record<string, number> = {};
    const byEndpoint: Record<string, number> = {};
    
    for (const error of this.errorLog) {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      if (error.endpoint) {
        byEndpoint[error.endpoint] = (byEndpoint[error.endpoint] || 0) + 1;
      }
    }
    
    return {
      total: this.errorLog.length,
      byCode,
      byEndpoint,
      recent: this.errorLog.slice(-10)
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.retryAttempts.clear();
  }

  // Private methods
  private logError(error: ApiError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  private showErrorNotification(error: ApiError, operation?: string): void {
    const title = operation ? `${operation} failed` : 'Operation failed';
    let message = error.message;
    
    // Provide user-friendly messages for common errors
    switch (error.code) {
      case 'NETWORK_ERROR':
        message = 'Network connection failed. Please check your internet connection.';
        break;
      case 'TIMEOUT':
        message = 'Request timed out. The server may be busy.';
        break;
      case 'UNAUTHORIZED':
        message = 'Authentication required. Please log in again.';
        break;
      case 'FORBIDDEN':
        message = 'You do not have permission to perform this action.';
        break;
      case 'NOT_FOUND':
        message = 'The requested resource was not found.';
        break;
      case 'SERVER_ERROR':
        message = 'Server error occurred. Please try again later.';
        break;
    }
    
    toast.error(title, {
      description: message,
      action: error.statusCode && error.statusCode >= 500 ? {
        label: 'Retry',
        onClick: () => window.location.reload()
      } : undefined
    });
  }

  private validateField(value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];
    
    // Required check
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${rule.field} is required`);
      return errors;
    }
    
    // Skip other validations if value is empty and not required
    if (value === null || value === undefined || value === '') {
      return errors;
    }
    
    // Type check
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`${rule.field} must be of type ${rule.type}`);
      }
    }
    
    // Min/Max for numbers and strings
    if (typeof value === 'number' && rule.min !== undefined && value < rule.min) {
      errors.push(`${rule.field} must be at least ${rule.min}`);
    }
    if (typeof value === 'number' && rule.max !== undefined && value > rule.max) {
      errors.push(`${rule.field} must be at most ${rule.max}`);
    }
    if (typeof value === 'string' && rule.min !== undefined && value.length < rule.min) {
      errors.push(`${rule.field} must be at least ${rule.min} characters`);
    }
    if (typeof value === 'string' && rule.max !== undefined && value.length > rule.max) {
      errors.push(`${rule.field} must be at most ${rule.max} characters`);
    }
    
    // Pattern check for strings
    if (typeof value === 'string' && rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${rule.field} format is invalid`);
    }
    
    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${rule.field} is invalid`);
      }
    }
    
    return errors;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export const errorHandlingService = new ErrorHandlingService();
export default ErrorHandlingService;