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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = [
  { id: 'source', label: 'Source Asset', icon: ImageIcon, color: 'text-blue-500' },
  { id: 'audio', label: 'Audio Chaining', icon: Mic, color: 'text-purple-500' },
  { id: 'video', label: 'Video Chaining', icon: Video, color: 'text-emerald-500' },
  { id: 'text', label: 'VLM Description', icon: Type, color: 'text-amber-500' },
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

  const [sourceImage, setSourceImage] = useState<string | null>(null);

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

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('text-xs font-medium', className)}>{children}</span>;
}
