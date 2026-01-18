'use client';

import { cn } from '@/lib/utils';

interface GenerationSkeletonProps {
  type: 'image' | 'video' | 'audio' | 'text';
  className?: string;
}

export function GenerationSkeleton({ type, className }: GenerationSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {type === 'image' && (
        <div className="space-y-2">
          <div className="bg-muted flex aspect-square items-center justify-center rounded-lg">
            <div className="bg-muted-foreground/20 h-12 w-12 animate-pulse rounded-full" />
          </div>
          <div className="bg-muted h-3 w-3/4 rounded" />
          <div className="bg-muted h-3 w-1/2 rounded" />
        </div>
      )}

      {type === 'video' && (
        <div className="space-y-2">
          <div className="bg-muted relative flex aspect-video items-center justify-center overflow-hidden rounded-lg">
            <div className="via-muted-foreground/10 animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent to-transparent" />
            <div className="border-muted-foreground/20 border-t-muted-foreground/50 h-16 w-16 animate-spin rounded-full border-4" />
          </div>
          <div className="bg-muted h-3 w-2/3 rounded" />
        </div>
      )}

      {type === 'audio' && (
        <div className="bg-muted space-y-2 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-muted-foreground/20 h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted-foreground/20 h-3 w-1/2 rounded" />
              <div className="bg-muted-foreground/10 flex h-8 items-center gap-0.5 rounded px-2">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted-foreground/30 w-1 animate-pulse rounded-full"
                    style={{
                      height: `${Math.random() * 60 + 20}%`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {type === 'text' && (
        <div className="space-y-3 p-4">
          <div className="bg-muted h-4 w-full rounded" />
          <div className="bg-muted h-4 w-5/6 rounded" />
          <div className="bg-muted h-4 w-4/5 rounded" />
          <div className="bg-muted h-4 w-3/4 rounded" />
          <div className="bg-muted h-4 w-2/3 rounded" />
        </div>
      )}
    </div>
  );
}
