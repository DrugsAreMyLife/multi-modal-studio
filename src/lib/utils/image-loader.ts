/**
 * Image Loader Utility
 * Provides lazy loading, caching, and retry logic for image resources
 */

// Image cache stores loaded image elements
const imageCache = new Map<string, HTMLImageElement>();

// Loading queue tracks in-flight promises to avoid duplicate requests
const loadingQueue = new Map<string, Promise<HTMLImageElement>>();

/**
 * Preload a single image with caching support
 * Returns cached image if available, or creates a new Image element
 * Prevents duplicate loading by tracking in-flight requests
 *
 * @param url - The image URL to preload
 * @returns Promise resolving to the loaded HTMLImageElement
 * @throws Error if image fails to load
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  // Return cached if exists
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }

  // Return in-flight promise if loading to prevent duplicate requests
  if (loadingQueue.has(url)) {
    return loadingQueue.get(url)!;
  }

  // Start new load
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      imageCache.set(url, img);
      loadingQueue.delete(url);
      resolve(img);
    };

    img.onerror = () => {
      loadingQueue.delete(url);
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });

  loadingQueue.set(url, promise);
  return promise;
}

/**
 * Preload multiple images in parallel
 * Efficiently loads multiple images with shared caching
 *
 * @param urls - Array of image URLs to preload
 * @returns Promise resolving to array of loaded HTMLImageElements
 * @throws Error if any image fails to load
 */
export function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(urls.map((url) => preloadImage(url)));
}

/**
 * Clear the entire image cache and loading queue
 * Useful for memory management or cache invalidation
 */
export function clearImageCache(): void {
  imageCache.clear();
  loadingQueue.clear();
}

/**
 * Get the current number of cached images
 * Useful for monitoring cache size and memory usage
 *
 * @returns Number of images currently in cache
 */
export function getCacheSize(): number {
  return imageCache.size;
}

/**
 * Generate a thumbnail URL from the original image URL
 * In a production environment, this would integrate with an image optimization service
 * like Cloudinary, ImageKit, or similar
 *
 * @param url - The original image URL
 * @param size - Desired thumbnail size in pixels (default: 200)
 * @returns Optimized thumbnail URL (currently returns original)
 */
export function generateThumbnailUrl(url: string, size: number = 200): string {
  // TODO: Integrate with image optimization service
  // Example for Cloudinary:
  // return url.replace(/upload\//g, `upload/w_${size},h_${size},c_fill,q_auto/`);
  // Example for ImageKit:
  // return url + `?tr=w-${size},h-${size},c-at_max`;

  return url;
}

/**
 * Load an image with automatic retry logic
 * Uses exponential backoff for retry delays
 *
 * @param url - The image URL to load
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delay - Initial delay in milliseconds between retries (default: 1000)
 * @returns Promise resolving to the loaded HTMLImageElement
 * @throws Error after max retries exceeded
 */
export function retryImageLoad(
  url: string,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<HTMLImageElement> {
  let attempts = 0;

  const tryLoad = (): Promise<HTMLImageElement> => {
    return preloadImage(url).catch((error) => {
      attempts++;

      // Throw error if max retries exceeded
      if (attempts >= maxRetries) {
        throw error;
      }

      // Wait with exponential backoff before retrying
      // delay * attempts provides: 1s, 2s, 3s, etc.
      return new Promise((resolve) => {
        setTimeout(() => resolve(tryLoad()), delay * attempts);
      });
    });
  };

  return tryLoad();
}
