'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Music,
  Mic2,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Waves,
  Play,
  Pause,
  Split,
  History,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NeuralIsolationToggle } from '@/components/shared/NeuralIsolationToggle';
import { useStemStudioStore } from '@/lib/store/stem-studio-store';
import type { AudioDemixResponse } from '@/lib/types/audio-demix';

interface AudioStem {
  id: string;
  name: string;
  icon: any;
  volume: number;
  muted: boolean;
  color: string;
}

export function StemStudio() {
  const [videoUrl, setVideoUrl] = useState(
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  );
  const {
    sourceAudioUrl,
    setSourceAudio,
    stems: storeStems,
    setStems: setStoreStems,
    isProcessing,
    setProcessing,
    updateStem: updateStoreStem,
  } = useStemStudioStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleStemSeparation = async () => {
    if (!videoUrl) {
      toast.error('No source audio found');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/audio/demix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: videoUrl, async: false }),
      });

      if (!response.ok) throw new Error('Demixing failed');

      const result: AudioDemixResponse = await response.json();

      if (result.status === 'completed' && result.stemUrls) {
        const newStems = Object.entries(result.stemUrls).map(([type, url]) => ({
          id: type,
          type: type as any,
          url,
          volume: 100,
          isMuted: false,
          isSoloed: false,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          color:
            type === 'vocals'
              ? '#3b82f6'
              : type === 'drums'
                ? '#f59e0b'
                : type === 'bass'
                  ? '#a855f7'
                  : '#10b981',
          icon:
            type === 'vocals'
              ? Mic2
              : type === 'drums'
                ? Waves
                : type === 'bass'
                  ? Music
                  : Activity,
        }));
        setStoreStems(newStems as any);
        toast.success('Frequency isolation complete. Stems extracted.');
      }
    } catch (err) {
      toast.error('Separation failed');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const updateStem = (id: string, updates: Partial<AudioStem>) => {
    setStems(stems.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      {/* Left Panel: Video Reference */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold italic">
              <Split className="text-primary" /> Audio Stem Studio
            </h1>
            <p className="text-muted-foreground text-sm">
              Frequency isolation and neural track demixing
            </p>
          </div>
          <Button
            onClick={handleStemSeparation}
            disabled={isProcessing}
            className="shadow-primary/20 gap-2 shadow-lg"
          >
            <Sparkles size={14} /> Extract Stems
          </Button>
        </div>

        <Card className="relative aspect-video w-full overflow-hidden border-white/5 bg-black/60 shadow-2xl">
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-black/40 text-white backdrop-blur-md"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </Button>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <Badge
              variant="outline"
              className="border-white/10 bg-black/60 text-[9px] backdrop-blur-sm"
            >
              48kHz Lossless
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/20 bg-emerald-500/10 text-[9px] text-emerald-500"
            >
              Demixed
            </Badge>
          </div>
        </Card>

        {/* Global Waveform Visualization (Mock) */}
        <Card className="flex h-24 items-center justify-center border-white/5 bg-black/40 p-4">
          <div className="flex h-full w-full items-end gap-[2px]">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="bg-primary/20 flex-1 transition-all duration-300"
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  opacity: isPlaying ? 0.8 : 0.3,
                  backgroundColor: i % 10 === 0 ? '#3b82f6' : undefined,
                }}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Right Panel: Stem Controls */}
      <div className="flex w-96 flex-col gap-6">
        <Card className="flex flex-1 flex-col gap-4 border-white/5 bg-black/40 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={18} className="text-primary" />
              <h3 className="text-xs font-bold tracking-wider uppercase">Active Stems</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 hover:opacity-100">
              <Download size={14} />
            </Button>
          </div>

          <NeuralIsolationToggle className="border-primary/20 bg-primary/5 mb-2" />

          <div className="space-y-4">
            {storeStems.map((stem: any) => (
              <div
                key={stem.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border p-4 transition-all',
                  stem.isMuted ? 'opacity-40 grayscale' : 'border-white/5 bg-white/5',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5"
                      style={{ color: stem.color }}
                    >
                      <stem.icon size={16} />
                    </div>
                    <span className="text-xs font-bold">{stem.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateStoreStem(stem.id, { isMuted: !stem.isMuted })}
                    >
                      {stem.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[10px] font-bold text-zinc-500 uppercase"
                    >
                      Solo
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${stem.volume}%`,
                        backgroundColor: stem.color,
                        boxShadow: `0 0 10px ${stem.color}40`,
                      }}
                    />
                  </div>
                  <Slider
                    value={[stem.volume]}
                    onValueChange={([v]) => updateStoreStem(stem.id, { volume: v })}
                    max={100}
                    step={1}
                    className="w-24"
                  />
                </div>

                {/* Stem Specific Mini-Visualization */}
                <div className="flex h-4 w-full items-end gap-px opacity-20">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        height: `${Math.random() * 100}%`,
                        backgroundColor: stem.color,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border-primary/10 mt-auto rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Waves size={14} className="text-primary" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                Spatial Audio Mix
              </span>
            </div>
            <p className="mb-4 text-[10px] leading-relaxed text-zinc-400">
              Re-render audio with adjusted stem levels or export individual tracks for external NLE
              editing.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-8 border-white/10 text-[10px]">
                Export ZIP
              </Button>
              <Button
                variant="outline"
                className="bg-primary/10 border-primary/20 text-primary h-8 text-[10px]"
              >
                Merge Mix
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
