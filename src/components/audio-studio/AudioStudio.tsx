'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { WaveformCanvas } from './WaveformCanvas';
import { VoiceSelector } from './VoiceSelector';
import { AudioControls } from './AudioControls';
import { QwenTTSPanel } from './QwenTTSPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Composer } from './daw/Composer';
import {
  Play,
  Mic,
  Download,
  Music as MusicIcon,
  AudioLines,
  LayoutList,
  Sparkles,
  GraduationCap,
  Settings2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { GenerationSkeleton } from '@/components/ui/generation-skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AudioStudio() {
  const {
    mode,
    prompt,
    setPrompt,
    isPlaying,
    setIsPlaying,
    addClip,
    clips,
    fetchVoices,
    selectedVoiceId,
    voices,
    qwenMode,
    cloneRef,
    xVectorOnlyMode,
    voiceDescription,
    styleInstruction,
    selectedLanguage,
    trainingSamples,
    setActiveTrainingJob,
    // Voice tuning parameters
    stability,
    similarity,
    voiceStyle,
    useSpeakerBoost,
    setParams,
  } = useAudioStudioStore();

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const [viewMode, setViewMode] = useState<'generate' | 'compose'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Check if selected voice is a Qwen3-TTS voice
  const isQwenVoice =
    selectedVoiceId?.startsWith('qwen-') || selectedVoiceId?.startsWith('trained-');
  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);

  // Get the speaker name from voice ID (e.g., 'qwen-vivian' -> 'Vivian')
  const getQwenSpeaker = useCallback(() => {
    if (!selectedVoiceId?.startsWith('qwen-')) return 'Aiden';
    const speakerMap: Record<string, string> = {
      'qwen-vivian': 'Vivian',
      'qwen-serena': 'Serena',
      'qwen-uncle-fu': 'Uncle_Fu',
      'qwen-dylan': 'Dylan',
      'qwen-eric': 'Eric',
      'qwen-ryan': 'Ryan',
      'qwen-aiden': 'Aiden',
      'qwen-ono-anna': 'Ono_Anna',
      'qwen-sohee': 'Sohee',
    };
    return speakerMap[selectedVoiceId] || 'Aiden';
  }, [selectedVoiceId]);

  const playAudio = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onpause = () => setIsPlaying(false);
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtxRef.current.createMediaElementSource(audioRef.current);
      const newAnalyser = audioCtxRef.current.createAnalyser();
      newAnalyser.fftSize = 256;
      source.connect(newAnalyser);
      newAnalyser.connect(audioCtxRef.current.destination);
      setAnalyser(newAnalyser);
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    audioRef.current.src = url;
    audioRef.current.play();
  };

  const generateWithQwen = async (): Promise<Response> => {
    const baseBody = {
      text: prompt,
      language: selectedLanguage,
    };

    switch (qwenMode) {
      case 'clone':
        if (!cloneRef?.audioUrl) {
          throw new Error('Please upload a reference audio for voice cloning');
        }
        if (!xVectorOnlyMode && !cloneRef.transcript) {
          throw new Error('Please provide a transcript for better cloning quality');
        }
        return fetch('/api/generate/audio/qwen/clone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...baseBody,
            refAudio: cloneRef.audioUrl,
            refText: cloneRef.transcript,
            xVectorOnlyMode,
          }),
        });

      case 'design':
        if (!voiceDescription.trim()) {
          throw new Error('Please describe the voice you want to create');
        }
        return fetch('/api/generate/audio/qwen/design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...baseBody,
            instruct: voiceDescription,
          }),
        });

      case 'custom':
      default:
        return fetch('/api/generate/audio/qwen/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...baseBody,
            speaker: getQwenSpeaker(),
            instruct: styleInstruction,
          }),
        });
    }
  };

  const handleStartTraining = async () => {
    if (trainingSamples.length < 5) {
      toast.error('Need at least 5 samples', {
        description: 'Upload more audio files to start training',
      });
      return;
    }

    const validSamples = trainingSamples.filter((s) => s.transcript && s.validated);
    if (validSamples.length < trainingSamples.length) {
      toast.error('Missing transcripts', {
        description: 'Add transcripts to all samples before training',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('name', `Custom Voice ${Date.now()}`);
      formData.append('language', selectedLanguage);
      formData.append('transcripts', JSON.stringify(trainingSamples.map((s) => s.transcript)));

      trainingSamples.forEach((sample, index) => {
        formData.append(`sample_${index}`, sample.audioFile);
      });

      const response = await fetch('/api/generate/audio/qwen/train', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start training');
      }

      const data = await response.json();

      setActiveTrainingJob({
        id: data.jobId,
        name: data.name,
        status: 'pending',
        progress: 0,
        datasetSize: trainingSamples.length,
        createdAt: Date.now(),
      });

      toast.success('Training started!', {
        description: 'Your custom voice will be ready in 10-30 minutes',
      });
    } catch (err) {
      console.error('Training error:', err);
      toast.error('Failed to start training', { description: (err as Error).message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    // For training mode, handle separately
    if (isQwenVoice && qwenMode === 'train') {
      await handleStartTraining();
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter text to synthesize');
      return;
    }

    setIsGenerating(true);

    try {
      let response: Response;

      if (isQwenVoice) {
        // Route to appropriate Qwen3-TTS endpoint
        response = await generateWithQwen();
      } else {
        // Use existing cloud providers
        const isElevenLabs = selectedVoice?.name.includes('ElevenLabs');
        response = await fetch('/api/generate/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: prompt,
            provider: isElevenLabs ? 'elevenlabs' : 'openai',
            voiceId: selectedVoiceId,
            // ElevenLabs voice tuning parameters
            ...(isElevenLabs && {
              stability,
              similarity_boost: similarity,
              style: voiceStyle,
              use_speaker_boost: useSpeakerBoost,
            }),
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(error.error || 'Failed to generate audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      addClip({
        url,
        waveform: Array.from({ length: 100 }, () => Math.random()),
        duration: 0,
        prompt: prompt,
        mode: mode,
        voiceId: selectedVoiceId || undefined,
        settings: { qwenMode: isQwenVoice ? qwenMode : undefined },
      });

      playAudio(url);
      toast.success('Audio generated!');
    } catch (err) {
      console.error('Audio generation error:', err);
      toast.error('Failed to generate audio', { description: (err as Error).message });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get button text based on mode
  const getButtonText = () => {
    if (isGenerating) return 'Running...';
    if (isQwenVoice && qwenMode === 'train') return 'Start Training';
    return 'Generate Audio';
  };

  const getButtonIcon = () => {
    if (isQwenVoice && qwenMode === 'train') return <GraduationCap size={16} />;
    if (isQwenVoice) return <Sparkles size={16} />;
    return <Mic size={16} />;
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
                      <WaveformCanvas isPlaying={isPlaying} analyser={analyser} />
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

                    {/* Show QwenTTSPanel when a Qwen voice is selected */}
                    {isQwenVoice && (
                      <>
                        <div className="bg-border my-2 h-px" />
                        <QwenTTSPanel />
                      </>
                    )}

                    {/* Only show prompt input for non-training modes */}
                    {!(isQwenVoice && qwenMode === 'train') && (
                      <div className="space-y-2">
                        <label className="px-1 text-xs font-medium">
                          {isQwenVoice && qwenMode === 'design' ? 'Text to Speak' : 'Prompt'}
                        </label>
                        <Textarea
                          placeholder={
                            mode === 'music'
                              ? 'Lo-fi hip hop beat...'
                              : isQwenVoice
                                ? 'Enter the text you want to convert to speech...'
                                : 'Enter text to speak...'
                          }
                          className="bg-background/50 min-h-[100px] resize-none text-sm"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                      </div>
                    )}

                    {!isQwenVoice && (
                      <>
                        <div className="bg-border my-2 h-px" />
                        <AudioControls />

                        {/* ElevenLabs Voice Tuning */}
                        {selectedVoice?.name.includes('ElevenLabs') && (
                          <>
                            <div className="bg-border my-2 h-px" />
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Settings2 size={14} className="text-primary" />
                                <span className="text-xs font-semibold">Voice Tuning</span>
                              </div>

                              {/* Stability */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs">Stability</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info
                                          size={12}
                                          className="text-muted-foreground cursor-help"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs text-xs">
                                        Higher values = more consistent, lower = more expressive
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Slider
                                    value={[stability]}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    onValueChange={([v]) => setParams({ stability: v })}
                                    className="flex-1"
                                  />
                                  <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                                    {stability.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Similarity Boost */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs">Similarity Boost</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info
                                          size={12}
                                          className="text-muted-foreground cursor-help"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs text-xs">
                                        How closely to match the original voice
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Slider
                                    value={[similarity]}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    onValueChange={([v]) => setParams({ similarity: v })}
                                    className="flex-1"
                                  />
                                  <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                                    {similarity.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Style */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs">Style</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info
                                          size={12}
                                          className="text-muted-foreground cursor-help"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs text-xs">
                                        Style exaggeration (v3 feature)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Slider
                                    value={[voiceStyle]}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    onValueChange={([v]) => setParams({ voiceStyle: v })}
                                    className="flex-1"
                                  />
                                  <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                                    {voiceStyle.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Speaker Boost */}
                              <div className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-xs">Speaker Boost</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info
                                          size={12}
                                          className="text-muted-foreground cursor-help"
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs text-xs">
                                        Enhance speaker clarity
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Switch
                                  checked={useSpeakerBoost}
                                  onCheckedChange={(v) => setParams({ useSpeakerBoost: v })}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-border bg-background/50 border-t p-4">
                  <Button
                    className={cn(
                      'h-10 w-full gap-2 border-0 shadow-lg',
                      isQwenVoice
                        ? qwenMode === 'train'
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-500/20 hover:from-amber-500 hover:to-orange-500'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500'
                        : 'shadow-primary/20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500',
                    )}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {getButtonIcon()}
                    {getButtonText()}
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
