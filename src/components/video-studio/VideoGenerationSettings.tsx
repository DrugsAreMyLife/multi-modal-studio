'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { FineTuneControl } from '@/components/shared/FineTuneControl';
import { SlidersHorizontal } from 'lucide-react';

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
      />

      <FineTuneControl
        label="Motion Amplitude"
        value={tunes.amplitude}
        onChange={(v) => updateTunes({ amplitude: v })}
        leftLabel="Subtle / Still"
        rightLabel="High Action"
      />

      <FineTuneControl
        label="Coherence"
        value={tunes.coherence}
        onChange={(v) => updateTunes({ coherence: v })}
        leftLabel="Dreamy / Abstract"
        rightLabel="Realistic"
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
            <span className="text-xs">Seed</span>
            <span className="text-muted-foreground text-[10px]">Reproducibility</span>
          </div>
          <input
            type="number"
            className="bg-background/30 border-input w-full rounded-md border px-2 py-1 font-mono text-xs"
            placeholder="Random (-1)"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs">Seamless Loop Mode</span>
          <input type="checkbox" className="accent-primary" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs">Frame Interpolation</span>
          <input type="checkbox" defaultChecked className="accent-primary" />
        </div>
      </div>
    </div>
  );
}
