'use client';

import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AudioControls() {
    const { mode, setMode, stability, similarity, setParams } = useAudioStudioStore();

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <Tabs value={mode} onValueChange={(val: any) => setMode(val)} className="w-full">
                <TabsList className="w-full grid grid-cols-3">
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
                            <Label className="text-xs">Stability</Label>
                            <span className="text-xs text-muted-foreground">{Math.round(stability * 100)}%</span>
                        </div>
                        <Slider
                            value={[stability]}
                            min={0}
                            max={1}
                            step={0.05}
                            onValueChange={([val]) => setParams({ stability: val })}
                        />
                        <p className="text-[10px] text-muted-foreground">High stability makes the voice more consistent, low makes it more expressive.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Label className="text-xs">Clarity + Similarity</Label>
                            <span className="text-xs text-muted-foreground">{Math.round(similarity * 100)}%</span>
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
                <div className="p-4 bg-muted/20 rounded-lg text-xs text-muted-foreground text-center">
                    Music generation uses duration and style prompts. Sliders are disabled for V1.
                </div>
            )}
        </div>
    );
}
