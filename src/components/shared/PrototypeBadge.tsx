'use client';

import { Wrench } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PrototypeBadgeProps {
    className?: string;
}

export function PrototypeBadge({ className }: PrototypeBadgeProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 ${className}`}>
                    <Wrench className="w-3 h-3" />
                    Prototype
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>This integration is not yet connected.</p>
                <p className="text-muted-foreground text-xs">Full functionality coming soon.</p>
            </TooltipContent>
        </Tooltip>
    );
}
