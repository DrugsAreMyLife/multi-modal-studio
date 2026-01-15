'use client';

import { useIconStudioStore } from '@/lib/store/icon-studio-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FineTuneControl } from '@/components/shared/FineTuneControl';

export function StyleDNABuilder() {
    const { styleDNA, updateStyleDNA } = useIconStudioStore();

    // Helper to update specific section
    const updateSection = (section: keyof typeof styleDNA, key: string, value: any) => {
        updateStyleDNA({
            [section]: {
                ...styleDNA[section as keyof typeof styleDNA],
                [key]: value
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg">Geometry Contract</CardTitle>
                    <CardDescription>Fundamental shape rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Stroke Width ({styleDNA.geometry.stroke_width})</Label>
                        <Input
                            value={styleDNA.geometry.stroke_width}
                            onChange={(e) => updateSection('geometry', 'stroke_width', e.target.value)}
                            className="bg-black/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Corner Radius ({styleDNA.geometry.corner_radius})</Label>
                        <Input
                            value={styleDNA.geometry.corner_radius}
                            onChange={(e) => updateSection('geometry', 'corner_radius', e.target.value)}
                            className="bg-black/20"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Optical Corrections</Label>
                        <Switch
                            checked={styleDNA.geometry.optical_corrections}
                            onCheckedChange={(c) => updateSection('geometry', 'optical_corrections', c)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg">Material Model</CardTitle>
                    <CardDescription>Surface and rendering physics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Surface Type</Label>
                        <Select
                            value={styleDNA.material_model.surface}
                            onValueChange={(v) => updateSection('material_model', 'surface', v)}
                        >
                            <SelectTrigger className="bg-black/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="flat">Flat / Vector</SelectItem>
                                <SelectItem value="glass">Glassmorphism</SelectItem>
                                <SelectItem value="metallic">Metallic / Skeu.</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Blur Radius</Label>
                        <Input
                            value={styleDNA.material_model.blur_radius}
                            onChange={(e) => updateSection('material_model', 'blur_radius', e.target.value)}
                            className="bg-black/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Transparency ({(styleDNA.material_model.transparency * 100).toFixed(0)}%)</Label>
                        <Slider
                            value={[styleDNA.material_model.transparency]}
                            max={1}
                            step={0.01}
                            onValueChange={([v]) => updateSection('material_model', 'transparency', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg">Lighting Model</CardTitle>
                    <CardDescription>Global illumination rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Direction</Label>
                        <Select
                            value={styleDNA.lighting_model.light_direction}
                            onValueChange={(v) => updateSection('lighting_model', 'light_direction', v)}
                        >
                            <SelectTrigger className="bg-black/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="top-left">Top Left</SelectItem>
                                <SelectItem value="top-right">Top Right</SelectItem>
                                <SelectItem value="front">Frontal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Highlight Intensity</Label>
                        <Slider
                            value={[styleDNA.lighting_model.highlight_intensity]}
                            max={1}
                            step={0.01}
                            onValueChange={([v]) => updateSection('lighting_model', 'highlight_intensity', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Nuance / Fine Tuning */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg">Visual Nuance</CardTitle>
                    <CardDescription>Fine-tune aesthetic qualities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FineTuneControl
                        label="Complexity"
                        value={styleDNA.nuance?.complexity || 0}
                        onChange={(v) => updateSection('nuance', 'complexity', v)}
                        leftLabel="Minimal"
                        rightLabel="Detailed"
                    />
                    <FineTuneControl
                        label="Visual Weight"
                        value={styleDNA.nuance?.weight || 0}
                        onChange={(v) => updateSection('nuance', 'weight', v)}
                        leftLabel="Light"
                        rightLabel="Bold"
                    />
                    <FineTuneControl
                        label="Perceived Depth"
                        value={styleDNA.nuance?.depth || 0}
                        onChange={(v) => updateSection('nuance', 'depth', v)}
                        leftLabel="Flat"
                        rightLabel="Deep"
                    />
                </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg">Advanced Output</CardTitle>
                    <CardDescription>Format and overrides</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Format</Label>
                        <Select
                            value={useIconStudioStore().generationSettings.outputFormat}
                            onValueChange={(v: any) => useIconStudioStore.getState().updateGenerationSettings({ outputFormat: v })}
                        >
                            <SelectTrigger className="bg-black/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="svg">SVG (Vector)</SelectItem>
                                <SelectItem value="png">PNG (Raster)</SelectItem>
                                <SelectItem value="pdf">PDF (Print)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Background</Label>
                        <Select
                            value={useIconStudioStore().generationSettings.background}
                            onValueChange={(v: any) => useIconStudioStore.getState().updateGenerationSettings({ background: v })}
                        >
                            <SelectTrigger className="bg-black/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="transparent">Transparent</SelectItem>
                                <SelectItem value="white">White</SelectItem>
                                <SelectItem value="colored">Match Palette</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Brand Override</Label>
                        <div className="flex gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-500 ring-2 ring-white/10"></div>
                            <Input
                                placeholder="#Hex..."
                                className="h-8 text-xs font-mono bg-black/20"
                                onChange={(e) => useIconStudioStore.getState().updateGenerationSettings({ paletteOverride: [e.target.value] })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card >
        </div >
    );
}
