'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Mic2,
  Volume2,
  Waveform,
  Zap,
  Music,
  Settings2,
  Play,
  Circle,
  Save,
  Download,
  Share2,
  Lock,
  History,
  Activity,
  ArrowRight,
  Stethoscope,
  VolumeX,
  AudioLines,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { AudioTtsResponse } from '@/lib/types/audio-tts';
import { Progress } from '@/components/ui/progress';

/**
 * @orchestration-role Voice Identity Synthesis
 * @model NICK_HYBRID (V3)
 * @capability Pharmaceutical Prosody, Zero-Shot Medical Narration
 */
export function AcousticForge() {
  const [prompt, setPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activeVoice, setActiveVoice] = useState('nick-v3-medical');
  const [audioProgress, setAudioProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  const startSynthesis = async () => {
    if (!prompt.trim()) return;
    setIsSynthesizing(true);
    setAudioProgress(0);

    try {
      const response = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt,
          voiceId: activeVoice,
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Synthesis failed');

      const result: AudioTtsResponse = await response.json();

      if (result.status === 'completed' && result.audioUrl) {
        setGeneratedAudioUrl(result.audioUrl);
        setAudioProgress(100);
        toast.success('Synthesis Complete: Medical-Grade Audio Engine', {
          description: 'Vocal identity match: 99.2%. Prosody: Academic.',
        });
      }
    } catch (err) {
      toast.error('Synthesis failed');
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 overflow-hidden bg-[#020202] p-6">
      <TooltipProvider>
        {/* Left: Waveform Visualization & Synthesis Stage */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="flex items-center gap-2 text-2xl font-bold italic">
                <Mic2 className="text-primary" /> Acoustic Forge
              </h1>
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-widest uppercase"
              >
                Voice Clone V3: NICK_HYBRID
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-6 items-center gap-1 border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-500"
              >
                <History size={10} /> Neural History Syncing
              </Badge>
            </div>
          </div>

          <Card className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black p-20 text-center shadow-2xl">
            {/* Waveform Visualization Animation */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0,transparent_100%)]" />

            <div className="relative flex h-32 w-full max-w-2xl items-end justify-center gap-1.5 px-12">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-full rounded-full transition-all duration-300',
                    isSynthesizing ? 'bg-primary animate-audio-pulse' : 'bg-zinc-800',
                  )}
                  style={{
                    height: isSynthesizing ? `${Math.random() * 100 + 20}%` : '8px',
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}

              {/* Playback HUD Overlay */}
              <div className="absolute inset-x-0 -bottom-32 flex flex-col items-center gap-6">
                <div className="flex items-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <RotateCcw size={18} className="text-zinc-500" />
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 group h-20 w-20 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95">
                    <Play
                      size={40}
                      className="ml-2 text-white transition-transform group-hover:scale-110"
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <Save size={18} className="text-zinc-500" />
                  </Button>
                </div>

                <div className="flex w-full max-w-md flex-col items-center gap-2">
                  <div className="flex w-full justify-between text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                    <span>Synthesis progress</span>
                    <span>{audioProgress}%</span>
                  </div>
                  <Progress value={audioProgress} className="h-1.5 w-full bg-white/5" />
                </div>
              </div>
            </div>

            <div className="absolute top-8 left-8 flex origin-top-left scale-90 flex-col gap-2">
              <div className="text-primary/60 flex items-center gap-2 font-mono text-xs font-bold">
                <AudioLines size={14} /> LIVE_SPECTRUM: ACTIVE
              </div>
              <div className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                Timbre Delta: 0.008%
              </div>
            </div>

            {isSynthesizing && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="relative">
                  <Cpu className="text-primary h-16 w-16 animate-spin" />
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 animate-pulse text-amber-500" />
                </div>
                <h2 className="mt-8 text-2xl font-black tracking-[0.3em] text-white uppercase italic">
                  Forging Voice
                </h2>
                <p className="mt-4 max-w-xs text-xs leading-relaxed text-zinc-500 italic">
                  Mapping phoneme lattices to pharmaceutical dialectical structures...
                </p>
              </div>
            )}
          </Card>

          <Card className="border-white/5 bg-black/40 p-5">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <textarea
                  placeholder="Type script here (e.g., 'The estradiol compounding process requires precise thermal regulation...')"
                  className="focus:ring-primary/20 h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-medium tracking-tight outline-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-zinc-600">{prompt.length} chars</span>
                  <Button
                    className="bg-primary hover:bg-primary/90 h-10 gap-2 px-6 font-black tracking-widest uppercase italic shadow-lg"
                    onClick={startSynthesis}
                    disabled={isSynthesizing}
                  >
                    <Zap size={16} /> Synthesize
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Vocal Parameters & Identity Library */}
        <div className="flex w-80 flex-col gap-6">
          <Card className="flex flex-col gap-6 border-white/5 bg-black/40 p-6 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Settings2 size={18} className="text-primary" />
              <h3 className="text-xs font-bold tracking-widest uppercase">Vocal Architect</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black tracking-widest uppercase opacity-40">
                  Pharma-Prosody
                </label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Stability</span>
                      <span>72%</span>
                    </div>
                    <Slider defaultValue={[72]} max={100} step={1} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Medical Term Intensity</span>
                      <span>94%</span>
                    </div>
                    <Slider defaultValue={[94]} max={100} step={1} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>Style Exaggeration</span>
                      <span>35%</span>
                    </div>
                    <Slider defaultValue={[35]} max={100} step={1} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/5 pt-4">
                <label className="text-[10px] font-black tracking-widest uppercase opacity-40">
                  Atmospheric Layering
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Clean Lab', 'Mixing Ambient', 'Academic Hall', 'Gentle Hum'].map((layer) => (
                    <Button
                      key={layer}
                      variant="outline"
                      className={cn(
                        'h-10 border-white/5 text-[9px] font-bold uppercase',
                        layer === 'Clean Lab'
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-white/5 opacity-40',
                      )}
                    >
                      {layer}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <Button
                variant="outline"
                className="h-10 w-full gap-2 border-white/10 text-xs font-black tracking-widest uppercase italic hover:bg-white/5"
              >
                <Stethoscope size={14} className="text-red-500" /> Run Clinical Pronunciation Audit
              </Button>
            </div>
          </Card>

          <Card className="flex flex-1 flex-col gap-6 overflow-hidden border-white/5 bg-black/40 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-amber-500" />
                <h3 className="text-xs font-bold tracking-widest uppercase">Identity Library</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus size={14} />
              </Button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2">
              {[
                { name: 'Nick Hybrid (V3)', type: 'Master Persona', active: true },
                { name: 'Dr. Sterling', type: 'Clinical Neutral', active: false },
                { name: 'Patient Support', type: 'Empathetic', active: false },
                { name: 'Internal QA', type: 'Technical Dry', active: false },
              ].map((voice) => (
                <div
                  key={voice.name}
                  className={cn(
                    'group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all',
                    voice.active
                      ? 'border-primary/40 bg-white/5 shadow-lg'
                      : 'border-white/5 hover:border-white/10',
                  )}
                >
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        'text-[11px] font-black tracking-tight uppercase',
                        voice.active ? 'text-primary' : 'text-zinc-500',
                      )}
                    >
                      {voice.name}
                    </span>
                    <span className="font-mono text-[9px] italic opacity-40">{voice.type}</span>
                  </div>
                  {voice.active ? (
                    <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
                  ) : (
                    <Play size={10} className="opacity-0 group-hover:opacity-40" />
                  )}
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border-primary/10 mt-auto rounded-2xl border p-5">
              <div className="mb-3 flex items-center gap-2">
                <Unlock size={14} className="text-primary" />
                <span className="text-primary text-[10px] font-black tracking-widest uppercase">
                  Biometric Security
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-400 italic">
                Voice identity "Nick Hybrid" is locked to your biometrics. Synthesis requires active
                session authentication.
              </p>
            </div>
          </Card>
        </div>
      </TooltipProvider>
    </div>
  );
}

import { RotateCcw, Plus, Unlock } from 'lucide-react';
