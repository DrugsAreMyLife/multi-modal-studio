'use client';

import { useImageStudioStore, AVAILABLE_MODELS } from '@/lib/store/image-studio-store';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { StyleSelector } from './StyleSelector';
import { AspectRatioSelector } from './AspectRatioSelector';
import { Wand2, SlidersHorizontal, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function GenerationSettings() {
  const { selectedModelId, settings, tunes, updateSettings, updateTunes } = useImageStudioStore();
  const activeModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const caps = activeModel.capabilities;

  return (
    <div className="space-y-6">
      {/* Style Selector */}
      <div className="space-y-2">
        <Label className="text-xs">Visual Style</Label>
        <StyleSelector
          value={settings.stylePreset}
          onSelect={(id) => updateSettings({ stylePreset: id })}
        />
      </div>

      {/* Capability: Negative Prompt */}
      {caps.supports_negative_prompt && (
        <div className="space-y-2">
          <Label className="text-xs">Negative Prompt</Label>
          <Input
            className="bg-background/50 text-sm"
            placeholder="What to avoid..."
            value={settings.negativePrompt || ''}
            onChange={(e) => updateSettings({ negativePrompt: e.target.value })}
          />
        </div>
      )}

      {/* Dimensions */}
      <div className="space-y-2">
        <Label className="text-xs">Dimensions & Ratio</Label>
        <AspectRatioSelector
          width={settings.width}
          height={settings.height}
          onSelect={(w, h) => updateSettings({ width: w, height: h })}
        />

        {/* Advanced / Manual Inputs Tie-in */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="relative">
            <Label className="text-muted-foreground absolute top-2 left-2 text-[10px]">W</Label>
            <Input
              type="number"
              className="bg-background/30 h-8 pl-6 text-xs"
              value={settings.width}
              onChange={(e) => updateSettings({ width: Number(e.target.value) })}
            />
          </div>
          <div className="relative">
            <Label className="text-muted-foreground absolute top-2 left-2 text-[10px]">H</Label>
            <Input
              type="number"
              className="bg-background/30 h-8 pl-6 text-xs"
              value={settings.height}
              onChange={(e) => updateSettings({ height: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Fine Tune Controls */}
      <div className="border-border space-y-4 border-t pt-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-primary" />
          <Label className="text-sm font-medium">Fine Tune</Label>
        </div>

        {/* Lighting */}
        <div className="space-y-3">
          <div className="text-muted-foreground flex justify-between text-[10px] font-medium tracking-wider uppercase">
            <span>Dark / Moody</span>
            <span>Bright</span>
          </div>
          <Slider
            min={-5}
            max={5}
            step={1}
            value={[tunes.lighting]}
            onValueChange={([v]) => updateTunes({ lighting: v })}
            className="[&_.bg-primary]:bg-foreground/80"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-3">
          <div className="text-muted-foreground flex justify-between text-[10px] font-medium tracking-wider uppercase">
            <span>Soft</span>
            <span>Dramatic</span>
          </div>
          <Slider
            min={-5}
            max={5}
            step={1}
            value={[tunes.contrast]}
            onValueChange={([v]) => updateTunes({ contrast: v })}
          />
        </div>

        {/* Warmth */}
        <div className="space-y-3">
          <div className="text-muted-foreground flex justify-between text-[10px] font-medium tracking-wider uppercase">
            <span className="text-blue-400">Cool</span>
            <span className="text-orange-400">Warm</span>
          </div>
          <Slider
            min={-5}
            max={5}
            step={1}
            value={[tunes.warmth]}
            onValueChange={([v]) => updateTunes({ warmth: v })}
            className="from-blue-500 to-orange-500 [&_.bg-primary]:bg-gradient-to-r"
          />
        </div>

        {/* Vibrance */}
        <div className="space-y-3">
          <div className="text-muted-foreground flex justify-between text-[10px] font-medium tracking-wider uppercase">
            <span>Muted</span>
            <span>Vivid</span>
          </div>
          <Slider
            min={-5}
            max={5}
            step={1}
            value={[tunes.vibrance]}
            onValueChange={([v]) => updateTunes({ vibrance: v })}
          />
        </div>
      </div>

      {/* Capability: Steps */}
      {caps.supports_steps && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Steps</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-[11px]">
                    More steps generally mean higher detail but take longer to generate. 20-30 is
                    usually the sweet spot.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-muted-foreground text-xs">{settings.steps}</span>
          </div>
          <Slider
            value={[settings.steps || 20]}
            min={1}
            max={50}
            step={1}
            onValueChange={([val]) => updateSettings({ steps: val })}
          />
        </div>
      )}

      {/* Capability: CFG */}
      {caps.supports_cfg && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Guidance Scale (CFG)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-[11px]">
                    High values stick strictly to your text; low values give the AI more artistic
                    freedom. Usually 7-9 is best.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-muted-foreground text-xs">{settings.cfgScale}</span>
          </div>
          <Slider
            value={[settings.cfgScale || 7]}
            min={1}
            max={20}
            step={0.5}
            onValueChange={([val]) => updateSettings({ cfgScale: val })}
          />
        </div>
      )}
      {/* Advanced Settings Section */}
      <div className="border-border space-y-4 border-t pt-4">
        <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Advanced Config
        </Label>

        {/* Seed */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Seed</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[11px]">
                  A unique number that locks the "noise" of a generation. Use the same seed to
                  iterate on one specific look.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              className="bg-background/30 font-mono text-xs"
              placeholder="Random (-1)"
              value={settings.seed === -1 ? '' : settings.seed}
              onChange={(e) => updateSettings({ seed: parseInt(e.target.value) || -1 })}
            />
            <button
              className="rounded-md p-2 transition-colors hover:bg-white/10"
              onClick={() => updateSettings({ seed: Math.floor(Math.random() * 2147483647) })}
              title="Randomize Seed"
            >
              <Wand2 size={14} className="text-primary" />
            </button>
          </div>
        </div>

        {/* Scheduler & Format Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Scheduler</Label>
            <select
              className="bg-background/30 border-input h-9 w-full rounded-md border px-2 text-xs"
              value={settings.scheduler}
              onChange={(e) => updateSettings({ scheduler: e.target.value })}
            >
              <option value="euler_a">Euler A</option>
              <option value="dpm_2m_karras">DPM++ 2M</option>
              <option value="ddim">DDIM</option>
              <option value="uni_pc">UniPC</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Format</Label>
            <select
              className="bg-background/30 border-input h-9 w-full rounded-md border px-2 text-xs"
              value={settings.outputFormat}
              onChange={(e) => updateSettings({ outputFormat: e.target.value as any })}
            >
              <option value="png">PNG (HQ)</option>
              <option value="jpg">JPG (Web)</option>
              <option value="webp">WebP</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
