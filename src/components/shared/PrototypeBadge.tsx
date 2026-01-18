'use client';

import { Wrench } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PrototypeBadgeProps {
  className?: string;
}

export function PrototypeBadge({ className }: PrototypeBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 ${className}`}
          >
            <Wrench className="h-3 w-3" />
            Prototype
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>This integration is not yet connected.</p>
          <p className="text-muted-foreground text-xs">Full functionality coming soon.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
