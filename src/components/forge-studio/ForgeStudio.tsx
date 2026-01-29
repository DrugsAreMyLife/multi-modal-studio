'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Hammer,
  Sparkles,
  Settings2,
  Info,
  Upload,
  Image as ImageIcon,
  Zap,
  CheckCircle2,
  BrainCircuit,
  Database,
  Search,
  ChevronRight,
  ShieldCheck,
  History,
  Activity,
  UserCircle2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ForgeTrainingResponse } from '@/lib/types/forge-training';

export function ForgeStudio() {
  const [activeStep, setActiveStep] = useState(1);
  const [isTraining, setIsTraining] = useState(false);
  const [modelType, setModelType] = useState('lora');

  const steps = [
    { id: 1, name: 'Dataset Prep', icon: Database },
    { id: 2, name: 'Hyperparameters', icon: Settings2 },
    { id: 3, name: 'Bake Model', icon: BrainCircuit },
  ];

  const handleStartTraining = async () => {
    setIsTraining(true);

    try {
      const response = await fetch('/api/forge/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: ['https://example.com/mock-id-1.png'], // Placeholder images
          conceptName: 'AI-Nick',
          instancePrompt: 'a photo of AI-Nick person',
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Training failed');

      const result: ForgeTrainingResponse = await response.json();

      if (result.status === 'completed') {
        toast.success('Identity "AI-Nick" specialized. Model stored in Forge.');
      }
    } catch (err) {
      toast.error('Training interrupted by VRAM spike.');
      console.error(err);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#020202]">
      <TooltipProvider>
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-white/5 bg-black/40 p-4 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Hammer size={18} className="text-primary" />
              <h1 className="text-lg font-bold tracking-tight uppercase italic">
                LoRA Forge Studio
              </h1>
            </div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary text-[9px] font-bold tracking-widest uppercase"
            >
              Identity Persistence v4
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-1 text-[10px] font-bold transition-all',
                    activeStep === step.id ? 'bg-primary text-white' : 'opacity-40',
                  )}
                >
                  <step.icon size={12} /> {step.name}
                </div>
              ))}
            </div>
            <Button
              onClick={handleStartTraining}
              disabled={isTraining}
              className="shadow-primary/20 from-primary gap-2 border-none bg-gradient-to-r to-blue-600 shadow-lg"
            >
              <Sparkles size={14} /> Ignite Forge
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Interactive Stage */}
          <div className="flex-1 overflow-auto p-8">
            {activeStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-2xl space-y-8 duration-500">
                <div className="text-center">
                  <h2 className="mb-2 text-2xl font-bold">Dataset Ingestion</h2>
                  <p className="text-sm text-zinc-500 italic">
                    "The better the reference, the sharper the identity."
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Card className="hover:border-primary/30 flex cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed border-white/5 bg-white/5 p-12 transition-all">
                    <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
                      <Upload size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold">Drop identity images here</p>
                      <p className="mt-1 text-xs opacity-40">
                        Accepts PNG, JPG, WEBP (Minimum 20 high-quality photos recommended)
                      </p>
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                        Identity Name
                      </label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={10} className="opacity-40" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          The trigger word that invokes this specific person/style.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      placeholder="e.g. NICK_PHARMACIST"
                      className="text-primary h-10 border-white/10 bg-white/5 font-mono"
                    />
                  </div>

                  <div className="bg-primary/5 border-primary/20 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary" />
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        Dataset Quality Analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[9px] opacity-60">
                          <span>Lighting Consistency</span>
                          <span>92%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[92%] bg-emerald-500" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[9px] opacity-60">
                          <span>Perspective Variety</span>
                          <span>45%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[45%] bg-amber-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-2xl space-y-8 duration-500">
                <div className="text-center">
                  <h2 className="mb-2 text-2xl font-bold">Neural Tuning</h2>
                  <p className="text-sm text-zinc-500 italic">
                    Refine the learning weights for surgical precision.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      name: 'Rank (Network Dim)',
                      val: 32,
                      help: 'Controls the capacity of the LoRA. Higher = more detail but larger file size.',
                    },
                    {
                      name: 'Alpha',
                      val: 16,
                      help: 'Scaling factor for the LoRA weights. Usually half of Rank.',
                    },
                    {
                      name: 'Learning Rate',
                      val: '5e-5',
                      help: 'The speed at which the model learns. Too high causes "burn", too low is blurry.',
                    },
                    {
                      name: 'Training Steps',
                      val: 2500,
                      help: 'Total iterations over the dataset. High steps risk "overfitting" (losing flexibility).',
                    },
                  ].map((p, i) => (
                    <Card key={i} className="flex flex-col gap-3 border-white/5 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black tracking-tighter uppercase opacity-60">
                          {p.name}
                        </label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={12} className="opacity-40" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">{p.help}</TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-primary font-mono text-lg">{p.val}</p>
                      <Slider defaultValue={[50]} max={100} step={1} />
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setActiveStep((prev) => Math.min(prev + 1, 3))}
                className="gap-2 border-white/5 px-8 font-black tracking-widest uppercase italic"
              >
                Next Phase <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          {/* Sidebar: Model Inventory & Status */}
          <div className="flex w-80 flex-col border-l border-white/5 bg-black/40">
            <div className="flex items-center gap-2 p-6 pb-4">
              <History size={16} className="text-primary" />
              <h3 className="text-xs font-black tracking-widest uppercase">Bake History</h3>
            </div>

            <div className="flex-1 space-y-3 overflow-auto p-4">
              {[
                { name: 'Identity: NICK_V1_NATURAL', date: '2 days ago', status: 'ready' },
                { name: 'Identity: NICK_V2_PROFESSIONAL', date: '5 hours ago', status: 'ready' },
                { name: 'Identity: NICK_SCRUB_SUIT', date: 'In Progress', status: 'baking' },
              ].map((model, i) => (
                <Card
                  key={i}
                  className="group hover:border-primary/20 border-white/5 bg-white/5 p-3 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="truncate text-[11px] font-bold">{model.name}</p>
                      <p className="text-[9px] tracking-tighter uppercase opacity-40">
                        {model.date}
                      </p>
                    </div>
                    {model.status === 'ready' ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <Activity size={12} className="text-primary animate-pulse" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-auto border-t border-white/5 bg-black/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black tracking-widest uppercase">
                  Compute Metrics
                </span>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px]">
                    <span>VRAM USAGE</span>
                    <span>22.4 / 24 GB</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[94%] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  </div>
                </div>
                <div className="mt-1 flex justify-between font-mono text-[9px] opacity-40">
                  <span>ETA PER EPOCH</span>
                  <span>42s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
