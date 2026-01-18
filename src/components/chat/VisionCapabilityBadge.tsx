'use client';

import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VisionCapabilityBadgeProps {
  hasVision: boolean;
  className?: string;
}

export function VisionCapabilityBadge({ hasVision, className = '' }: VisionCapabilityBadgeProps) {
  if (!hasVision) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={`gap-1 ${className}`}>
            <Eye className="h-3 w-3" />
            <span className="text-xs">Vision</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This model can analyze images and answer questions about them</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
