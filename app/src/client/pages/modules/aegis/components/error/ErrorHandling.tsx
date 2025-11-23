/**
 * Error Handling System - Comprehensive error boundaries and handlers
 *
 * Provides error boundaries, error utilities, toast notifications,
 * and centralized error handling for all Aegis forms.
 */

import React, { Component, ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertCircle, XCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../../../components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';

// Error types
interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

interface FormErrorProps {
  error?: string | string[];
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

/**
 * Main Error Boundary Component
 */
export class FormErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error
    console.error('Form Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (Sentry, etc.)
    // logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback error={error} resetErrorBoundary={this.resetErrorBoundary} />
      );
    }

    return children;
  }
}

/**
 * Error Fallback UI Component
 */
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error?: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          Something went wrong
        </CardTitle>
        <CardDescription>
          An unexpected error occurred while processing your form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="font-mono text-sm">
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Form Field Error Display
 */
export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];

  return (
    <div className={`text-sm text-red-500 mt-1 ${className}`}>
      {errors.map((err, index) => (
        <div key={index} className="flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Toast Notification Utilities
 */
export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 4000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="w-4 h-4" />,
      duration: 6000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertCircle className="w-4 h-4" />,
      duration: 5000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="w-4 h-4" />,
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      duration: Infinity,
    });
  },

  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },
};

/**
 * Error Classification and Handling
 */
export class ErrorHandler {
  static classify(error: unknown): AppError {
    if (error instanceof Error) {
      return error as AppError;
    }

    if (typeof error === 'string') {
      return new Error(error) as AppError;
    }

    if (typeof error === 'object' && error !== null) {
      const obj = error as any;
      const err = new Error(obj.message || 'Unknown error') as AppError;
      err.code = obj.code;
      err.statusCode = obj.statusCode;
      err.context = obj.context;
      return err;
    }

    return new Error('Unknown error occurred') as AppError;
  }

  static getErrorMessage(error: unknown): string {
    const classified = this.classify(error);

    // Handle specific error codes
    switch (classified.code) {
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection';
      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action';
      case 'FORBIDDEN':
        return 'Access denied. Please contact an administrator';
      case 'NOT_FOUND':
        return 'The requested resource was not found';
      case 'CONFLICT':
        return 'A conflict occurred. The resource may have been modified';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait and try again';
      default:
        return classified.message || 'An unexpected error occurred';
    }
  }

  static handleFormError(error: unknown, context?: string): void {
    const classified = this.classify(error);
    const message = this.getErrorMessage(classified);

    console.error(`Form error${context ? ` in ${context}` : ''}:`, classified);

    // Show appropriate notification
    if (classified.statusCode === 401 || classified.code === 'UNAUTHORIZED') {
      notify.error('Authentication Error', 'Please log in and try again');
    } else if (classified.statusCode === 403 || classified.code === 'FORBIDDEN') {
      notify.error('Access Denied', message);
    } else if (classified.statusCode === 404 || classified.code === 'NOT_FOUND') {
      notify.error('Not Found', message);
    } else if (classified.statusCode === 409 || classified.code === 'CONFLICT') {
      notify.warning('Conflict', message);
    } else if (classified.statusCode === 429 || classified.code === 'RATE_LIMITED') {
      notify.warning('Rate Limited', message);
    } else {
      notify.error('Error', message);
    }
  }

  static handleValidationErrors(errors: ValidationError[]): void {
    if (errors.length === 1) {
      notify.error('Validation Error', errors[0].message);
    } else {
      const errorList = errors.map((e) => `• ${e.message}`).join('\n');
      notify.error(
        `${errors.length} Validation Errors`,
        `Please fix the following:\n${errorList}`,
      );
    }
  }
}

/**
 * Form Submission Handler
 */
export async function handleFormSubmission<T>(
  submitFn: () => Promise<T>,
  options: {
    loadingMessage?: string;
    successMessage?: string;
    errorContext?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  } = {},
): Promise<{ success: boolean; result?: T; error?: unknown }> {
  const {
    loadingMessage = 'Submitting...',
    successMessage = 'Operation completed successfully',
    errorContext,
    onSuccess,
    onError,
  } = options;

  const toastId = notify.loading(loadingMessage);

  try {
    const result = await submitFn();

    notify.dismiss(toastId);
    notify.success(successMessage);

    onSuccess?.(result);
    return { success: true, result };
  } catch (error) {
    notify.dismiss(toastId);

    ErrorHandler.handleFormError(error, errorContext);
    onError?.(error);

    return { success: false, error };
  }
}

/**
 * Validation Error Helper
 */
export function createValidationError(
  field: string,
  message: string,
  code?: string,
): ValidationError {
  return { field, message, code };
}

/**
 * Network Error Helper
 */
export function isNetworkError(error: unknown): boolean {
  const classified = ErrorHandler.classify(error);
  return (
    classified.code === 'NETWORK_ERROR' ||
    classified.message?.includes('Network Error') ||
    classified.message?.includes('fetch')
  );
}

/**
 * Retry Helper
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isNetworkError(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

/**
 * Error Hook
 */
export function useErrorHandler() {
  const handleError = React.useCallback((error: unknown, context?: string) => {
    ErrorHandler.handleFormError(error, context);
  }, []);

  const handleValidationErrors = React.useCallback(
    (errors: ValidationError[]) => {
      ErrorHandler.handleValidationErrors(errors);
    },
    [],
  );

  const handleSubmission = React.useCallback(
    <T,>(
      submitFn: () => Promise<T>,
      options: Parameters<typeof handleFormSubmission>[1] = {},
    ) => {
      return handleFormSubmission(submitFn, options);
    },
    [],
  );

  return {
    handleError,
    handleValidationErrors,
    handleSubmission,
    notify,
  };
}
