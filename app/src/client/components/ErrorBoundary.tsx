import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, eventId: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Captura erro no Sentry e obtém o eventId
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
    
    this.setState({ eventId });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred. Please try again.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                  {this.state.eventId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Error ID: {this.state.eventId}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Home
                </Button>
                {this.state.eventId && (
                  <Button
                    variant="outline"
                    onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId! })}
                  >
                    Report Feedback
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
