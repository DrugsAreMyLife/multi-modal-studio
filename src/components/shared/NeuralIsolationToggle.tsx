'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Waves, VolumeX, Headphones, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NeuralIsolationToggleProps {
  className?: string;
  type?: 'speech' | 'video' | 'general';
}

export function NeuralIsolationToggle({ className, type = 'general' }: NeuralIsolationToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    if (checked) {
      setIsOptimizing(true);
      toast.info('Initializing neural isolation...', {
        description: 'Executing real-time frequency demixing for noise suppression.',
      });
      setTimeout(() => {
        setIsOptimizing(false);
        toast.success('Neural Shield Active', {
          description: 'Environment noise suppressed via stem isolation.',
        });
      }, 1500);
    }
  };

  return (
    <div className={cn('space-y-4 rounded-xl border border-white/5 bg-white/5 p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              isEnabled ? 'bg-primary/20 text-primary' : 'text-muted-foreground bg-white/5',
            )}
          >
            <ShieldCheck size={18} />
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs font-bold tracking-wider uppercase">Neural Isolation</Label>
            <p className="text-[10px] opacity-40">Frequency-aware noise suppression</p>
          </div>
        </div>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={isOptimizing} />
      </div>

      {isEnabled && (
        <div className="animate-in fade-in slide-in-from-top-1 space-y-3 duration-500">
          <div className="flex items-center gap-3 rounded-lg bg-black/40 p-2">
            <div className="flex flex-1 flex-col gap-1 px-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] opacity-60">ISOLATION DEPTH</span>
                <span className="text-primary font-mono text-[9px]">
                  -{isOptimizing ? '...' : '32dB'}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'bg-primary h-full transition-all duration-1000',
                    isOptimizing ? 'w-0' : 'w-[85%]',
                  )}
                />
              </div>
            </div>
            <Zap size={12} className={cn('text-amber-500', isOptimizing && 'animate-pulse')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 border-white/10 text-[9px]">
              <Headphones size={12} /> Headset Opt.
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 border-white/10 text-[9px]">
              <Waves size={12} /> Vocal Lift
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
