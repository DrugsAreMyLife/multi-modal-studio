'use client';

import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AudioControls() {
  const { mode, setMode, stability, similarity, setParams } = useAudioStudioStore();

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Tabs value={mode} onValueChange={(val: any) => setMode(val)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="speech">Speech</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="sfx">SFX</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Parameters */}
      {mode === 'speech' && (
        <>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">Stability</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={12} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-[11px]">
                      High stability makes the voice more consistent and steady. Low stability makes
                      it more emotive and varied, but can sometimes lead to artifacts.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-muted-foreground text-xs">{Math.round(stability * 100)}%</span>
            </div>
            <Slider
              value={[stability]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={([val]) => setParams({ stability: val })}
            />
            <p className="text-muted-foreground text-[10px]">
              High stability makes the voice more consistent, low makes it more expressive.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">Clarity + Similarity</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={12} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-[11px]">
                      Controls how closely the output matches the original speaker's timbre and
                      clarity.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-muted-foreground text-xs">{Math.round(similarity * 100)}%</span>
            </div>
            <Slider
              value={[similarity]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={([val]) => setParams({ similarity: val })}
            />
          </div>
        </>
      )}

      {mode === 'music' && (
        <div className="bg-muted/20 text-muted-foreground rounded-lg p-4 text-center text-xs">
          Music generation uses duration and style prompts. Sliders are disabled for V1.
        </div>
      )}
    </div>
  );
}
