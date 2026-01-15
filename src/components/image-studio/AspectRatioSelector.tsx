'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Maximize, Smartphone, Monitor, Square, GripHorizontal } from 'lucide-react';
import { useState } from 'react';

// Common Presets
const ASPECT_RATIOS = [
    {
        id: '1:1',
        label: 'Square (1:1)',
        width: 1024,
        height: 1024,
        aspectClass: 'aspect-square',
        icon: Square,
        description: 'Perfect for social media avatars and Instagram posts.'
    },
    {
        id: '16:9',
        label: 'Cinematic (16:9)',
        width: 1344,
        height: 768,
        aspectClass: 'aspect-video',
        icon: Monitor,
        description: 'Standard widescreen format for video and desktop wallpapers.'
    },
    {
        id: '9:16',
        label: 'Mobile (9:16)',
        width: 768,
        height: 1344,
        aspectClass: 'aspect-[9/16]',
        icon: Smartphone,
        description: 'Full-screen vertical format for TikTok, Reels, and mobile wallpapers.'
    },
    {
        id: '4:3',
        label: 'Classic (4:3)',
        width: 1152,
        height: 896,
        aspectClass: 'aspect-[4/3]',
        icon: Maximize,
        description: 'Traditional photo format, balanced and versatile.'
    },
    {
        id: '3:4',
        label: 'Portrait (3:4)',
        width: 896,
        height: 1152,
        aspectClass: 'aspect-[3/4]',
        icon: Maximize,
        description: 'Standard portrait photography ratio.'
    },
    {
        id: '21:9',
        label: 'Ultrawide (21:9)',
        width: 1536,
        height: 640,
        aspectClass: 'aspect-[21/9]',
        icon: GripHorizontal,
        description: 'Cinematic panoramic look for landscapes.'
    }
];

// Using a high-quality, centrally composed image that works well with cropping
const PREVIEW_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80'; // 3D Abstract that looks good cropped

interface AspectRatioSelectorProps {
    width: number;
    height: number;
    onSelect: (width: number, height: number) => void;
}

export function AspectRatioSelector({ width, height, onSelect }: AspectRatioSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Determine current ratio roughly
    const currentRatioId = ASPECT_RATIOS.find(r => r.width === width && r.height === height)?.id || 'custom';
    const activePreset = ASPECT_RATIOS.find(r => r.id === currentRatioId);

    const handleSelect = (ratio: typeof ASPECT_RATIOS[0]) => {
        onSelect(ratio.width, ratio.height);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-12 border-2 border-dashed border-border/60 hover:border-primary/50">
                    <span className="flex items-center gap-2">
                        {activePreset ? <activePreset.icon size={16} className="text-muted-foreground" /> : <Maximize size={16} />}
                        <span className="font-medium">{activePreset ? activePreset.label : `Custom (${width}x${height})`}</span>
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Change
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Select Aspect Ratio</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 p-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.id}
                            onClick={() => handleSelect(ratio)}
                            className={cn(
                                "group relative flex flex-col items-center rounded-xl overflow-hidden border-2 transition-all p-4 hover:bg-muted/30 text-left",
                                currentRatioId === ratio.id
                                    ? "border-primary ring-2 ring-primary/20 bg-muted/50"
                                    : "border-border/40 hover:border-primary/50"
                            )}
                        >
                            {/* Visual Preview Box */}
                            <div className="w-full h-48 bg-muted/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-border/50">
                                <div className={cn(
                                    "relative rounded shadow-lg overflow-hidden transition-all group-hover:scale-105",
                                    ratio.aspectClass,
                                    // Scale logic to fit within the box roughly
                                    "w-auto h-auto max-w-full max-h-full object-cover"
                                )}>
                                    <img
                                        src={PREVIEW_IMAGE}
                                        alt={ratio.label}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Overlay Dimensions */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-mono font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                                            {ratio.width} x {ratio.height}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <ratio.icon size={16} className="text-primary" />
                                    <span className="font-semibold text-sm">{ratio.label}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {ratio.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
