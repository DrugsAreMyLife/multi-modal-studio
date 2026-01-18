export type IntegrationType = 'stock' | 'social' | 'productivity' | 'infrastructure';

export interface Integration {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  icon: React.ReactNode;
  isPrototype?: boolean;
  isConnected: () => boolean;
  connect: (apiKey?: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

// Stock Asset (Input)
export interface StockAsset {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  author: string;
  authorUrl?: string;
  source: 'unsplash' | 'pexels' | 'giphy';
}

export interface StockProvider extends Integration {
  type: 'stock';
  search: (query: string, page?: number) => Promise<StockAsset[]>;
}

// Publisher (Output)
export interface SocialPublisher extends Integration {
  type: 'social';
  publishVideo: (
    videoUrl: string,
    metadata: { title: string; description: string; tags: string[] },
  ) => Promise<string>; // Returns post URL
}

// Notifier
export interface Notifier extends Integration {
  type: 'productivity';
  sendNotification: (message: string, attachments?: string[]) => Promise<void>;
}
