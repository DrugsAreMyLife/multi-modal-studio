'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Palette, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Mock Data for Styles
const STYLES = [
    {
        id: 'photorealistic',
        name: 'Photorealistic',
        image: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=400&q=80',
        description: 'Mimics the properties of a photograph, focusing on accurate lighting, texture, and depth of field.'
    },
    {
        id: 'anime',
        name: 'Anime',
        image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
        description: 'Vibrant colors, exaggerated expressions, and distinct line art typical of Japanese animation.'
    },
    {
        id: 'digital-art',
        name: 'Digital Art',
        image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80',
        description: 'Clean, polished look common in concept art and modern illustrations.'
    },
    {
        id: 'oil-painting',
        name: 'Oil Painting',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?w=400&q=80',
        description: 'Visible brushstrokes, rich textures, and blending of colors resembling traditional oil on canvas.'
    },
    {
        id: 'neon-cyberpunk',
        name: 'Neon / Cyberpunk',
        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400&q=80',
        description: 'High contrast, glowing neon lights, and futuristic gritty aesthetics.'
    },
    {
        id: '3d-render',
        name: '3D Render',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
        description: 'Smooth surfaces, ambient occlusion, and ray-traced lighting typical of Blender or Cinema4D renders.'
    },
    {
        id: 'isometric',
        name: 'Isometric',
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80',
        description: '3D-like representation in 2D space where the three axes appear equally foreshortened.'
    },
    {
        id: 'pixel-art',
        name: 'Pixel Art',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80', // Replace with better pixel placeholder if possible
        description: 'Retro aesthetic where individual pixels are visible, reminiscent of 8-bit or 16-bit games.'
    },
];

interface StyleSelectorProps {
    value?: string;
    onSelect: (styleId: string) => void;
}

export function StyleSelector({ value, onSelect }: StyleSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Find active style for button label
    const activeStyle = STYLES.find(s => s.id === value);

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-12 border-2 border-dashed border-border/60 hover:border-primary/50">
                    <span className="flex items-center gap-2">
                        <Palette size={16} className="text-muted-foreground" />
                        <span className="font-medium">{activeStyle ? activeStyle.name : "Choose a Style..."}</span>
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {activeStyle ? "Change" : "Browse"}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Select a Visual Style</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
                    <TooltipProvider>
                        {STYLES.map((style) => (
                            <div key={style.id} className="relative group/card">
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleSelect(style.id)}
                                            className={cn(
                                                "relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all text-left",
                                                value === style.id
                                                    ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                                                    : "border-transparent hover:border-primary/50 hover:scale-[1.01]"
                                            )}
                                        >
                                            <img
                                                src={style.image}
                                                alt={style.name}
                                                className="w-full h-full object-cover transition-transform group-hover/card:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                                                <span className="text-white font-medium text-sm flex items-center gap-1">
                                                    {style.name}
                                                    <Info size={12} className="opacity-50" />
                                                </span>
                                            </div>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[220px] bg-popover/95 backdrop-blur border-primary/20 text-center">
                                        <p className="font-medium text-xs mb-1 text-primary">{style.name}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {style.description}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ))}
                    </TooltipProvider>
                </div>
            </DialogContent>
        </Dialog>
    );
}
