'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  GenerationModel,
  ParameterDefinition,
  getGenerationModelById,
} from '@/lib/models/generation-models';
import { cn } from '@/lib/utils';

interface DynamicParameterControlsProps {
  modelId: string;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  excludeParams?: string[];
  className?: string;
}

export function DynamicParameterControls({
  modelId,
  values,
  onChange,
  excludeParams = ['prompt', 'text', 'input'],
  className,
}: DynamicParameterControlsProps) {
  const model = useMemo(() => getGenerationModelById(modelId), [modelId]);

  if (!model) {
    return null;
  }

  const filteredParams = Object.entries(model.parameters).filter(
    ([key]) => !excludeParams.includes(key),
  );

  if (filteredParams.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {filteredParams.map(([key, param]) => (
        <ParameterControl
          key={key}
          paramKey={key}
          param={param}
          value={values[key] ?? param.default}
          onChange={(value) => onChange(key, value)}
        />
      ))}
    </div>
  );
}

interface ParameterControlProps {
  paramKey: string;
  param: ParameterDefinition;
  value: any;
  onChange: (value: any) => void;
}

function ParameterControl({ paramKey, param, value, onChange }: ParameterControlProps) {
  const labelWithTooltip = (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={paramKey} className="text-xs font-medium">
        {param.label}
        {param.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {param.description && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={12} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-xs">
              {param.description}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  switch (param.type) {
    case 'string':
      return (
        <div className="space-y-1.5">
          {labelWithTooltip}
          <Textarea
            id={paramKey}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={param.description || `Enter ${param.label.toLowerCase()}`}
            className="bg-background/50 min-h-[60px] resize-none text-sm"
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          {labelWithTooltip}
          <Input
            id={paramKey}
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              onChange(val);
            }}
            min={param.min}
            max={param.max}
            step={param.step}
            placeholder={param.description || 'Optional'}
            className="bg-background/50 h-8 text-sm"
          />
        </div>
      );

    case 'slider':
      return (
        <div className="space-y-2">
          {labelWithTooltip}
          <div className="flex items-center gap-3">
            <Slider
              id={paramKey}
              value={[value ?? param.default ?? param.min ?? 0]}
              min={param.min ?? 0}
              max={param.max ?? 100}
              step={param.step ?? 1}
              onValueChange={([v]) => onChange(v)}
              className="flex-1"
            />
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
              {value ?? param.default ?? param.min ?? 0}
            </span>
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          {labelWithTooltip}
          <Select value={String(value ?? param.default ?? '')} onValueChange={onChange}>
            <SelectTrigger className="bg-background/50 h-8 text-sm">
              <SelectValue placeholder={`Select ${param.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-1.5">
            <Label htmlFor={paramKey} className="text-xs font-medium">
              {param.label}
            </Label>
            {param.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={12} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs text-xs">
                    {param.description}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Switch
            id={paramKey}
            checked={value ?? param.default ?? false}
            onCheckedChange={onChange}
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-1.5">
          {labelWithTooltip}
          <ImageUploadControl value={value} onChange={onChange} description={param.description} />
        </div>
      );

    case 'images':
      return (
        <div className="space-y-1.5">
          {labelWithTooltip}
          <MultiImageUploadControl
            value={value || []}
            onChange={onChange}
            maxItems={param.maxItems ?? 4}
            description={param.description}
          />
        </div>
      );

    default:
      return null;
  }
}

interface ImageUploadControlProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  description?: string;
}

function ImageUploadControl({ value, onChange, description }: ImageUploadControlProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Reference"
            className="h-24 w-full rounded-lg border border-white/10 object-cover"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={() => onChange(undefined)}
          >
            <X size={12} />
          </Button>
        </div>
      ) : (
        <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 transition-colors hover:border-white/40 hover:bg-black/30">
          <Upload size={16} className="text-muted-foreground mb-1" />
          <span className="text-muted-foreground text-xs">Upload image</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}

interface MultiImageUploadControlProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxItems: number;
  description?: string;
}

function MultiImageUploadControl({
  value,
  onChange,
  maxItems,
  description,
}: MultiImageUploadControlProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: string[] = [];
    for (const file of files) {
      if (value.length + newImages.length >= maxItems) break;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(dataUrl);
    }

    onChange([...value, ...newImages]);
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {value.map((img, i) => (
          <div key={i} className="relative">
            <img
              src={img}
              alt={`Reference ${i + 1}`}
              className="h-16 w-full rounded border border-white/10 object-cover"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5"
              onClick={() => removeImage(i)}
            >
              <X size={10} />
            </Button>
          </div>
        ))}
        {value.length < maxItems && (
          <label className="flex h-16 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-white/20 bg-black/20 transition-colors hover:border-white/40">
            <Upload size={12} className="text-muted-foreground" />
            <span className="text-muted-foreground mt-0.5 text-[10px]">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      <p className="text-muted-foreground text-[10px]">
        {value.length}/{maxItems} images
      </p>
    </div>
  );
}

export function ModelCapabilitiesBadges({ modelId }: { modelId: string }) {
  const model = getGenerationModelById(modelId);
  if (!model) return null;

  const capabilities = model.capabilities;
  const badges = [];

  if (capabilities.textToMedia) badges.push('Text-to-Media');
  if (capabilities.imageToMedia) badges.push('Image-to-Media');
  if (capabilities.characterReference) badges.push('Character Ref');
  if (capabilities.styleReference) badges.push('Style Ref');
  if (capabilities.audio) badges.push('Audio');
  if (capabilities.upscale) badges.push('Upscale');

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span key={badge} className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px]">
          {badge}
        </span>
      ))}
    </div>
  );
}
