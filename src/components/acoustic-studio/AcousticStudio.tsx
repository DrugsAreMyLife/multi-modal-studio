'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  AudioWaveform,
  Sparkles,
  Zap,
  TowerControl as Control,
  Ear,
  Waves,
  Activity,
  Maximize2,
  RefreshCw,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { AudioMasterResponse } from '@/lib/types/audio-master';

export function AcousticStudio() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'mastering' | 'upscaling'>('mastering');
  const [masteredAudioUrl, setMasteredAudioUrl] = useState<string | null>(null);

  // Mastering State
  const [loudness, setLoudness] = useState(80);
  const [clarity, setClarity] = useState(60);
  const [activeProfile, setActiveProfile] = useState('Studio Pro');

  // Upscaling State
  const [sampleRate, setSampleRate] = useState(48); // kHz
  const [bitDepth, setBitDepth] = useState(24);

  const PROFILES = [
    { name: 'Studio Pro', desc: 'Flat/Neutral mastering' },
    { name: 'Analog Warmth', desc: 'Vintage tape saturation' },
    { name: 'Broadcast', desc: 'Aggressive compression' },
    { name: 'Cine-Wide', desc: 'Deep bass & spatial width' },
    { name: 'Podcast', desc: 'Mid-range vocal clarity' },
    { name: 'Lo-Fi Chill', desc: 'Texture & bit-crush' },
    { name: 'Headset Opt.', desc: 'Employee noise cancellation' },
  ];

  const handleProcess = async () => {
    if (activeTab === 'upscaling') {
      toast.info('Neural Super-Resolution for audio will be implemented in Phase 5');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/audio/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: 'Final_Mix_Export_V2.wav', // Sample filename
          targetLufs: -18 + (loudness / 100) * 10,
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Mastering failed');

      const result: AudioMasterResponse = await response.json();

      if (result.status === 'completed' && result.masteredAudioUrl) {
        setMasteredAudioUrl(result.masteredAudioUrl);
        toast.success('Acoustic Mastering optimized and applied.');
      }
    } catch (err) {
      toast.error('Mastering failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      {/* Left Panel: High Fidelity Visualizer */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold italic">
              <Ear className="text-primary" /> Acoustic Studio
            </h1>
            <p className="text-muted-foreground text-sm">
              Neural mastering and audio super-resolution engine
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'mastering' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('mastering')}
              className="gap-2"
            >
              <Gauge size={14} /> Neural Mastering
            </Button>
            <Button
              variant={activeTab === 'upscaling' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab('upscaling')}
              className="gap-2"
            >
              <Maximize2 size={14} /> Super-Res
            </Button>
          </div>
        </div>

        <Card className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-white/5 bg-[#050505] shadow-2xl">
          {/* Dynamic Frequency Visualizer (Mock) */}
          <div className="flex h-64 w-full items-end gap-1 px-12 pb-20">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'bg-primary/40 flex-1 rounded-t-full transition-all duration-300',
                  activeTab === 'upscaling' ? 'bg-emerald-500/40' : 'bg-primary/40',
                )}
                style={{
                  height: `${Math.random() * (isProcessing ? 100 : 40) + 10}%`,
                  opacity: i > 80 && activeTab === 'mastering' ? 0.1 : 1,
                }}
              />
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-8 pt-20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Badge variant="outline" className="border-white/10 bg-black/40 text-[9px]">
                  SOURCE: 16kHz MP3
                </Badge>
                <h3 className="text-xl font-bold tracking-tight italic">Final_Mix_Export_V2.wav</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase opacity-40">Target SNR</p>
                  <p className="text-primary font-mono text-lg font-bold">104 dB</p>
                </div>
                <Button size="icon" className="shadow-primary/20 h-12 w-12 rounded-full shadow-lg">
                  <RefreshCw size={20} />
                </Button>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 px-10 text-center backdrop-blur-sm">
              <Activity className="text-primary mb-4 h-12 w-12 animate-pulse" />
              <p className="text-lg font-bold italic">RECONSTRUCTING SPECTRAL CONTENT</p>
              <p className="mt-2 text-sm opacity-40">
                Neural network predicting high-frequency harmonics...
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Right Panel: Advanced Controls */}
      <div className="flex w-80 flex-col gap-6">
        <Card className="flex flex-col gap-6 border-white/5 bg-black/40 p-6">
          {activeTab === 'mastering' ? (
            <>
              <div className="flex items-center gap-2">
                <Control size={18} className="text-primary" />
                <h3 className="font-bold">Mastering Profile</h3>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {PROFILES.slice(0, 5).map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setActiveProfile(p.name)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-3 transition-all',
                      activeProfile === p.name
                        ? 'border-primary bg-primary/10 shadow-primary/5 shadow-lg'
                        : 'border-white/5 bg-white/5 hover:bg-white/10',
                    )}
                  >
                    <span className="text-[10px] font-bold tracking-widest uppercase">
                      {p.name}
                    </span>
                    <span className="text-[9px] opacity-40">{p.desc}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-50">
                    <span>Loudness (LUFS)</span>
                    <span>-{18 - (loudness / 100) * 10} dB</span>
                  </div>
                  <Slider
                    value={[loudness]}
                    onValueChange={([v]) => setLoudness(v)}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase opacity-50">
                    <span>Spectral Clarity</span>
                    <span>{clarity}%</span>
                  </div>
                  <Slider
                    value={[clarity]}
                    onValueChange={([v]) => setClarity(v)}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-500" />
                <h3 className="font-bold">Audio Super-Res</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase opacity-50">
                    Sample Rate (kHz)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[44.1, 48, 96].map((f) => (
                      <Button
                        key={f}
                        variant={sampleRate === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSampleRate(f)}
                        className="h-8 border-white/5 text-[10px]"
                      >
                        {f}k
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">harmonic Reconstruction</p>
                      <p className="text-[10px] opacity-40">Predict lost high frequencies</p>
                    </div>
                    <div className="bg-primary h-4 w-4 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">Dither & Refine</p>
                      <p className="text-[10px] opacity-40">24-bit depth expansion</p>
                    </div>
                    <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleProcess} className="shadow-primary/20 w-full gap-2 shadow-lg">
            <Zap size={14} /> {activeTab === 'mastering' ? 'Publish Master' : 'Execute Upscale'}
          </Button>
        </Card>

        <Card className="flex-1 border-white/5 bg-black/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <AudioWaveform size={18} className="text-emerald-500" />
            <h3 className="font-bold">Phase Coherence</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold tracking-tighter uppercase opacity-40">Stereo Image</span>
              <span className="font-mono text-emerald-500">CORRELATED</span>
            </div>
            <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-black/60">
              {/* Lissajous/Phase Vector Scope Mock */}
              <Waves className="absolute h-32 w-32 rotate-45 animate-pulse text-emerald-500/20" />
              <Waves className="text-primary/20 absolute h-32 w-32 -rotate-45 animate-pulse" />
              <div className="absolute top-1/2 h-px w-full bg-white/5" />
              <div className="absolute left-1/2 h-full w-px bg-white/5" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
