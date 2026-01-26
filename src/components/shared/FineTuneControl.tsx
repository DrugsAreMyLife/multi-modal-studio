'use client';

import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FineTuneControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  tooltip?: string;
  className?: string;
  gradient?: boolean; // If true, applies blue-orange gradient (mostly for warmth)
}

export function FineTuneControl({
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
  tooltip,
  className,
  gradient = false,
}: FineTuneControlProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {label}
          </span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[11px]">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="font-mono text-xs opacity-50">{value > 0 ? `+${value}` : value}</span>
      </div>

      <div className="text-muted-foreground flex justify-between px-0.5 text-[10px] font-medium tracking-wider uppercase">
        <span className={gradient ? 'text-blue-400' : ''}>{leftLabel}</span>
        <span className={gradient ? 'text-orange-400' : ''}>{rightLabel}</span>
      </div>

      <Slider
        min={-5}
        max={5}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className={cn(
          'py-1',
          gradient && 'from-blue-500 to-orange-500 [&_.bg-primary]:bg-gradient-to-r',
          !gradient && '[&_.bg-primary]:bg-foreground/80',
        )}
      />
    </div>
  );
}
