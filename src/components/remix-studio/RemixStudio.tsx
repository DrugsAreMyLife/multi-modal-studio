'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Combine,
  ArrowRight,
  Image as ImageIcon,
  Mic,
  Video,
  Type,
  Zap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useRemixStudioStore } from '@/lib/store/remix-studio-store';
import { remixOrchestrator } from '@/lib/orchestration/remix-orchestrator';
import { lipSyncAdapter } from '@/lib/providers/video/lipsync-adapter';
import { useChatWithModel } from '@/lib/hooks/useChatWithModel';
import { useSemanticTransform } from '@/hooks/useSemanticTransform';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

const STEPS = [
  { id: 'source', label: 'Source Asset', icon: ImageIcon, color: 'text-blue-500' },
  { id: 'audio', label: 'Audio Chaining', icon: Mic, color: 'text-purple-500' },
  { id: 'video', label: 'Video Chaining', icon: Video, color: 'text-emerald-500' },
  { id: 'sync', label: "Director's Remix", icon: Sparkles, color: 'text-amber-500' },
  { id: 'semantic', label: 'Semantic Remix', icon: Zap, color: 'text-rose-500' },
];

export function RemixStudio() {
  const {
    activeStep,
    nextStep,
    prevStep,
    setStep,
    activePackets,
    addPacket,
    isProcessing,
    setProcessing,
    clearPackets,
  } = useRemixStudioStore();

  const { sendMessage } = useChatWithModel({
    modelId: 'qwen-vl-max', // Use a VLM for semantic remix
  });

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [semanticChat, setSemanticChat] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([
    {
      role: 'assistant',
      content:
        "I've analyzed your image's DNA. What would you like to remix or transform? (e.g., 'Make it cyberpunk', 'Change the lighting to sunset')",
    },
  ]);
  const [semanticInput, setSemanticInput] = useState('');

  const handleStartRemix = () => {
    if (!sourceImage) {
      toast.error('Please select a source image first');
      return;
    }
    nextStep();
  };

  const handleAudioChain = async () => {
    setProcessing(true);
    try {
      const packet = await remixOrchestrator.imageToAudioMood(sourceImage!, {
        prompt: 'Atmospheric landscape',
      });
      addPacket(packet);
      toast.success('Mood extracted! Audio parameters generated.');
      nextStep();
    } catch (err) {
      toast.error('Remix failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleLipSync = async (videoUrl: string, audioUrl: string) => {
    setProcessing(true);
    try {
      const response = await lipSyncAdapter.sync({
        videoUrl,
        audioUrl,
        model: 'hedra',
      });

      if (response.success && response.resultUrl) {
        toast.success("Director's Remix complete! Audio and video are synced.");
        addPacket({
          id: `remix-sync-${Date.now()}`,
          sourceModality: 'video',
          targetModality: 'video',
          data: response.resultUrl,
          metadata: { synced: true, videoUrl, audioUrl },
          status: 'completed',
        });
      }
    } catch (err) {
      toast.error('Lip-sync failed');
    } finally {
      setProcessing(false);
    }
  };

  const { transform, isProcessing: isTransforming } = useSemanticTransform();

  const handleSemanticExecute = async () => {
    if (!semanticInput.trim()) return;

    const userMsg = semanticInput;
    setSemanticInput('');
    setSemanticChat((prev) => [...prev, { role: 'user', content: userMsg }]);

    try {
      const response = await transform(sourceImage!, userMsg);

      setSemanticChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.content || `Neural remix operation queued (Job: ${response.jobId})`,
        },
      ]);

      toast.success('Semantic transformation applied to latent queue');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Combine className="text-primary animate-pulse" />
            Remix Engine
          </h1>
          <p className="text-muted-foreground text-sm">
            Orchestrate multimodal chains with SOTA models
          </p>
        </div>
        <div className="bg-muted/50 flex items-center gap-2 rounded-xl border border-white/5 p-1">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <Button
                variant={activeStep === i ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-8 gap-2 rounded-lg px-3 transition-all',
                  activeStep === i && 'bg-background shadow-lg',
                )}
                onClick={() => i <= activeStep && setStep(i)}
              >
                <step.icon size={14} className={activeStep === i ? step.color : 'opacity-40'} />
                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wider uppercase',
                    activeStep !== i && 'opacity-40',
                  )}
                >
                  {step.label}
                </span>
              </Button>
              {i < STEPS.length - 1 && <ChevronRight size={12} className="mx-1 opacity-20" />}
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid h-full grid-cols-2 gap-6"
            >
              <Card className="hover:border-primary/50 group flex flex-col items-center justify-center border-2 border-dashed p-12 transition-all">
                <div className="bg-primary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-transform group-hover:scale-110">
                  <ImageIcon size={32} className="text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Select Source Asset</h3>
                <p className="text-muted-foreground mb-6 text-center text-sm">
                  Start with an image to extract its mood and stylistic DNA
                </p>
                <Button onClick={() => setSourceImage('https://picsum.photos/800/600')}>
                  Use Sample Image
                </Button>
              </Card>

              <div className="flex flex-col gap-4">
                <Card className="group relative flex-1 overflow-hidden">
                  {sourceImage ? (
                    <img src={sourceImage} className="h-full w-full object-cover" />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-sm italic">
                      No image selected
                    </div>
                  )}
                  {sourceImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="secondary" size="sm" onClick={() => setSourceImage(null)}>
                        Clear Selection
                      </Button>
                    </div>
                  )}
                </Card>
                <Button
                  size="lg"
                  className="shadow-primary/20 h-14 gap-3 text-lg font-bold shadow-xl"
                  disabled={!sourceImage}
                  onClick={handleStartRemix}
                >
                  Start Remix Flow <ArrowRight />
                </Button>
              </div>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex h-full flex-col gap-6"
            >
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-1 space-y-4 p-6">
                  <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500">
                    Modality: Image
                  </Badge>
                  <img
                    src={sourceImage!}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase opacity-60">Extracted VLM Labels</Label>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[9px]">
                        Cyberpunk
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        Atmospheric
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        Ethereal
                      </Badge>
                    </div>
                  </div>
                </Card>

                <div className="col-span-2 flex flex-col gap-6">
                  <Card className="flex flex-1 flex-col items-center justify-center space-y-6 p-8 text-center">
                    <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-purple-500/10">
                      <Mic size={40} className="text-purple-500" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="mb-2 text-xl font-bold">Chaining to Audio</h3>
                      <p className="text-muted-foreground text-sm">
                        Using a Vision-Language Model to interpret the visual mood and translate it
                        into high-fidelity audio prompts.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="h-12 gap-2 bg-purple-500 px-8 shadow-xl shadow-purple-500/20 hover:bg-purple-600"
                      onClick={handleAudioChain}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <RotateCcw className="animate-spin" /> : <Play size={18} />}
                      Execute Audio Chain
                    </Button>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
          {activeStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex h-full flex-col gap-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <Card className="space-y-4 p-6">
                  <div className="flex items-center gap-2">
                    <Video size={18} className="text-emerald-500" />
                    <h3 className="font-bold">Select Video Source</h3>
                  </div>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {activePackets
                        .filter((p) => p.targetModality === 'video')
                        .map((packet) => (
                          <div
                            key={packet.id}
                            className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/5 bg-black/40 p-2 transition-all hover:border-emerald-500/50"
                          >
                            <video
                              src={packet.data}
                              className="aspect-video w-full rounded-md object-cover"
                            />
                            <div className="mt-2 flex items-center justify-between px-1">
                              <span className="text-[10px] opacity-60">Generated Video</span>
                              <Button size="sm" variant="secondary" className="h-6 text-[10px]">
                                Use This
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </Card>

                <Card className="space-y-4 p-6">
                  <div className="flex items-center gap-2">
                    <Mic size={18} className="text-purple-500" />
                    <h3 className="font-bold">Select Audio Source</h3>
                  </div>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {activePackets
                        .filter((p) => p.targetModality === 'audio')
                        .map((packet) => (
                          <div
                            key={packet.id}
                            className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/5 bg-black/40 p-3 transition-all hover:border-purple-500/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                                <Play size={14} className="text-purple-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium">Cloned Voice Wrap</p>
                                <p className="text-muted-foreground line-clamp-1 text-[10px]">
                                  {packet.metadata.audioPrompt}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="mt-2 h-6 w-full text-[10px]"
                            >
                              Use This
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              <Card className="bg-primary/5 border-primary/20 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Sparkles size={32} className="text-primary" />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-xl font-bold">Ready to Pair?</h3>
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-500"
                  >
                    Multilingual Pro
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-6 max-w-md text-sm">
                  AI-driven phoneme alignment works with <b>any language</b>. We will synchronize
                  the character's lip movements and facial expressions to match your selected audio.
                </p>
                <Button
                  size="lg"
                  className="h-12 gap-2 px-10 shadow-xl"
                  disabled={isProcessing}
                  onClick={() => {
                    const video = activePackets.find((p) => p.targetModality === 'video')?.data;
                    const audio = activePackets.find((p) => p.targetModality === 'audio')?.data;
                    if (video && audio) handleLipSync(video, audio);
                    else toast.error('Please select both a video and an audio asset');
                  }}
                >
                  {isProcessing ? <RotateCcw className="animate-spin" /> : <Sparkles size={18} />}
                  Execute Director's Remix
                </Button>
              </Card>
            </motion.div>
          )}
          {activeStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex h-full flex-col gap-6"
            >
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-1 border-white/5 bg-black/20 p-4">
                  <Label className="mb-2 block text-[10px] font-bold tracking-widest uppercase opacity-60">
                    Target Asset
                  </Label>
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                    <img src={sourceImage!} className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase opacity-60">DNA Analysis</Label>
                      <Badge variant="outline" className="text-[9px]">
                        VLM 2.1
                      </Badge>
                    </div>
                    <div className="bg-background/40 rounded-lg p-3 text-[11px] leading-relaxed text-zinc-400">
                      "A high-contrast cinematic portrait with neon lighting and ethereal
                      atmosphere. Subject has sharp features and reflective textures."
                    </div>
                  </div>
                </Card>

                <div className="col-span-2 flex flex-col gap-4">
                  <Card className="flex flex-1 flex-col border-white/5 bg-black/40">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {semanticChat.map((msg, i) => (
                          <div
                            key={i}
                            className={cn(
                              'flex',
                              msg.role === 'user' ? 'justify-end' : 'justify-start',
                            )}
                          >
                            <div
                              className={cn(
                                'max-w-[85%] rounded-2xl p-3 text-sm shadow-sm',
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-zinc-800 text-zinc-100',
                              )}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="border-t border-white/5 p-4">
                      <div className="relative">
                        <Textarea
                          placeholder="Type your semantic transformation..."
                          className="bg-background/40 min-h-[80px] resize-none pr-12 text-sm"
                          value={semanticInput}
                          onChange={(e) => setSemanticInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSemanticExecute();
                            }
                          }}
                        />
                        <Button
                          className="absolute right-2 bottom-2 h-8 w-8 rounded-full p-0"
                          onClick={handleSemanticExecute}
                          disabled={!semanticInput.trim() || isProcessing}
                        >
                          {isProcessing ? (
                            <RotateCcw size={14} className="animate-spin" />
                          ) : (
                            <ArrowRight size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Button
                    variant="default"
                    className="h-12 w-full gap-2 shadow-xl shadow-rose-500/10"
                    onClick={() => toast.success('Neural remix operation queued')}
                  >
                    <Zap size={18} className="text-rose-400" />
                    Execute Semantic Transformation
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          disabled={activeStep === 0 || isProcessing}
        >
          <ChevronLeft className="mr-2" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearPackets}>
            Reset Engine
          </Button>
        </div>
      </div>
    </div>
  );
}

function SmallLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('text-xs font-medium', className)}>{children}</span>;
}
