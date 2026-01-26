import { useState, useCallback, useEffect } from 'react';
import type { SampleImage, UseSampleImagesReturn } from '../types/sample-images';
import { preloadImage, retryImageLoad } from '../utils/image-loader';

interface UseSampleImagesOptions {
  trainingJobId?: string;
  pageSize?: number;
  autoPreload?: boolean;
}

/**
 * Custom hook for managing sample images with lazy loading and pagination
 * Provides image preloading, infinite scroll support, and error handling
 */
export function useSampleImages(options: UseSampleImagesOptions = {}): UseSampleImagesReturn {
  const { trainingJobId, pageSize = 20, autoPreload = true } = options;

  const [images, setImages] = useState<SampleImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  /**
   * Fetch sample images from the API
   */
  const fetchImages = useCallback(
    async (page: number) => {
      if (!trainingJobId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/training/jobs/${trainingJobId}/samples?page=${page}&limit=${pageSize}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch sample images: ${response.statusText}`);
        }

        const data = await response.json();
        const newImages = data.images || [];

        setImages((prev) => {
          if (page === 0) {
            return newImages;
          }
          return [...prev, ...newImages];
        });

        setTotalCount(data.total);
        // Use server-provided hasMore status
        setHasMore(data.hasMore ?? newImages.length === pageSize);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    [trainingJobId, pageSize],
  );

  /**
   * Load more images (for infinite scroll)
   */
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchImages(nextPage);
    }
  }, [isLoading, hasMore, currentPage, fetchImages]);

  /**
   * Preload a specific image with retry logic
   */
  const preloadImageById = useCallback(
    async (id: string) => {
      const image = images.find((img) => img.id === id);
      if (!image) {
        throw new Error(`Image with id ${id} not found`);
      }

      try {
        await retryImageLoad(image.url, 3, 1000);
      } catch (err) {
        console.error(`Failed to preload image ${id}:`, err);
        throw err;
      }
    },
    [images],
  );

  /**
   * Auto-preload visible images when autoPreload is enabled
   */
  useEffect(() => {
    if (autoPreload && images.length > 0) {
      const preloadBatch = images.slice(0, Math.min(10, images.length));

      Promise.all(
        preloadBatch.map((img) =>
          preloadImage(img.url).catch((err) => {
            console.warn(`Failed to preload image ${img.id}:`, err);
          }),
        ),
      );
    }
  }, [images, autoPreload]);

  /**
   * Initial load when trainingJobId changes
   */
  useEffect(() => {
    if (trainingJobId) {
      setCurrentPage(0);
      setImages([]);
      setHasMore(true);
      fetchImages(0);
    }
  }, [trainingJobId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    images,
    isLoading,
    error,
    loadMore,
    hasMore,
    totalCount,
    preloadImage: preloadImageById,
  };
}
