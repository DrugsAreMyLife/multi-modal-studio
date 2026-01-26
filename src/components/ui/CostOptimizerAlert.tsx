'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, TrendingDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findCostOptimization, OptimizationResult } from '@/lib/utils/cost-estimation';
import { cn } from '@/lib/utils';

interface CostOptimizerAlertProps {
  modelId: string;
  className?: string;
  onApply?: (optimizedModelId: string) => void;
}

export function CostOptimizerAlert({ modelId, className, onApply }: CostOptimizerAlertProps) {
  const [suggestion, setSuggestion] = useState<OptimizationResult | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const result = findCostOptimization(modelId);
    setSuggestion(result);
    if (result) setIsVisible(true);
  }, [modelId]);

  if (!suggestion || !isVisible) return null;

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-top-2 relative flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200 shadow-lg backdrop-blur-sm',
        className,
      )}
    >
      <TrendingDown className="h-5 w-5 shrink-0 text-emerald-400" />
      <div className="flex-1 text-xs">
        <p className="font-semibold text-emerald-400">Cost Optimization Available</p>
        <p className="opacity-90">{suggestion.message}</p>
      </div>
      <div className="flex gap-2">
        {onApply && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 bg-emerald-500/20 px-2 text-[10px] hover:bg-emerald-500/30 hover:text-emerald-100"
            onClick={() => {
              onApply(suggestion.recommendedModelId);
              setIsVisible(false);
            }}
          >
            Apply Fix
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-100"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
