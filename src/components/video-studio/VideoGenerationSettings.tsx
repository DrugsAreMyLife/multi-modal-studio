'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { FineTuneControl } from '@/components/shared/FineTuneControl';
import { SlidersHorizontal, Info, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function VideoGenerationSettings() {
  const { tunes, updateTunes } = useVideoStudioStore();

  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-primary" />
        <span className="text-sm font-semibold">Motion Tuning</span>
      </div>

      <FineTuneControl
        label="Stability"
        value={tunes.stability}
        onChange={(v) => updateTunes({ stability: v })}
        leftLabel="Fluid / Morphing"
        rightLabel="Stable / Consistent"
        tooltip="Higher values reduce flickering and maintain consistent shapes across frames."
      />

      <FineTuneControl
        label="Motion Amplitude"
        value={tunes.amplitude}
        onChange={(v) => updateTunes({ amplitude: v })}
        leftLabel="Subtle / Still"
        rightLabel="High Action"
        tooltip="Controls how much action occurs. Lower values are cinematic/still, higher values are high-energy."
      />

      <FineTuneControl
        label="Coherence"
        value={tunes.coherence}
        onChange={(v) => updateTunes({ coherence: v })}
        leftLabel="Dreamy / Abstract"
        rightLabel="Realistic"
        tooltip="How well the frames adhere to the prompt and previous frames."
      />
      {/* Advanced Video Config */}
      <div className="border-border space-y-4 border-t pt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Advanced Engine
          </span>
        </div>

        {/* Seed Control - Reusing the pattern */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-foreground/80 text-xs">Seed</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-[11px]">
                    A unique number that locks the "noise" of a generation. Use the same seed to
                    iterate on one specific look.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-muted-foreground text-[10px]">Reproducibility</span>
          </div>
          <input
            type="number"
            className="bg-background/30 border-input w-full rounded-md border px-2 py-1 font-mono text-xs"
            placeholder="Random (-1)"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-foreground/80 text-xs">Seamless Loop Mode</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[11px]">
                  Ensures the end of the video matches the beginning for perfectly looping
                  animations.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <input type="checkbox" className="accent-primary" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-foreground/80 text-xs">Frame Interpolation</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[11px]">
                  Generates extra frames between shots for much smoother, higher-framerate motion.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <input type="checkbox" defaultChecked className="accent-primary" />
        </div>

        <div className="bg-border h-px" />

        {/* Pro Tip */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-[10px] font-semibold tracking-wider text-amber-400/80 uppercase">
              Pro Tip: Guidance
            </span>
          </div>
          <Alert className="border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <Info size={14} className="text-amber-400" />
            <AlertTitle className="text-[11px] font-semibold text-amber-200">
              Precise Motion
            </AlertTitle>
            <AlertDescription className="text-[10px] leading-relaxed text-amber-100/70 shadow-sm">
              Struggling with complex shots? Provide both a **Start** and **End** frame. The AI will
              bridge the gap, ensuring your scene ends exactly how you composed it.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
