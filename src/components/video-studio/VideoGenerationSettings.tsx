'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { FineTuneControl } from '@/components/shared/FineTuneControl';
import { SlidersHorizontal } from 'lucide-react';

export function VideoGenerationSettings() {
    const { tunes, updateTunes } = useVideoStudioStore();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal size={16} className="text-primary" />
                <span className="font-semibold text-sm">Motion Tuning</span>
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
            <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Advanced Engine</span>
                </div>

                {/* Seed Control - Reusing the pattern */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs">Seed</span>
                        <span className="text-[10px] text-muted-foreground">Reproducibility</span>
                    </div>
                    <input
                        type="number"
                        className="w-full bg-background/30 border border-input rounded-md px-2 py-1 text-xs font-mono"
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
        </div >
    );
}
