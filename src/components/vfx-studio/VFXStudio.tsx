'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
  Pipette,
  Maximize2,
  Combine,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { VfxCompositeResponse } from '@/lib/types/vfx';

interface Layer {
  id: string;
  name: string;
  type: 'subject' | 'background' | 'overlay';
  visible: boolean;
  locked: boolean;
  opacity: number;
  url: string;
}

export function VFXStudio() {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: '1',
      name: 'Main Subject',
      type: 'subject',
      visible: true,
      locked: false,
      opacity: 100,
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: '2',
      name: 'Cyberpunk Cityscape',
      type: 'background',
      visible: true,
      locked: true,
      opacity: 100,
      url: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?auto=format&fit=crop&q=80&w=800',
    },
  ]);

  const [activeLayerId, setActiveLayerId] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleVisibility = (id: string) => {
    setLayers(layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  };

  const toggleLock = (id: string) => {
    setLayers(layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
  };

  const handleCompositing = async () => {
    const subject = layers.find((l) => l.type === 'subject' && l.visible);
    const background = layers.find((l) => l.type === 'background' && l.visible);

    if (!subject || !background) {
      toast.error('Need at least one subject and one background layer');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/vfx/composite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectUrl: subject.url,
          backgroundUrl: background.url,
          mode: 'alpha-matting',
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Compositing failed');

      const result: VfxCompositeResponse = await response.json();

      if (result.status === 'completed' && result.compositionUrl) {
        const newLayer: Layer = {
          id: `comp-${Date.now()}`,
          name: 'Neural Composition',
          type: 'overlay',
          visible: true,
          locked: false,
          opacity: 100,
          url: result.compositionUrl,
        };
        setLayers([newLayer, ...layers]);
        setActiveLayerId(newLayer.id);
        toast.success('Compositing engine synchronized. Layers merged.');
      }
    } catch (err) {
      toast.error('Feathering failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold italic">
              <Combine className="text-primary" /> VFX Layer Studio
            </h1>
            <p className="text-muted-foreground text-sm">
              Non-destructive neural compositing and alpha matting
            </p>
          </div>
          <Button
            onClick={handleCompositing}
            className="shadow-primary/20 gap-2 shadow-lg"
            disabled={isProcessing}
          >
            {isProcessing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles size={14} />}
            Render Composition
          </Button>
        </div>

        <Card className="relative flex-1 overflow-hidden border-white/5 bg-black/60 shadow-2xl">
          {/* Layer Stack Preview */}
          <div className="relative h-full w-full">
            {layers
              .filter((l) => l.visible)
              .reverse()
              .map((layer, idx) => (
                <div
                  key={layer.id}
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    opacity: layer.opacity / 100,
                    zIndex: idx,
                  }}
                >
                  <img
                    src={layer.url}
                    className={cn(
                      'h-full w-full object-cover',
                      layer.type === 'subject' && 'translate-y-10 scale-75',
                    )}
                    style={{
                      filter: layer.type === 'background' ? 'blur(10px) brightness(0.5)' : 'none',
                    }}
                  />
                </div>
              ))}
          </div>

          <div className="absolute top-4 left-4 flex gap-2">
            <Badge
              variant="outline"
              className="border-white/10 bg-black/60 text-[9px] tracking-tighter uppercase backdrop-blur-sm"
            >
              4K Composition Path
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/20 bg-emerald-500/10 text-[9px] tracking-tighter text-emerald-500 uppercase"
            >
              Live Alpha Matting
            </Badge>
          </div>
        </Card>
      </div>

      <div className="flex w-80 flex-col gap-6">
        <Card className="flex flex-1 flex-col gap-4 border-white/5 bg-black/40">
          <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-primary" />
              <h3 className="text-xs font-bold tracking-wider uppercase">Layer Stack</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Maximize2 size={12} />
            </Button>
          </div>

          <div className="flex-1 overflow-auto px-4 pb-6">
            <div className="space-y-2">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={cn(
                    'group flex cursor-pointer flex-col gap-3 rounded-xl border p-3 transition-all',
                    activeLayerId === layer.id
                      ? 'border-primary bg-primary/5 shadow-primary/5 shadow-lg'
                      : 'border-white/5 bg-white/5 hover:bg-white/10',
                  )}
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                        <img src={layer.url} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold">{layer.name}</p>
                        <p className="text-[9px] tracking-widest uppercase opacity-40">
                          {layer.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(layer.id);
                        }}
                      >
                        {layer.visible ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} className="opacity-40" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(layer.id);
                        }}
                      >
                        {layer.locked ? (
                          <Lock size={14} />
                        ) : (
                          <Unlock size={14} className="opacity-40" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {activeLayerId === layer.id && (
                    <div className="animate-in fade-in slide-in-from-top-1 space-y-3 border-t border-white/5 pt-2 duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold uppercase opacity-50">
                          Blending Mode
                        </label>
                        <span className="text-primary font-mono text-[9px]">Neural Alpha</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-bold uppercase opacity-50">
                            Opacity
                          </label>
                          <span className="font-mono text-[10px]">{layer.opacity}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-white/10">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${layer.opacity}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-white/5 bg-black/20 p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-9 gap-2 border-white/10 text-[10px] font-bold uppercase"
              >
                <ImageIcon size={14} /> Add Layer
              </Button>
              <Button
                variant="outline"
                className="h-9 gap-2 border-white/10 text-[10px] font-bold uppercase"
              >
                <Pipette size={14} /> Sample Alpha
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
