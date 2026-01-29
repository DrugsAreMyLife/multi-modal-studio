'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Zap,
  Maximize2,
  Sparkles,
  Film,
  Droplets,
  Sun,
  Contrast,
  Layers,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { GradingApplyResponse } from '@/lib/types/grading';

export function GradingStudio() {
  const [videoUrl, setVideoUrl] = useState(
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  );
  const [gradedImageUrl, setGradedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grading' | 'upscaling'>('grading');

  // Grading State
  const [exposure, setExposure] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [activeLUT, setActiveLUT] = useState('Natural');

  // Upscaling State
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [interpolation, setInterpolation] = useState(true);

  const LUTS = [
    { name: 'Natural', color: 'bg-zinc-500' },
    { name: 'Teal & Orange', color: 'bg-cyan-500' },
    { name: 'Noir', color: 'bg-zinc-900' },
    { name: 'Bleach Bypass', color: 'bg-stone-500' },
    { name: 'Vintage 35mm', color: 'bg-amber-800' },
    { name: 'Cyberpunk', color: 'bg-fuchsia-600' },
  ];

  const handleProcess = async () => {
    if (activeTab === 'upscaling') {
      // Upscaling not implemented in Phase 1
      toast.info('Temporal upscaling will be implemented in Phase 4');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/grading/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: videoUrl, // Video URL used as input for now
          lutUrl:
            activeLUT !== 'Natural'
              ? `/luts/${activeLUT.toLowerCase().replace(/ /g, '_')}.cube`
              : undefined,
          brightness: exposure,
          saturation: saturation,
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Grading failed');

      const result: GradingApplyResponse = await response.json();

      if (result.status === 'completed' && result.gradedImageUrl) {
        setGradedImageUrl(result.gradedImageUrl);
        toast.success('Neural Color Fusion optimized and rendered.');
      }
    } catch (err) {
      toast.error('Grading failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      {/* Left Panel: High Fidelity Preview */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold italic">
              <Palette className="text-primary" /> Grading & Fidelity
            </h1>
            <p className="text-muted-foreground text-sm">
              Neural color fusion and temporal super-resolution
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'grading' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('grading')}
              className="gap-2"
            >
              <Droplets size={14} /> Look Fusion
            </Button>
            <Button
              variant={activeTab === 'upscaling' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('upscaling')}
              className="gap-2"
            >
              <Maximize2 size={14} /> Upscaling
            </Button>
          </div>
        </div>

        <Card className="group relative flex-1 overflow-hidden border-white/5 bg-black/60 shadow-2xl">
          <video
            src={gradedImageUrl || videoUrl}
            className="h-full w-full object-contain"
            style={{
              filter:
                activeTab === 'grading' && !gradedImageUrl
                  ? `brightness(${1 + exposure / 100}) saturate(${saturation})`
                  : 'none',
            }}
            autoPlay
            loop
            muted
          />

          {/* Split Screen Comparison Bar (Visual Only) */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 backdrop-blur-md">
            <div className="absolute top-1/2 -left-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <RefreshCw size={10} className="text-white opacity-40" />
            </div>
          </div>

          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge
              variant="outline"
              className="border-white/10 bg-black/60 text-[9px] backdrop-blur-sm"
            >
              BEFORE: 720p 30FPS
            </Badge>
            <Badge
              variant="outline"
              className="bg-primary/20 text-primary border-primary/20 text-[9px]"
            >
              AFTER: 4K 60FPS (Neural)
            </Badge>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Maximize2 className="text-primary h-12 w-12 animate-spin" />
              <p className="mt-4 animate-pulse text-sm font-bold tracking-widest uppercase">
                Propagating Neural Tones...
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Right Panel: Advanced Controls */}
      <div className="flex w-80 flex-col gap-6">
        <Card className="flex flex-col gap-6 border-white/5 bg-black/40 p-6">
          {activeTab === 'grading' ? (
            <>
              <div className="flex items-center gap-2">
                <Film size={18} className="text-primary" />
                <h3 className="font-bold">LUT Spectrum</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {LUTS.map((lut) => (
                  <button
                    key={lut.name}
                    onClick={() => setActiveLUT(lut.name)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-3 transition-all',
                      activeLUT === lut.name
                        ? 'border-primary bg-primary/10 shadow-primary/5 shadow-lg'
                        : 'border-white/5 bg-white/5 hover:bg-white/10',
                    )}
                  >
                    <div className={cn('h-8 w-full rounded-md shadow-inner', lut.color)} />
                    <span className="text-[10px] font-bold tracking-tighter uppercase">
                      {lut.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-50">
                    <div className="flex items-center gap-1">
                      <Sun size={10} /> Exposure
                    </div>
                    <span>{exposure > 0 ? `+${exposure}` : exposure}%</span>
                  </div>
                  <Slider
                    value={[exposure]}
                    onValueChange={([v]) => setExposure(v)}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-50">
                    <div className="flex items-center gap-1">
                      <Contrast size={10} /> Vibrance
                    </div>
                    <span>{saturation.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[saturation * 10]}
                    onValueChange={([v]) => setSaturation(v / 10)}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <h3 className="font-bold">Super-Resolution</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase opacity-50">
                    Resolution Factor
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 4, 8].map((f) => (
                      <Button
                        key={f}
                        variant={upscaleFactor === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUpscaleFactor(f)}
                        className="h-8 border-white/5 text-xs"
                      >
                        x{f}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">Temporal Interpolation</p>
                      <p className="text-[10px] opacity-40">Smooth 30fps to 60fps+</p>
                    </div>
                    <Button
                      variant={interpolation ? 'default' : 'secondary'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setInterpolation(!interpolation)}
                    >
                      {interpolation ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">Denoise & Refine</p>
                      <p className="text-[10px] opacity-40">Suppress GAN artifacts</p>
                    </div>
                    <Button variant="default" size="icon" className="h-8 w-8">
                      <CheckCircle2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleProcess} className="shadow-primary/20 w-full gap-2 shadow-lg">
            <Zap size={14} /> {activeTab === 'grading' ? 'Fuse Look' : 'Boost Fidelity'}
          </Button>
        </Card>

        <Card className="flex-1 border-white/5 bg-black/40 p-6">
          <div className="mb-4 flex items-center gap-2 text-emerald-500">
            <Layers size={18} />
            <h3 className="font-bold">Hardware Acceleration</h3>
          </div>

          <div className="space-y-3 opacity-60">
            <div className="flex items-center justify-between text-[11px]">
              <span>Tensor Engine</span>
              <span className="font-mono text-emerald-500">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>VRAM Pressure</span>
              <span className="font-mono">4.2 GB</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-2/3 bg-emerald-500/40" />
            </div>
          </div>

          <div className="bg-primary/10 border-primary/20 mt-8 rounded-xl border p-4">
            <p className="text-[10px] text-zinc-400 italic">
              Neural grading uses "Look-Ahead" temporal analysis to ensure your color grade doesn't
              flicker between frames.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
