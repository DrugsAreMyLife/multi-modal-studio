'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ImageComparisonConfig } from '@/lib/types/sample-images';

interface ImageComparisonSliderProps {
  config: ImageComparisonConfig;
  onSliderChange?: (position: number) => void;
}

/**
 * Interactive before/after image comparison slider
 * Allows users to drag a slider to compare two sample images
 */
export function ImageComparisonSlider({ config, onSliderChange }: ImageComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(config.sliderPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
    onSliderChange?.(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
    onSliderChange?.(percentage);
  };

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <Card className="relative overflow-hidden">
      <div
        ref={containerRef}
        className="relative h-[600px] w-full cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Before image (full) */}
        <div className="absolute inset-0">
          <Image
            src={config.beforeImage.url}
            alt={`Before - Step ${config.beforeImage.step}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {config.showLabels && (
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="border-0 bg-black/70 text-white">
                Before
                {config.showStepNumbers && ` - Step ${config.beforeImage.step}`}
              </Badge>
            </div>
          )}
        </div>

        {/* After image (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image
            src={config.afterImage.url}
            alt={`After - Step ${config.afterImage.step}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {config.showLabels && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="border-0 bg-black/70 text-white">
                After
                {config.showStepNumbers && ` - Step ${config.afterImage.step}`}
              </Badge>
            </div>
          )}
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 cursor-ew-resize bg-white shadow-lg"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Slider grip */}
          <div className="border-primary absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white shadow-xl">
            <div className="flex gap-1">
              <div className="bg-primary h-4 w-0.5" />
              <div className="bg-primary h-4 w-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Slider position indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white">
        {sliderPosition.toFixed(0)}%
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white opacity-70">
        Drag to compare
      </div>
    </Card>
  );
}
