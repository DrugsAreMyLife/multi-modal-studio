import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Sparkles, Sun, Zap, Info, Save, Trash2, Combine } from 'lucide-react';
import { StyleDNA, STYLE_PRESETS, mixDNA } from '@/lib/style/style-dna';
import { useStyleDNAStore } from '@/lib/store/style-dna-store';
import { cn } from '@/lib/utils';

interface StyleDNABuilderProps {
  className?: string;
}

export function StyleDNABuilder({ className }: StyleDNABuilderProps) {
  const {
    activeDNA,
    setActiveDNA,
    savedDNAs,
    saveDNA,
    deleteDNA,
    dnaA,
    dnaB,
    mixRatio,
    setMixDNAA,
    setMixDNAB,
    setMixRatio,
    createMixedDNA,
  } = useStyleDNAStore();

  const [localDNA, setLocalDNA] = useState<StyleDNA | null>(activeDNA);
  const [isMixingMode, setIsMixingMode] = useState(false);

  useEffect(() => {
    setLocalDNA(activeDNA);
  }, [activeDNA]);

  const updateAesthetics = (updates: Partial<StyleDNA['aesthetics']>) => {
    if (!localDNA) return;
    const updated = {
      ...localDNA,
      aesthetics: { ...localDNA.aesthetics, ...updates },
      id: `custom-${Date.now()}`,
      name: localDNA.name.startsWith('Custom') ? localDNA.name : `Custom ${localDNA.name}`,
    };
    setLocalDNA(updated);
    setActiveDNA(updated);
  };

  if (!localDNA) return null;

  return (
    <Card
      className={cn(
        'border-primary/20 bg-background/40 w-full backdrop-blur-xl transition-all',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Palette size={16} className="text-primary animate-pulse" />
          Style DNA Studio
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant={isMixingMode ? 'default' : 'outline'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMixingMode(!isMixingMode)}
            title="DNA Mixer"
          >
            <Combine size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => saveDNA(localDNA)}
            title="Save Style"
          >
            <Save size={14} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isMixingMode ? (
          <div className="animate-in slide-in-from-right-4 space-y-4 duration-300">
            <div className="space-y-2">
              <Label className="text-[10px] tracking-wider uppercase opacity-60">
                Source DNA Alpha
              </Label>
              <div className="flex flex-wrap gap-1">
                {savedDNAs.map((dna) => (
                  <Button
                    key={dna.id}
                    variant={dnaA?.id === dna.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => setMixDNAA(dna)}
                  >
                    {dna.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] tracking-wider uppercase opacity-60">
                Source DNA Beta
              </Label>
              <div className="flex flex-wrap gap-1">
                {savedDNAs.map((dna) => (
                  <Button
                    key={dna.id}
                    variant={dnaB?.id === dna.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => setMixDNAB(dna)}
                  >
                    {dna.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Mix Ratio</Label>
                <Badge variant="outline" className="text-[10px]">
                  {Math.round(mixRatio * 100)}% Alpha
                </Badge>
              </div>
              <Slider
                value={[mixRatio * 100]}
                onValueChange={([v]) => setMixRatio(v / 100)}
                max={100}
                step={1}
                className="py-2"
              />
            </div>
            <Button className="h-8 w-full gap-2" size="sm" onClick={createMixedDNA}>
              <Zap size={14} /> Synthesize DNA
            </Button>
          </div>
        ) : (
          <>
            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-[10px] tracking-wider uppercase opacity-60">
                Active Presets
              </Label>
              <div className="flex flex-wrap gap-2">
                {savedDNAs.map((dna) => (
                  <Button
                    key={dna.id}
                    variant={localDNA.id === dna.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-3 transition-all"
                    onClick={() => setActiveDNA(dna)}
                  >
                    <span className="text-xs">{dna.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Aesthetic Sliders */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <AestheticSlider
                label="Complexity"
                value={localDNA.aesthetics.complexity}
                onChange={(v) => updateAesthetics({ complexity: v })}
              />
              <AestheticSlider
                label="Curviness"
                value={localDNA.aesthetics.curviness}
                onChange={(v) => updateAesthetics({ curviness: v })}
              />
              <AestheticSlider
                label="Contrast"
                value={localDNA.aesthetics.contrast}
                onChange={(v) => updateAesthetics({ contrast: v })}
              />
              <AestheticSlider
                label="Vibrance"
                value={localDNA.aesthetics.vibrance}
                onChange={(v) => updateAesthetics({ vibrance: v })}
              />
              <AestheticSlider
                label="Lighting"
                value={localDNA.aesthetics.lighting}
                onChange={(v) => updateAesthetics({ lighting: v })}
              />
            </div>

            {/* DNA Breakdown */}
            <div className="bg-primary/5 border-primary/10 space-y-2 rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles size={12} className="text-primary" />
                <Label className="text-[10px] font-semibold tracking-wider uppercase">
                  DNA Fingerprint
                </Label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(localDNA.themes).map(
                  ([theme, weight]) =>
                    weight > 0 && (
                      <Badge
                        key={theme}
                        variant="secondary"
                        className="bg-primary/10 hover:bg-primary/20 text-[9px] transition-colors"
                      >
                        {theme}: {weight}%
                      </Badge>
                    ),
                )}
                <Badge variant="outline" className="border-primary/20 text-[9px]">
                  Aesthetic Vector: {Object.values(localDNA.aesthetics).join('|')}
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AestheticSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium opacity-80">{label}</Label>
        <span className="text-[10px] tabular-nums opacity-60">{value}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={100}
        step={1}
        className="py-1"
      />
    </div>
  );
}
