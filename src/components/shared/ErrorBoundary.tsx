'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `ErrorBoundary caught an error in ${this.props.name || 'component'}:`,
      error,
      errorInfo,
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-background/50 flex h-full w-full items-center justify-center p-6 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in w-full max-w-md space-y-6 duration-300">
            <Alert
              variant="destructive"
              className="border-red-500/20 bg-red-500/10 py-6 text-red-500"
            >
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="mb-2 text-lg font-bold">Studio Crashed</AlertTitle>
              <AlertDescription className="text-sm leading-relaxed opacity-90">
                Something went wrong in the{' '}
                <span className="font-mono font-bold">{this.props.name || 'Studio'}</span>. We've
                intercepted the failure to keep the rest of the app running.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReset}
                className="h-11 w-full gap-2 border-0 bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600"
              >
                <RefreshCcw size={16} />
                Reload Studio
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
                className="h-11 w-full gap-2 border-white/10 bg-white/5 hover:bg-white/10"
              >
                <Home size={16} />
                Return to Dashboard
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="max-h-40 overflow-auto rounded-lg border border-white/5 bg-black/40 p-4">
                <p className="mb-2 font-mono text-[10px] text-zinc-500 uppercase">Debug Trace</p>
                <pre className="font-mono text-[10px] text-red-400/80">
                  {this.state.error?.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
