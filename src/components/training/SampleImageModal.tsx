'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SampleImageModalProps } from '@/lib/types/sample-images';

/**
 * Modal dialog for viewing sample images in full size
 * Supports keyboard navigation, download, and metadata display
 */
export function SampleImageModal({
  image,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onDownload,
}: SampleImageModalProps) {
  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (onPrevious) {
            e.preventDefault();
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (onNext) {
            e.preventDefault();
            onNext();
          }
          break;
        case 'd':
        case 'D':
          if (onDownload && image) {
            e.preventDefault();
            onDownload(image);
          }
          break;
      }
    },
    [isOpen, onClose, onNext, onPrevious, onDownload, image],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl gap-0 p-0">
        <DialogHeader className="border-b p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Sample Image - Step {image.step}</DialogTitle>
              <Badge variant="outline">{new Date(image.timestamp).toLocaleString()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {onDownload && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDownload(image)}
                  title="Download (D)"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={onClose} title="Close (Esc)">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative">
          {/* Navigation buttons */}
          {onPrevious && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-1/2 left-4 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={onPrevious}
              title="Previous (←)"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {onNext && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-1/2 right-4 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={onNext}
              title="Next (→)"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Main image */}
          <div className="bg-muted relative h-[600px] w-full">
            <Image
              src={image.url}
              alt={image.prompt || `Sample at step ${image.step}`}
              fill
              className="object-contain"
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
        </div>

        {/* Image metadata */}
        {(image.prompt || image.metadata) && (
          <div className="space-y-3 border-t p-6 pt-4">
            {image.prompt && (
              <div>
                <h4 className="mb-1 text-sm font-semibold">Prompt</h4>
                <p className="text-muted-foreground text-sm">{image.prompt}</p>
              </div>
            )}

            {image.metadata && Object.keys(image.metadata).length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(image.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="text-muted-foreground border-t px-6 pt-3 pb-4 text-center text-xs">
          <span className="inline-flex items-center gap-4">
            <span>← → Navigate</span>
            <span>D Download</span>
            <span>Esc Close</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
