'use client';

import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: any;
  canRetry: boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx server errors, and timeout errors
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') return true;
    if (error?.status >= 500 && error?.status < 600) return true;
    if (error?.name === 'NetworkError' || error?.name === 'TimeoutError') return true;
    return false;
  },
  onRetry: () => {},
  onMaxAttemptsReached: () => {}
};

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  options: RetryOptions = {}
) {
  const opts = { ...defaultOptions, ...options };
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
    canRetry: true
  });

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1);
    return Math.min(delay, opts.maxDelay);
  }, [opts.initialDelay, opts.backoffFactor, opts.maxDelay]);

  const executeWithRetry = useCallback(async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    let currentAttempt = 0;
    let lastError: any;

    while (currentAttempt < opts.maxAttempts) {
      currentAttempt++;
      
      setState(prev => ({
        ...prev,
        isRetrying: currentAttempt > 1,
        attempt: currentAttempt,
        canRetry: currentAttempt < opts.maxAttempts
      }));

      try {
        const result = await asyncFunction(...args);
        
        // Success - reset state
        setState({
          isRetrying: false,
          attempt: 0,
          lastError: null,
          canRetry: true
        });
        
        return result;
      } catch (error) {
        lastError = error;
        
        setState(prev => ({
          ...prev,
          lastError: error,
          canRetry: currentAttempt < opts.maxAttempts && opts.retryCondition(error)
        }));

        // Check if we should retry
        if (currentAttempt >= opts.maxAttempts || !opts.retryCondition(error)) {
          break;
        }

        // Call retry callback
        opts.onRetry(currentAttempt, error);

        // Wait before retrying
        const delay = calculateDelay(currentAttempt);
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, delay);
        });
      }
    }

    // Max attempts reached or non-retryable error
    setState(prev => ({
      ...prev,
      isRetrying: false,
      canRetry: false
    }));
    
    opts.onMaxAttemptsReached(lastError);
    throw lastError;
  }, [asyncFunction, opts, calculateDelay]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState({
      isRetrying: false,
      attempt: 0,
      lastError: null,
      canRetry: true
    });
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isRetrying: false,
      canRetry: false
    }));
  }, []);

  return {
    execute: executeWithRetry,
    reset,
    cancel,
    ...state
  };
}

// Utility function for one-off retries
export async function retryAsync<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let currentAttempt = 0;
  let lastError: any;

  while (currentAttempt < opts.maxAttempts) {
    currentAttempt++;

    try {
      return await asyncFunction();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (currentAttempt >= opts.maxAttempts || !opts.retryCondition(error)) {
        break;
      }

      // Call retry callback
      opts.onRetry(currentAttempt, error);

      // Wait before retrying
      const delay = opts.initialDelay * Math.pow(opts.backoffFactor, currentAttempt - 1);
      const actualDelay = Math.min(delay, opts.maxDelay);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }

  opts.onMaxAttemptsReached(lastError);
  throw lastError;
}

// Error types for better error handling
export class RetryableError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

// Predefined retry conditions
export const retryConditions = {
  networkErrors: (error: any) => {
    return error?.code === 'NETWORK_ERROR' || 
           error?.name === 'NetworkError' || 
           error?.message?.includes('fetch');
  },
  
  serverErrors: (error: any) => {
    return error?.status >= 500 && error?.status < 600;
  },
  
  timeoutErrors: (error: any) => {
    return error?.code === 'TIMEOUT' || 
           error?.name === 'TimeoutError' || 
           error?.message?.includes('timeout');
  },
  
  rateLimitErrors: (error: any) => {
    return error?.status === 429;
  },
  
  all: (error: any) => {
    return retryConditions.networkErrors(error) ||
           retryConditions.serverErrors(error) ||
           retryConditions.timeoutErrors(error) ||
           retryConditions.rateLimitErrors(error);
  }
};