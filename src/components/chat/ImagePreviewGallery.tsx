'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImagePreviewGalleryProps {
  images: string[];
  onRemove: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  maxImages?: number;
}

export function ImagePreviewGallery({
  images,
  onRemove,
  onReorder,
  maxImages = 4,
}: ImagePreviewGalleryProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleImageClick = (image: string) => {
    setZoomedImage(image);
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(index);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-muted/50 flex flex-col gap-2 rounded-md p-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            Vision Images ({images.length}/{maxImages})
          </span>
          {images.length >= maxImages && (
            <span className="text-amber-500">Maximum images reached</span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className="border-border bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-md border"
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image}
                alt={`Vision image ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>

              {/* Remove button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => handleRemove(index, e)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Image number */}
              <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl">
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt="Zoomed preview"
              className="h-auto max-h-[80vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
