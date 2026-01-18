'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { WaveformCanvas } from './WaveformCanvas';
import { VoiceSelector } from './VoiceSelector';
import { AudioControls } from './AudioControls';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Composer } from './daw/Composer';
import { Play, Mic, Download, Music as MusicIcon, AudioLines, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { GenerationSkeleton } from '@/components/ui/generation-skeleton';

export function AudioStudio() {
  const { mode, prompt, setPrompt, isPlaying, setIsPlaying, addClip, clips } =
    useAudioStudioStore();

  const [viewMode, setViewMode] = useState<'generate' | 'compose'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
          provider: 'openai', // Default to OpenAI for now
          voiceId: 'alloy',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      addClip({
        url,
        waveform: Array.from({ length: 100 }, () => Math.random()),
        duration: 0,
        prompt: prompt,
        mode: mode,
        settings: {},
      });

      const audio = new Audio(url);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (err) {
      console.error('Audio generation error:', err);
      toast.error('Failed to generate audio', { description: (err as Error).message });
    } finally {
      setIsGenerating(false);
    }
  };

  const activeClips = Object.values(clips).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ErrorBoundary name="Audio Studio">
      <div className="flex h-full w-full flex-col">
        {/* Top Toggle Bar */}
        <div className="border-border bg-background/50 flex h-10 items-center justify-center gap-2 border-b p-1">
          <div className="flex gap-1 rounded-lg bg-black/20 p-1">
            <Button
              variant={viewMode === 'generate' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-2 text-xs"
              onClick={() => setViewMode('generate')}
            >
              <MusicIcon size={12} /> Generator
            </Button>
            <Button
              variant={viewMode === 'compose' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 gap-2 text-xs"
              onClick={() => setViewMode('compose')}
            >
              <LayoutList size={12} /> Composer
            </Button>
          </div>
        </div>

        {/* Main Workspace (Split View) */}
        <div className="relative flex min-h-0 flex-1">
          {viewMode === 'compose' ? (
            <div className="absolute inset-0 p-4">
              <Composer />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1">
              {/* Center visualizer & history */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Top: Visualizer */}
                <div className="relative flex h-64 items-center justify-center overflow-hidden border-b border-white/5 bg-black/40 p-8">
                  <div className="via-background to-background absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 opacity-20" />

                  {isGenerating ? (
                    <div className="relative z-10 w-full max-w-md">
                      <GenerationSkeleton type="audio" />
                    </div>
                  ) : (
                    <>
                      <WaveformCanvas isPlaying={isPlaying} />
                      {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button
                            size="lg"
                            className="h-16 w-16 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-transform hover:scale-105"
                            onClick={() => setIsPlaying(true)}
                          >
                            <Play size={24} className="ml-1" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Bottom: Clip Grid */}
                <div className="bg-background/20 flex flex-1 flex-col overflow-hidden p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <AudioLines size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Generation History</span>
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto md:grid-cols-2 lg:grid-cols-3">
                    {activeClips.length === 0 && !isGenerating && (
                      <div className="text-muted-foreground col-span-full flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-white/10">
                        <MusicIcon size={24} className="mb-2 opacity-50" />
                        <span className="text-xs">No audio generated yet</span>
                      </div>
                    )}

                    {activeClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="bg-background/40 hover:border-primary/30 group rounded-lg border border-white/5 p-3 transition-colors"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <span className="line-clamp-1 text-xs font-medium">{clip.prompt}</span>
                          <span className="text-muted-foreground rounded bg-white/5 px-1 text-[10px] tracking-wider uppercase">
                            {clip.mode}
                          </span>
                        </div>
                        <div className="relative mb-2 h-12 overflow-hidden rounded bg-black/20">
                          <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-between gap-px px-1 pb-1 opacity-50">
                            {(clip.waveform || []).slice(0, 30).map((val, i) => (
                              <div
                                key={i}
                                className="bg-primary flex-1"
                                style={{ height: `${val * 80 + 20}%` }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(clip.createdAt).toLocaleTimeString()}
                          </span>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Play size={10} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Download size={10} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Inspector */}
              <div className="border-border bg-background/60 z-20 flex w-80 flex-col border-l backdrop-blur-xl">
                <ScrollArea className="flex-1">
                  <div className="space-y-6 p-4">
                    <VoiceSelector />

                    <div className="space-y-2">
                      <label className="px-1 text-xs font-medium">Prompt</label>
                      <Textarea
                        placeholder={
                          mode === 'music' ? 'Lo-fi hip hop beat...' : 'Enter text to speak...'
                        }
                        className="bg-background/50 min-h-[100px] resize-none text-sm"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                    </div>

                    <div className="bg-border my-2 h-px" />

                    <AudioControls />
                  </div>
                </ScrollArea>

                <div className="border-border bg-background/50 border-t p-4">
                  <Button
                    className="shadow-primary/20 h-10 w-full gap-2 border-0 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:from-blue-500 hover:to-purple-500"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>Running...</>
                    ) : (
                      <>
                        <Mic size={16} />
                        Generate Audio
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
