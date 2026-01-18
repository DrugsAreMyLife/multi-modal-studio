'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Play,
  Bot,
  Download,
  Check,
  Loader2,
  Cloud,
  Server,
  Network,
  Settings,
  RefreshCw,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SUPPORTED_MODELS,
  ModelConfig,
  ModelCategory,
  LOCAL_PROVIDER_PRESETS,
  ModelProviderId,
} from '@/lib/models/supported-models';
import { AIModel } from '@/lib/models';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MultiModelSelectorProps {
  onStartComparison: (selectedModels: AIModel[]) => void;
  onCancel: () => void;
}

const CATEGORIES: { id: ModelCategory; label: string; icon: any }[] = [
  { id: 'cloud', label: 'Cloud Platforms', icon: Cloud },
  { id: 'local', label: 'Local / Self-Hosted', icon: Server },
  { id: 'aggregator', label: 'Aggregators', icon: Network },
];

// Helper function for VRAM badge color
const getVRAMBadgeColor = (vram: string): string => {
  const gb = parseInt(vram);
  if (gb < 8) return 'bg-green-500';
  if (gb <= 16) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Providers to manage dynamics for
const CUSTOM_PROVIDERS: { id: ModelProviderId; label: string }[] = [
  { id: 'lmstudio', label: 'LM Studio' },
  { id: 'litelm', label: 'LiteLM' },
  { id: 'llamacpp', label: 'llama.cpp' },
  { id: 'text-gen-webui', label: 'TextGenWebUI' },
  { id: 'kobold', label: 'KoboldCpp' },
];

export function MultiModelSelector({ onStartComparison, onCancel }: MultiModelSelectorProps) {
  const [slots, setSlots] = useState<(ModelConfig | null)[]>([null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ModelCategory>('cloud');

  // Local Model State
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<number>(0);
  const [pullStatus, setPullStatus] = useState<string>('');
  const [installedModels, setInstalledModels] = useState<Set<string>>(new Set());
  const [selectedQuantizations, setSelectedQuantizations] = useState<Record<string, string>>({});

  // Dynamic Discovery State
  const [connectionSettings, setConnectionSettings] = useState<Record<string, string>>(() => {
    // Initialize with presets
    return Object.entries(LOCAL_PROVIDER_PRESETS).reduce(
      (acc, [key, preset]) => {
        acc[key] = preset.baseUrl;
        return acc;
      },
      {} as Record<string, string>,
    );
  });
  const [discoveredModels, setDiscoveredModels] = useState<ModelConfig[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Initial Checks
  useEffect(() => {
    checkOllamaModels();

    // Auto-discover if on local tab
    if (activeTab === 'local' || activeTab === 'aggregator') {
      discoverExternalModels();
    }
  }, [activeTab]);

  const checkOllamaModels = async () => {
    try {
      const res = await fetch('/api/models/local/tags');
      if (res.ok) {
        const data = await res.json();
        const normalized = new Set<string>();
        data?.models?.forEach((m: any) => {
          normalized.add(m.model);
          // Also add base name if it contains a tag
          if (m.model.includes(':')) normalized.add(m.model.split(':')[0]);
        });
        setInstalledModels(normalized);
      }
    } catch (e) {
      console.warn('Ollama check failed', e);
    }
  };

  const discoverExternalModels = async () => {
    setIsDiscovering(true);
    let allNewModels: ModelConfig[] = [];

    // Parallel fetch for all enabled providers
    const promises = CUSTOM_PROVIDERS.map(async (provider) => {
      const baseUrl = connectionSettings[provider.id];
      if (!baseUrl) return [];

      try {
        const res = await fetch(
          `/api/models/external/list?baseUrl=${encodeURIComponent(baseUrl)}&providerId=${provider.id}`,
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.models || [];
      } catch (e) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    allNewModels = results.flat();

    setDiscoveredModels(allNewModels);
    setIsDiscovering(false);
  };

  // ... Slot Management (Same as before)
  const handleModelSelect = (model: ModelConfig) => {
    const newSlots = [...slots];
    newSlots[activeSlotIndex] = model;
    setSlots(newSlots);
  };

  const addSlot = () => {
    if (slots.length < 4) {
      setSlots([...slots, null]);
      setActiveSlotIndex(slots.length);
    }
  };

  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    if (newSlots.length === 0) newSlots.push(null);
    setSlots(newSlots);
    setActiveSlotIndex(0);
  };

  const startPull = async (model: ModelConfig) => {
    if (!model.pullString) return;
    setDownloadingModelId(model.modelId);
    setPullProgress(0);
    setPullStatus('Starting...');

    try {
      const response = await fetch('/api/models/local/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model.pullString }),
      });

      if (!response.ok) throw new Error('Pull failed');
      if (!response.body) throw new Error('No stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.status) setPullStatus(json.status);
            if (json.total && json.completed) {
              setPullProgress((json.completed / json.total) * 100);
            }
          } catch (e) {}
        }
      }
      setInstalledModels((prev) => new Set(prev).add(model.pullString!));
      toast.success(`${model.name} pulled!`);
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setDownloadingModelId(null);
    }
  };

  const renderModelList = () => {
    // Combine static supported models + discovered models
    const staticModels = SUPPORTED_MODELS.filter((m) => m.category === activeTab);
    // Filter discovered models that match current tab
    // (We assumed discovered are 'local', but LiteLM might be 'aggregator' if configured so.
    // Ideally local-ai.ts sets category. It currently hardcodes 'local'.)
    // Let's force any model from 'litelm' to be 'aggregator' logic if desired, but user likely sees it as local tool.
    // For simplicity, we show discovered models in 'local' mostly.

    // Dynamic Filter:
    const dynamicModels = discoveredModels; // .filter(m => m.category === activeTab) -- local-ai sets 'local'.

    const displayModels =
      activeTab === 'local' ? [...staticModels, ...dynamicModels] : staticModels;

    if (displayModels.length === 0) {
      return (
        <div className="text-muted-foreground flex h-48 flex-col items-center justify-center">
          <p>No models found for {activeTab}.</p>
          {activeTab === 'local' && (
            <Button variant="link" onClick={discoverExternalModels} className="mt-2">
              <RefreshCw size={14} className="mr-2" /> Scan Local Providers
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2">
        {displayModels.map((model) => {
          const isReady =
            model.providerId !== 'ollama' ||
            installedModels.has(model.modelId) ||
            (model.pullString && installedModels.has(model.pullString));
          const isDownloading = downloadingModelId === model.modelId;
          const isSelected = slots.some((s) => s?.modelId === model.modelId);
          const isDiscovered = !SUPPORTED_MODELS.find((m) => m.modelId === model.modelId);

          return (
            <div
              key={`${model.providerId}-${model.modelId}`}
              className={cn(
                'group border-border/50 bg-card hover:bg-accent/5 relative flex flex-col rounded-xl border p-4 text-left transition-all',
                isSelected ? 'ring-primary bg-primary/5 ring-2' : '',
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      isDiscovered
                        ? 'bg-purple-500/10 text-purple-500'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    <Bot size={18} />
                  </div>
                  <div className="truncate">
                    <div className="truncate font-semibold">{model.name}</div>
                    <div className="text-muted-foreground flex gap-2 text-xs">
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        {model.providerId}
                      </Badge>
                      <span>{(model.contextWindow || 0) / 1000}k Ctx</span>
                      {model.vramRequirement && (
                        <Badge
                          className={`${getVRAMBadgeColor(
                            model.vramRequirement,
                          )} h-4 px-1 text-[9px] text-white`}
                        >
                          {model.vramRequirement} VRAM
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {model.providerId === 'ollama' && !isReady ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-2"
                    onClick={() => startPull(model)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Download size={14} />
                    )}
                    {isDownloading ? 'Pulling...' : 'Get'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant={isSelected ? 'secondary' : 'default'}
                    onClick={() => handleModelSelect(model)}
                    disabled={isSelected}
                    className="h-8"
                  >
                    {isSelected ? <Check size={14} /> : 'Select'}
                  </Button>
                )}
              </div>

              {/* Quantization Selector */}
              {model.quantizations && model.quantizations.length > 1 && (
                <div className="mt-2 mb-2">
                  <Label className="mb-1 block text-xs font-medium">Quantization</Label>
                  <Select
                    value={selectedQuantizations[model.modelId] || model.quantizations[0]}
                    onValueChange={(value) => {
                      setSelectedQuantizations({
                        ...selectedQuantizations,
                        [model.modelId]: value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {model.quantizations.map((quant) => (
                        <SelectItem key={quant} value={quant} className="text-xs">
                          {quant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tips */}
              {model.tips && (
                <div className="text-muted-foreground/80 mt-2 space-y-1 text-xs">
                  {model.tips.slice(0, 2).map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {tip}
                    </div>
                  ))}
                </div>
              )}

              {/* Downloading State */}
              {isDownloading && (
                <div className="bg-background/80 absolute inset-x-4 bottom-4 z-10 rounded-lg border p-3 shadow-lg backdrop-blur">
                  <div className="mb-1 flex justify-between text-xs font-medium">
                    <span>{pullStatus}</span>
                    <span>{Math.round(pullProgress)}%</span>
                  </div>
                  <Progress value={pullProgress} className="h-1.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const ConnectionSettings = () => (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <h4 className="leading-none font-semibold">Connection Settings</h4>
        <p className="text-muted-foreground text-xs">Configure local provider URLs.</p>
      </div>
      <div className="grid gap-3">
        {CUSTOM_PROVIDERS.map((p) => (
          <div key={p.id} className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor={p.id} className="text-xs">
              {p.label}
            </Label>
            <Input
              id={p.id}
              className="col-span-2 h-7 text-xs"
              value={connectionSettings[p.id] || ''}
              onChange={(e) =>
                setConnectionSettings({ ...connectionSettings, [p.id]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
      <Button size="sm" className="h-7 w-full text-xs" onClick={() => discoverExternalModels()}>
        <RefreshCw size={12} className="mr-2" /> Test & Discover
      </Button>
    </div>
  );

  return (
    <div className="bg-background/95 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-white/10"
      >
        {/* Header */}
        <div className="bg-muted/5 flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Server size={20} className="text-primary" />
              Model Hub
            </h2>
            <p className="text-muted-foreground text-sm">
              Configure your intelligence stack. Mix Cloud, Local, and Aggregator models.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings size={16} /> Connections
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <ConnectionSettings />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ... Left Slot Config (Same as before) ... */}
          <div className="bg-muted/10 flex w-64 flex-col gap-3 overflow-y-auto border-r p-4">
            {/* ... Slot rendering code omitted for brevity but logic remains same ... */}
            {/* Re-implementing slot rendering since we overwriting file */}
            <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              comparison slots
            </div>
            {slots.map((slot, idx) => (
              <div
                key={idx}
                onClick={() => setActiveSlotIndex(idx)}
                className={cn(
                  'cursor-pointer rounded-lg border p-3 transition-all',
                  activeSlotIndex === idx
                    ? 'bg-background border-primary ring-primary/20 shadow-sm ring-1'
                    : 'bg-card border-border hover:border-primary/50',
                  !slot && 'border-dashed opacity-70',
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium">Slot {idx + 1}</span>
                  {slot && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlot(idx);
                      }}
                    >
                      <X size={10} />
                    </Button>
                  )}
                </div>
                {slot ? (
                  <div className="truncate text-sm font-semibold">{slot.name}</div>
                ) : (
                  <div className="text-muted-foreground text-sm italic">Empty</div>
                )}
              </div>
            ))}
            {slots.length < 4 && (
              <Button variant="outline" className="border-dashed" onClick={addSlot}>
                <Plus size={14} className="mr-2" /> Add Slot
              </Button>
            )}
          </div>

          {/* Right: Model Browser */}
          <div className="bg-background/50 flex min-w-0 flex-1 flex-col">
            <div className="bg-background/95 z-20 flex items-center justify-between border-b px-6 pt-4 backdrop-blur-sm">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as ModelCategory)}
                className="w-full"
              >
                <TabsList className="h-12 w-full justify-start gap-6 bg-transparent p-0">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="data-[state=active]:border-primary h-full rounded-none px-0 font-medium transition-all data-[state=active]:border-b-2"
                    >
                      <cat.icon size={16} className="mr-2" /> {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {activeTab === 'local' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => discoverExternalModels()}
                  disabled={isDiscovering}
                >
                  <RefreshCw size={14} className={cn('mr-2', isDiscovering && 'animate-spin')} />
                  {isDiscovering ? 'Scanning...' : 'Scan'}
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 p-6">{renderModelList()}</ScrollArea>

            {/* Footer */}
            <div className="bg-background/95 flex items-center justify-end gap-3 border-t p-4 backdrop-blur">
              <div className="text-muted-foreground mr-auto pl-2 text-xs">
                {slots.filter((s) => s).length} selected
              </div>
              {slots.some((s) => s) && (
                <Button
                  size="lg"
                  className="shadow-primary/20 shadow-xl"
                  onClick={() => {
                    const validSlots = slots.filter((s) => s !== null) as ModelConfig[];
                    const legacyModels: AIModel[] = validSlots.map((m) => ({
                      id: m.modelId,
                      name: m.name,
                      providerId: m.providerId,
                      description: m.tips?.[0],
                      contextWindow: m.contextWindow,
                      pricing: { inputPerMillion: 0, outputPerMillion: 0, currency: 'USD' }, // Simplified for local
                    }));
                    onStartComparison(legacyModels);
                  }}
                >
                  <Play size={16} className="mr-2 fill-current" /> Process Comparison
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
