'use client';

import { GenerationRun } from '@/lib/types/workbench';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, GitFork, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RunCardProps {
    run: GenerationRun;
    onPin: (id: string) => void;
    className?: string;
}

export function RunCard({ run, onPin, className }: RunCardProps) {
    // Use first asset as preview for now
    const previewAsset = run.assets[0];

    return (
        <Card className={cn(
            "group relative overflow-hidden bg-background/40 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-all duration-300",
            "hover:shadow-lg hover:shadow-primary/5",
            className
        )}>
            {/* Header / Pin Indicator */}
            {run.isPinned && (
                <div className="absolute top-2 right-2 z-20">
                    <Pin size={12} className="text-primary fill-primary" />
                </div>
            )}

            {/* Preview Area */}
            <div className="aspect-square relative bg-muted/20">
                {previewAsset && previewAsset.type === 'image' ? (
                    <div className="w-full h-full relative">
                        {previewAsset.url.startsWith('http') ? (
                            <img
                                src={previewAsset.url}
                                alt="Generation"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <ImageIcon size={32} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-muted/10">
                        <span className="text-[10px] uppercase font-bold opacity-50 mb-2">Text Run</span>
                        <p className="text-[10px] line-clamp-4 leading-relaxed opacity-70">
                            {run.prompt}
                        </p>
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <Button variant="secondary" size="sm" className="h-8 rounded-full text-xs">
                        View
                    </Button>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-3 border-t border-white/5 bg-background/20">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-foreground/90">{run.prompt || "Untitled Run"}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                                {run.modelId || "SDXL"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPin(run.id)}>
                            <Pin size={12} className={run.isPinned ? "fill-current" : ""} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <GitFork size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal size={12} />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
