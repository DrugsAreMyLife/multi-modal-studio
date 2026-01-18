'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Shapes, Sparkles, Layers, Sun, Moon, Zap } from 'lucide-react';

interface StyleDNA {
  colorPalette: string[];
  complexity: number; // 0-100
  curviness: number; // 0-100 (0 = geometric, 100 = organic)
  density: number; // 0-100
  brightness: number; // 0-100
  contrast: number; // 0-100
  style: 'flat' | 'gradient' | '3d' | 'outline' | 'glyph';
}

const PRESET_PALETTES = [
  { name: 'Vibrant', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'] },
  { name: 'Corporate', colors: ['#2C3E50', '#3498DB', '#E74C3C', '#F1C40F'] },
  { name: 'Pastel', colors: ['#FFB5BA', '#B5D8FF', '#C4B5FF', '#B5FFD9'] },
  { name: 'Monochrome', colors: ['#1a1a1a', '#4a4a4a', '#8a8a8a', '#cacaca'] },
  { name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#FF00AA', '#00FF00'] },
];

const STYLE_OPTIONS = [
  { id: 'flat', name: 'Flat', icon: Layers },
  { id: 'gradient', name: 'Gradient', icon: Sun },
  { id: '3d', name: '3D', icon: Shapes },
  { id: 'outline', name: 'Outline', icon: Sparkles },
  { id: 'glyph', name: 'Glyph', icon: Zap },
] as const;

interface StyleDNABuilderProps {
  onStyleChange?: (style: StyleDNA) => void;
  initialStyle?: Partial<StyleDNA>;
}

export function StyleDNABuilder({ onStyleChange, initialStyle }: StyleDNABuilderProps) {
  const [styleDNA, setStyleDNA] = useState<StyleDNA>({
    colorPalette: initialStyle?.colorPalette || PRESET_PALETTES[0].colors,
    complexity: initialStyle?.complexity ?? 50,
    curviness: initialStyle?.curviness ?? 50,
    density: initialStyle?.density ?? 50,
    brightness: initialStyle?.brightness ?? 50,
    contrast: initialStyle?.contrast ?? 50,
    style: initialStyle?.style || 'flat',
  });

  const updateStyle = (updates: Partial<StyleDNA>) => {
    const newStyle = { ...styleDNA, ...updates };
    setStyleDNA(newStyle);
    onStyleChange?.(newStyle);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Palette size={16} className="text-primary" />
          Style DNA Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Palette Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Color Palette</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PALETTES.map((palette) => (
              <Button
                key={palette.name}
                variant={
                  JSON.stringify(styleDNA.colorPalette) === JSON.stringify(palette.colors)
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                className="h-8 px-2"
                onClick={() => updateStyle({ colorPalette: palette.colors })}
              >
                <div className="mr-2 flex gap-0.5">
                  {palette.colors.map((color, i) => (
                    <div
                      key={i}
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs">{palette.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Style Type Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Icon Style</Label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map(({ id, name, icon: Icon }) => (
              <Button
                key={id}
                variant={styleDNA.style === id ? 'default' : 'outline'}
                size="sm"
                className="h-8"
                onClick={() => updateStyle({ style: id })}
              >
                <Icon size={14} className="mr-1" />
                {name}
              </Button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Complexity</Label>
              <Badge variant="secondary" className="text-[10px]">
                {styleDNA.complexity}%
              </Badge>
            </div>
            <Slider
              value={[styleDNA.complexity]}
              onValueChange={([v]) => updateStyle({ complexity: v })}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Curviness</Label>
              <Badge variant="secondary" className="text-[10px]">
                {styleDNA.curviness}%
              </Badge>
            </div>
            <Slider
              value={[styleDNA.curviness]}
              onValueChange={([v]) => updateStyle({ curviness: v })}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Density</Label>
              <Badge variant="secondary" className="text-[10px]">
                {styleDNA.density}%
              </Badge>
            </div>
            <Slider
              value={[styleDNA.density]}
              onValueChange={([v]) => updateStyle({ density: v })}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Brightness</Label>
              <Badge variant="secondary" className="text-[10px]">
                {styleDNA.brightness}%
              </Badge>
            </div>
            <Slider
              value={[styleDNA.brightness]}
              onValueChange={([v]) => updateStyle({ brightness: v })}
              max={100}
              step={1}
            />
          </div>
        </div>

        {/* DNA Preview */}
        <div className="bg-muted rounded-lg p-3">
          <Label className="mb-2 block text-xs font-medium">Style DNA Preview</Label>
          <div className="flex flex-wrap gap-2">
            <Badge>Style: {styleDNA.style}</Badge>
            <Badge variant="outline">C:{styleDNA.complexity}</Badge>
            <Badge variant="outline">V:{styleDNA.curviness}</Badge>
            <Badge variant="outline">D:{styleDNA.density}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
