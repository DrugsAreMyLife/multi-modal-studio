'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Download, Maximize2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SampleImage, SampleImageGridConfig } from '@/lib/types/sample-images';

interface SampleImageGridProps {
  images: SampleImage[];
  config: SampleImageGridConfig;
  onImageClick?: (image: SampleImage) => void;
  onImageDownload?: (image: SampleImage) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

/**
 * Grid layout for displaying sample images with lazy loading
 * Supports infinite scroll, step badges, and image actions
 */
export function SampleImageGrid({
  images,
  config,
  onImageClick,
  onImageDownload,
  onLoadMore,
  hasMore = false,
}: SampleImageGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  // Sort images based on config
  const sortedImages = [...images].sort((a, b) => {
    const aValue = a[config.sortBy];
    const bValue = b[config.sortBy];
    const multiplier = config.sortOrder === 'asc' ? 1 : -1;
    return (aValue < bValue ? -1 : 1) * multiplier;
  });

  // Grid column class based on config
  const gridColsClass = {
    small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    medium: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  }[config.thumbnailSize];

  const handleImageLoad = (imageId: string) => {
    setLoadedImages((prev) => new Set(prev).add(imageId));
  };

  if (images.length === 0) {
    return (
      <Card className="flex w-full items-center justify-center p-12">
        <div className="text-muted-foreground text-center">
          <div className="mb-1 text-lg font-medium">No sample images yet</div>
          <div className="text-sm">Sample images will appear here during training</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${gridColsClass}`}>
        {sortedImages.map((image) => (
          <Card
            key={image.id}
            className="group relative cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg"
            onClick={() => onImageClick?.(image)}
          >
            {/* Image container */}
            <div className="bg-muted relative aspect-square">
              <Image
                src={image.thumbnailUrl || image.url}
                alt={image.prompt || `Sample at step ${image.step}`}
                fill
                className="object-cover"
                onLoad={() => handleImageLoad(image.id)}
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />

              {/* Loading overlay */}
              {!loadedImages.has(image.id) && (
                <div className="bg-muted absolute inset-0 flex animate-pulse items-center justify-center">
                  <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick?.(image);
                  }}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                {onImageDownload && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageDownload(image);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Step badge */}
              {config.showStepBadges && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="border-0 bg-black/50 text-white">
                    Step {image.step}
                  </Badge>
                </div>
              )}
            </div>

            {/* Image metadata */}
            {image.prompt && (
              <div className="bg-background/95 p-2">
                <p className="text-muted-foreground truncate text-xs" title={image.prompt}>
                  {image.prompt}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="flex h-10 items-center justify-center">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
