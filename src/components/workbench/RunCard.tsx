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
    <Card
      className={cn(
        'group bg-background/40 hover:border-primary/50 relative overflow-hidden border-white/5 backdrop-blur-sm transition-all duration-300',
        'hover:shadow-primary/5 hover:shadow-lg',
        className,
      )}
    >
      {/* Header / Pin Indicator */}
      {run.isPinned && (
        <div className="absolute top-2 right-2 z-20">
          <Pin size={12} className="text-primary fill-primary" />
        </div>
      )}

      {/* Preview Area */}
      <div className="bg-muted/20 relative aspect-square">
        {previewAsset && previewAsset.type === 'image' ? (
          <div className="relative h-full w-full">
            {previewAsset.url.startsWith('http') ? (
              <img
                src={previewAsset.url}
                alt="Generation"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                <ImageIcon size={32} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground bg-muted/10 flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <span className="mb-2 text-[10px] font-bold uppercase opacity-50">Text Run</span>
            <p className="line-clamp-4 text-[10px] leading-relaxed opacity-70">{run.prompt}</p>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="secondary" size="sm" className="h-8 rounded-full text-xs">
            View
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-background/20 border-t border-white/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-foreground/90 truncate text-xs font-medium">
              {run.prompt || 'Untitled Run'}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-muted-foreground rounded bg-white/5 px-1.5 py-0.5 text-[10px] tracking-wider uppercase">
                {run.modelId || 'SDXL'}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {new Date(run.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPin(run.id)}>
              <Pin size={12} className={run.isPinned ? 'fill-current' : ''} />
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
