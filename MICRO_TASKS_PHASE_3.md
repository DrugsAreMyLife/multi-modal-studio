# Phase 3: Sample Image Preview System (9 tasks → 24 micro-tasks)

## Overview

Grid-based image preview with modal viewer, comparison slider, and integration into workbench.

**Original Duration**: 9 subtasks
**Decomposed into**: 24 micro-tasks (5-10 minutes each)
**Total Sequential Time**: ~5 hours
**Estimated Parallel Time**: ~40 minutes
**Parallelization Factor**: 7.5x

---

## Wave 1: Type Definitions (Parallel Safe)

### 3.1.1: Create ImagePreviewTypes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/image-preview.ts` (NEW)
**Duration**: 6 min
**Dependencies**: None
**Parallel Group**: types

```typescript
export interface ImagePreviewConfig {
  gridColumns: number; // 1-6
  imageSize: 'small' | 'medium' | 'large'; // 100px, 200px, 400px
  enableComparison: boolean;
  enableModal: boolean;
  maxImagesPerPage: number;
}

export interface PreviewImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  aspectRatio: string;
  metadata?: {
    width: number;
    height: number;
    generatedAt: number;
  };
}

export interface ImageGridState {
  images: PreviewImage[];
  selectedImageId: string | null;
  comparisonImages: [string | null, string | null]; // Before/After
  currentPage: number;
  config: ImagePreviewConfig;
}
```

**Success Criteria**: Types compile, no conflicts with existing types.

---

### 3.1.2: Create ImageGridHookTypes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/image-preview.ts`
**Duration**: 5 min
**Dependencies**: 3.1.1
**Parallel Group**: types

```typescript
export interface UseImageGridReturn {
  state: ImageGridState;
  selectImage: (id: string) => void;
  setComparisonImages: (before: string | null, after: string | null) => void;
  addImages: (images: PreviewImage[]) => void;
  removeImage: (id: string) => void;
  clearAll: () => void;
  nextPage: () => void;
  prevPage: () => void;
  updateConfig: (config: Partial<ImagePreviewConfig>) => void;
}
```

**Success Criteria**: Hook interface properly defined, all methods typed correctly.

---

### 3.1.3: Create ComparisonSliderTypes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/image-preview.ts`
**Duration**: 4 min
**Dependencies**: 3.1.1
**Parallel Group**: types

```typescript
export interface ComparisonSliderProps {
  beforeImage: PreviewImage;
  afterImage: PreviewImage;
  beforeLabel?: string;
  afterLabel?: string;
  sliderPosition?: number;
  onSliderChange?: (position: number) => void;
}
```

**Success Criteria**: Types match expected component props.

---

## Wave 2: Utility Functions (Parallel Safe)

### 3.2.1: Create imageGridCalculations Utility

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/utils/image-grid.ts` (NEW)
**Duration**: 7 min
**Dependencies**: 3.1.1
**Parallel Group**: utils

```typescript
import { PreviewImage, ImagePreviewConfig } from '@/lib/types/image-preview';

export function calculatePaginatedImages(
  images: PreviewImage[],
  page: number,
  itemsPerPage: number,
): PreviewImage[] {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return images.slice(start, end);
}

export function calculateImageDimensions(
  size: 'small' | 'medium' | 'large',
  columns: number,
): { width: string; height: string } {
  const sizeMap = {
    small: { width: '100px', height: '100px' },
    medium: { width: '200px', height: '200px' },
    large: { width: '400px', height: '400px' },
  };
  return sizeMap[size];
}

export function calculateTotalPages(itemCount: number, itemsPerPage: number): number {
  return Math.ceil(itemCount / itemsPerPage);
}

export function validateImageURL(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http');
  } catch {
    return false;
  }
}
```

**Success Criteria**: Functions handle edge cases, return correct values.

---

### 3.2.2: Create aspectRatioCalculations Utility

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/utils/image-grid.ts`
**Duration**: 6 min
**Dependencies**: 3.1.1
**Parallel Group**: utils

```typescript
export function parseAspectRatio(ratio: string): [number, number] {
  const [w, h] = ratio.split(':').map(Number);
  return [w, h];
}

export function getAspectRatioPaddingBottom(ratio: string): string {
  const [w, h] = parseAspectRatio(ratio);
  const percent = (h / w) * 100;
  return `${percent}%`;
}

export function normalizeAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}
```

**Success Criteria**: Ratio parsing works, padding calculations correct.

---

### 3.2.3: Create imageFilteringUtility

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/utils/image-grid.ts`
**Duration**: 5 min
**Dependencies**: 3.1.1
**Parallel Group**: utils

```typescript
export function filterImagesByTag(images: PreviewImage[], tags: string[]): PreviewImage[] {
  if (tags.length === 0) return images;
  return images.filter((img) => {
    const imgTags = (img.metadata as any)?.tags || [];
    return tags.some((tag) => imgTags.includes(tag));
  });
}

export function sortImagesByDate(
  images: PreviewImage[],
  order: 'asc' | 'desc' = 'desc',
): PreviewImage[] {
  return [...images].sort((a, b) => {
    const aDate = a.metadata?.generatedAt || 0;
    const bDate = b.metadata?.generatedAt || 0;
    return order === 'desc' ? bDate - aDate : aDate - bDate;
  });
}

export function searchImages(images: PreviewImage[], query: string): PreviewImage[] {
  const lowerQuery = query.toLowerCase();
  return images.filter(
    (img) =>
      img.alt.toLowerCase().includes(lowerQuery) || img.id.toLowerCase().includes(lowerQuery),
  );
}
```

**Success Criteria**: Filtering functions work correctly, don't mutate input.

---

## Wave 3: Custom Hook (Depends on Wave 2)

### 3.3.1: Create useImageGrid Hook

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useImageGrid.ts` (NEW)
**Duration**: 12 min
**Dependencies**: 3.1.1, 3.1.2, 3.2.1
**Parallel Group**: hooks

```typescript
'use client';

import { useState, useCallback } from 'react';
import { ImageGridState, PreviewImage, UseImageGridReturn } from '@/lib/types/image-preview';
import { calculatePaginatedImages, calculateTotalPages } from '@/lib/utils/image-grid';

const DEFAULT_CONFIG = {
  gridColumns: 4,
  imageSize: 'medium' as const,
  enableComparison: true,
  enableModal: true,
  maxImagesPerPage: 20,
};

export function useImageGrid(initialImages: PreviewImage[] = []): UseImageGridReturn {
  const [state, setState] = useState<ImageGridState>({
    images: initialImages,
    selectedImageId: null,
    comparisonImages: [null, null],
    currentPage: 1,
    config: DEFAULT_CONFIG,
  });

  const selectImage = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedImageId: id }));
  }, []);

  const setComparisonImages = useCallback((before: string | null, after: string | null) => {
    setState((prev) => ({
      ...prev,
      comparisonImages: [before, after],
    }));
  }, []);

  const addImages = useCallback((images: PreviewImage[]) => {
    setState((prev) => ({
      ...prev,
      images: [...prev.images, ...images],
    }));
  }, []);

  const removeImage = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
      selectedImageId: prev.selectedImageId === id ? null : prev.selectedImageId,
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      images: [],
      selectedImageId: null,
      comparisonImages: [null, null],
      currentPage: 1,
    }));
  }, []);

  const nextPage = useCallback(() => {
    const totalPages = calculateTotalPages(state.images.length, state.config.maxImagesPerPage);
    setState((prev) => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, totalPages),
    }));
  }, [state.images.length, state.config.maxImagesPerPage]);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(prev.currentPage - 1, 1),
    }));
  }, []);

  const updateConfig = useCallback((config: Partial<typeof DEFAULT_CONFIG>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  return {
    state,
    selectImage,
    setComparisonImages,
    addImages,
    removeImage,
    clearAll,
    nextPage,
    prevPage,
    updateConfig,
  };
}
```

**Success Criteria**: Hook initializes correctly, all callbacks work, state updates properly.

---

## Wave 4: Grid Component (Depends on Wave 3)

### 3.4.1: Create ImageGrid Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/image-preview/ImageGrid.tsx` (NEW)
**Duration**: 11 min
**Dependencies**: 3.3.1
**Parallel Group**: components

```typescript
'use client';

import { PreviewImage, ImageGridState } from '@/lib/types/image-preview';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGridProps {
  images: PreviewImage[];
  state: ImageGridState;
  onSelectImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
  onSetComparison: (id: string) => void;
}

export function ImageGrid({
  images,
  state,
  onSelectImage,
  onRemoveImage,
  onSetComparison,
}: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
        <ImageIcon size={32} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No images to display</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-2',
        {
          'grid-cols-1': state.config.gridColumns === 1,
          'grid-cols-2': state.config.gridColumns === 2,
          'grid-cols-3': state.config.gridColumns === 3,
          'grid-cols-4': state.config.gridColumns === 4,
          'grid-cols-5': state.config.gridColumns === 5,
          'grid-cols-6': state.config.gridColumns === 6,
        }
      )}
    >
      {images.map(img => (
        <div
          key={img.id}
          className={cn(
            'group relative rounded-lg overflow-hidden cursor-pointer transition-all',
            'hover:ring-2 hover:ring-primary/50',
            state.selectedImageId === img.id && 'ring-2 ring-primary'
          )}
          onClick={() => onSelectImage(img.id)}
        >
          {/* Image Container */}
          <div className="aspect-square bg-muted/30 overflow-hidden">
            {img.url ? (
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon size={24} className="text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onSetComparison(img.id);
              }}
            >
              Compare
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(img.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>

          {/* Image Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-white truncate">{img.alt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Success Criteria**: Grid renders correctly, hover effects work, buttons functional.

---

### 3.4.2: Create Pagination Controls Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/image-preview/PaginationControls.tsx` (NEW)
**Duration**: 7 min
**Dependencies**: 3.1.1
**Parallel Group**: components

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemCount: number;
  itemsPerPage: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemCount,
  itemsPerPage,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, itemCount);

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground">
        Showing {startItem}-{endItem} of {itemCount}
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-2 px-3">
          <span className="text-xs font-medium">
            {currentPage} / {totalPages}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
```

**Success Criteria**: Pagination displays correctly, buttons enable/disable appropriately.

---

## Wave 5: Modal Component (Depends on Wave 3)

### 3.5.1: Create ImageModal Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/image-preview/ImageModal.tsx` (NEW)
**Duration**: 10 min
**Dependencies**: 3.3.1
**Parallel Group**: components

```typescript
'use client';

import { PreviewImage } from '@/lib/types/image-preview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ImageModalProps {
  image: PreviewImage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ image, isOpen, onClose }: ImageModalProps) {
  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{image.alt}</DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-4">
              <X size={18} />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Image Display */}
          <div className="w-full bg-muted/30 rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-auto object-contain max-h-[500px]"
            />
          </div>

          {/* Image Metadata */}
          {image.metadata && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Width</p>
                <p className="font-mono font-bold">{image.metadata.width}px</p>
              </div>
              <div>
                <p className="text-muted-foreground">Height</p>
                <p className="font-mono font-bold">{image.metadata.height}px</p>
              </div>
              <div>
                <p className="text-muted-foreground">Aspect Ratio</p>
                <p className="font-mono font-bold">{image.aspectRatio}</p>
              </div>
            </div>
          )}

          {/* Image URL */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">URL</p>
            <input
              type="text"
              value={image.url}
              readOnly
              className="w-full text-xs p-2 bg-muted rounded border text-muted-foreground"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Success Criteria**: Modal displays image correctly, metadata shows, URL copyable.

---

## Wave 6: Comparison Slider (Depends on Wave 3)

### 3.6.1: Create ComparisonSlider Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/image-preview/ComparisonSlider.tsx` (NEW)
**Duration**: 12 min
**Dependencies**: 3.1.3
**Parallel Group**: components

```typescript
'use client';

import { useRef, useState, useEffect } from 'react';
import { PreviewImage } from '@/lib/types/image-preview';

interface ComparisonSliderProps {
  beforeImage: PreviewImage;
  afterImage: PreviewImage;
  beforeLabel?: string;
  afterLabel?: string;
  onSliderChange?: (position: number) => void;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  onSliderChange,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedPosition = Math.max(0, Math.min(100, position));

      setSliderPosition(clampedPosition);
      onSliderChange?.(clampedPosition);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, onSliderChange]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden cursor-col-resize select-none"
      onMouseDown={handleMouseDown}
    >
      {/* After Image (Background) */}
      <img
        src={afterImage.url}
        alt={afterImage.alt}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage.url}
          alt={beforeImage.alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: '100%' }}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <svg className="w-4 h-4 text-muted" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5a1 1 0 100 2v6a1 1 0 002 0V7a1 1 0 100-2H8zM10 5a1 1 0 100 2v6a1 1 0 102 0V7a1 1 0 100-2h-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 text-xs font-medium text-white bg-black/40 px-2 py-1 rounded">
        {beforeLabel}
      </div>
      <div className="absolute top-2 right-2 text-xs font-medium text-white bg-black/40 px-2 py-1 rounded">
        {afterLabel}
      </div>
    </div>
  );
}
```

**Success Criteria**: Slider interactive, images display correctly, labels visible.

---

## Wave 7: Container Component (Depends on Waves 4-6)

### 3.7.1: Create ImagePreviewContainer

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/image-preview/ImagePreviewContainer.tsx` (NEW)
**Duration**: 13 min
**Dependencies**: 3.3.1, 3.4.1, 3.4.2, 3.5.1, 3.6.1
**Parallel Group**: integration

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useImageGrid } from '@/lib/hooks/useImageGrid';
import { PreviewImage } from '@/lib/types/image-preview';
import { ImageGrid } from './ImageGrid';
import { PaginationControls } from './PaginationControls';
import { ImageModal } from './ImageModal';
import { ComparisonSlider } from './ComparisonSlider';
import { calculatePaginatedImages, calculateTotalPages } from '@/lib/utils/image-grid';
import { Zap } from 'lucide-react';

interface ImagePreviewContainerProps {
  initialImages?: PreviewImage[];
  onImagesChange?: (images: PreviewImage[]) => void;
}

export function ImagePreviewContainer({
  initialImages = [],
  onImagesChange,
}: ImagePreviewContainerProps) {
  const { state, selectImage, addImages, removeImage, nextPage, prevPage } =
    useImageGrid(initialImages);

  const [showComparison, setShowComparison] = useState(false);
  const [comparisonImageId, setComparisonImageId] = useState<string | null>(null);

  const paginatedImages = calculatePaginatedImages(
    state.images,
    state.currentPage,
    state.config.maxImagesPerPage
  );

  const totalPages = calculateTotalPages(
    state.images.length,
    state.config.maxImagesPerPage
  );

  const selectedImage = state.images.find(img => img.id === state.selectedImageId);
  const comparisonImage = state.images.find(img => img.id === comparisonImageId);

  const handleSetComparison = (id: string) => {
    setComparisonImageId(id);
    setShowComparison(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-yellow-500" />
          <h3 className="text-sm font-semibold">
            Sample Images ({state.images.length})
          </h3>
        </div>
      </div>

      {/* Comparison View Toggle */}
      {comparisonImage && (
        <Button
          variant={showComparison ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowComparison(!showComparison)}
        >
          {showComparison ? 'Hide' : 'Show'} Comparison
        </Button>
      )}

      {/* Comparison Slider */}
      {showComparison && selectedImage && comparisonImage && (
        <Card className="p-4">
          <ComparisonSlider beforeImage={selectedImage} afterImage={comparisonImage} />
        </Card>
      )}

      {/* Grid View */}
      {!showComparison && (
        <>
          <Card className="p-4">
            <ImageGrid
              images={paginatedImages}
              state={state}
              onSelectImage={selectImage}
              onRemoveImage={removeImage}
              onSetComparison={handleSetComparison}
            />
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={state.currentPage}
              totalPages={totalPages}
              itemCount={state.images.length}
              itemsPerPage={state.config.maxImagesPerPage}
              onPrevious={prevPage}
              onNext={nextPage}
            />
          )}
        </>
      )}

      {/* Modal */}
      <ImageModal
        image={selectedImage || null}
        isOpen={!!selectedImage && !showComparison}
        onClose={() => selectImage(null!)}
      />
    </div>
  );
}

export { useImageGrid };
export type { PreviewImage, ImagePreviewConfig } from '@/lib/types/image-preview';
```

**Success Criteria**: Container integrates all components, switching views works smoothly.

---

## Wave 8: Integration & Testing (Depends on Wave 7)

### 3.8.1: Integration Test - Add to WorkbenchGrid

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workbench/WorkbenchGrid.tsx`
**Duration**: 8 min
**Dependencies**: 3.7.1
**Parallel Group**: integration

**Action**: Add ImagePreviewContainer to display run images:

```typescript
import { ImagePreviewContainer } from '@/components/image-preview/ImagePreviewContainer';

// Convert assets to preview images:
const previewImages = run.assets
  .filter(a => a.type === 'image')
  .map(a => ({
    id: a.id,
    url: a.url,
    alt: `Generated image ${a.id}`,
    aspectRatio: '1:1',
    metadata: {
      width: 512,
      height: 512,
      generatedAt: run.timestamp,
    },
  }));

// In render:
<ImagePreviewContainer initialImages={previewImages} />
```

**Success Criteria**: Images display in workbench, no layout breaks.

---

### 3.8.2: Manual Testing Checklist

**File**: None (Testing Task)
**Duration**: 10 min
**Dependencies**: 3.8.1
**Parallel Group**: testing

**Test Steps**:

1. Load WorkbenchGrid with runs containing images
2. Verify images display in grid with correct aspect ratios
3. Click on image to open modal
4. Verify modal shows full resolution image and metadata
5. Test pagination (if >20 images)
6. Click "Compare" on an image
7. Select another image
8. Verify comparison slider works smoothly
9. Drag slider to change before/after ratio
10. Verify no console errors

**Success Criteria**: All interactions work, no errors, smooth animations.

---

## Parallelization Plan

**Wave 1** (Types): 3 tasks → 15 min
**Wave 2** (Utils): 3 tasks → 18 min (parallel)
**Wave 3** (Hook): 1 task → 12 min (depends on Wave 2)
**Wave 4** (Grid Components): 2 tasks → 18 min (depends on Wave 3)
**Wave 5** (Modal): 1 task → 10 min (depends on Wave 3)
**Wave 6** (Slider): 1 task → 12 min (depends on Wave 3)
**Wave 7** (Container): 1 task → 13 min (depends on Waves 4-6)
**Wave 8** (Integration): 2 tasks → 18 min (depends on Wave 7)

**Total Parallel Time**: ~40 minutes
**Estimated Sequential Time**: ~5 hours
