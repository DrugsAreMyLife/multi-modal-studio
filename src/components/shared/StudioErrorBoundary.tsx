'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
  name: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class StudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-background/50 flex h-full w-full items-center justify-center p-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">
              {this.props.name} crashed
            </h3>
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              Something went wrong while rendering this studio. The error has been logged, but you
              can try resetting the component.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleReset} variant="outline" className="gap-2">
                <RefreshCcw size={16} />
                Reset {this.props.name}
              </Button>
              <p className="text-muted-foreground mt-4 overflow-hidden text-[10px] text-ellipsis whitespace-nowrap opacity-50">
                {this.state.error?.message}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
