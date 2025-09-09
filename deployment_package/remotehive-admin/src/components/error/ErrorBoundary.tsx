'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Bug, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showDetails?: boolean;
  enableReporting?: boolean;
  level?: 'page' | 'component' | 'widget';
  name?: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true, name } = this.props;
    
    this.setState({ errorInfo });
    
    // Log error details
    console.error('ErrorBoundary caught an error:', {
      name,
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Report error to monitoring service
    if (enableReporting) {
      this.reportError(error, errorInfo);
    }
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: this.props.level || 'component',
        name: this.props.name || 'Unknown Component'
      };

      // Send to error reporting service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    this.setState({ isRetrying: true });
    
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Retry after a delay
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      });
      
      toast.success('Component reloaded successfully');
    }, 1000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorText = `Error ID: ${errorId}\n\nError: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`;
    
    navigator.clipboard.writeText(errorText).then(() => {
      toast.success('Error details copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy error details');
    });
  };

  private getErrorSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const { error } = this.state;
    const { level } = this.props;
    
    if (!error) return 'low';
    
    // Determine severity based on error type and component level
    if (level === 'page') return 'critical';
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) return 'medium';
    if (error.name === 'TypeError' && error.message.includes('Cannot read property')) return 'high';
    if (error.name === 'ReferenceError') return 'high';
    
    return 'medium';
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  private getRecoveryActions(): Array<{ label: string; action: () => void; variant?: 'default' | 'destructive' | 'outline' }> {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;
    const severity = this.getErrorSeverity();
    
    const actions = [];
    
    // Retry action (if not exceeded max retries)
    if (retryCount < maxRetries) {
      actions.push({
        label: `Retry (${retryCount}/${maxRetries})`,
        action: this.handleRetry,
        variant: 'default' as const
      });
    }
    
    // Copy error details
    actions.push({
      label: 'Copy Error',
      action: this.handleCopyError,
      variant: 'outline' as const
    });
    
    // Reload page for critical errors
    if (severity === 'critical' || retryCount >= maxRetries) {
      actions.push({
        label: 'Reload Page',
        action: this.handleReload,
        variant: 'destructive' as const
      });
    }
    
    return actions;
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, isRetrying } = this.state;
    const { children, fallback, showDetails = true, level = 'component', name } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const severity = this.getErrorSeverity();
      const recoveryActions = this.getRecoveryActions();

      return (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">
                  {level === 'page' ? 'Page Error' : level === 'widget' ? 'Widget Error' : 'Component Error'}
                </CardTitle>
                <Badge className={this.getSeverityColor(severity)}>
                  {severity.toUpperCase()}
                </Badge>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {errorId}
              </Badge>
            </div>
            <CardDescription>
              {name && `Error in ${name}: `}
              {error.message || 'An unexpected error occurred'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Actions */}
            <div className="flex flex-wrap gap-2">
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  size="sm"
                  onClick={action.action}
                  disabled={isRetrying}
                >
                  {isRetrying && action.label.includes('Retry') ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : action.label.includes('Copy') ? (
                    <Copy className="h-3 w-3 mr-1" />
                  ) : action.label.includes('Reload') ? (
                    <ExternalLink className="h-3 w-3 mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Error Details */}
            {showDetails && (
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Technical Details</summary>
                    <div className="mt-2 space-y-2 text-xs font-mono">
                      <div>
                        <strong>Error Type:</strong> {error.name}
                      </div>
                      <div>
                        <strong>Message:</strong> {error.message}
                      </div>
                      {error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 whitespace-pre-wrap bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      {errorInfo?.componentStack && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </AlertDescription>
              </Alert>
            )}

            {/* Help Text */}
            <div className="text-sm text-muted-foreground">
              {severity === 'critical' && (
                <p>This is a critical error that affects the entire page. Please reload to continue.</p>
              )}
              {severity === 'high' && (
                <p>This error may affect functionality. Try refreshing the component or contact support if it persists.</p>
              )}
              {severity === 'medium' && (
                <p>A component failed to load. This usually resolves itself on retry.</p>
              )}
              {severity === 'low' && (
                <p>A minor error occurred. The application should continue to work normally.</p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
}