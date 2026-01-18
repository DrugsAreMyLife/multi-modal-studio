'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Here you would typically log to Sentry/LogRocket
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="bg-destructive/10 text-destructive mb-6 flex h-20 w-20 items-center justify-center rounded-full">
              <AlertTriangle size={40} />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              A critical error occurred in the application shell. We've been notified and are
              looking into it.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw size={16} />
                Reload Application
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                Back to Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-muted mt-12 max-w-2xl overflow-auto rounded-lg p-4 text-left font-mono text-xs">
                <p className="text-destructive mb-2 font-bold">{this.state.error?.message}</p>
                <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
              </div>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
