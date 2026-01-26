// Sample Image Types
export interface SampleImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  step: number;
  timestamp: number;
  prompt?: string;
  metadata?: Record<string, unknown>;
}

export interface SampleImageGridConfig {
  columns: number; // responsive: 2 mobile, 3 tablet, 4 desktop
  thumbnailSize: 'small' | 'medium' | 'large';
  sortBy: 'step' | 'timestamp';
  sortOrder: 'asc' | 'desc';
  showStepBadges: boolean;
}

export interface ImageComparisonConfig {
  beforeImage: SampleImage;
  afterImage: SampleImage;
  sliderPosition: number; // 0-100
  showLabels: boolean;
  showStepNumbers: boolean;
}

export interface UseSampleImagesReturn {
  images: SampleImage[];
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
  hasMore: boolean;
  totalCount: number;
  preloadImage: (id: string) => Promise<void>;
}

export interface SampleImageModalProps {
  image: SampleImage | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onDownload?: (image: SampleImage) => void;
}
