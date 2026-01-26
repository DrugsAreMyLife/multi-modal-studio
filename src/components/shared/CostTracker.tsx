import React, { useEffect, useState } from 'react';
import { Coins, TrendingUp, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface CostTrackerProps {
  userId?: string;
}

export function CostTracker({ userId }: CostTrackerProps) {
  const [usage, setUsage] = useState({
    totalCost: 0,
    tokenCount: 0,
    dailyLimit: 500, // cents
    currentDayUsage: 0,
  });

  useEffect(() => {
    // In a real implementation, we would poll /api/billing/usage
    const mockInterval = setInterval(() => {
      setUsage((prev) => ({
        ...prev,
        currentDayUsage: Math.min(prev.dailyLimit, prev.currentDayUsage + Math.random() * 2),
      }));
    }, 10000);

    return () => clearInterval(mockInterval);
  }, []);

  const percentage = (usage.currentDayUsage / usage.dailyLimit) * 100;
  const costFormatted = (usage.currentDayUsage / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <Card className="bg-background/40 overflow-hidden border-white/5 shadow-2xl backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Coins className="text-amber-400" size={16} />
            <span>Usage & Credits</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Approximate cost based on token usage across providers.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight">{costFormatted}</p>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Today's Estimated Cost
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <TrendingUp size={12} />
              <span>Live</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-muted-foreground flex justify-between text-[10px] font-medium">
            <span>DAILY QUOTA</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <Progress value={percentage} className="h-1.5" />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-lg border border-white/5 bg-white/5 p-2">
            <p className="text-muted-foreground mb-1 text-[10px]">TOKENS</p>
            <p className="text-sm font-semibold">12.4k</p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/5 p-2">
            <p className="text-muted-foreground mb-1 text-[10px]">API CALLS</p>
            <p className="text-sm font-semibold">42</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
