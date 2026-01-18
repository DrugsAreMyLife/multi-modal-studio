import { StockProvider, SocialPublisher, Notifier, StockAsset } from './types';
import { Image, Video, Bell, Hash } from 'lucide-react';
import React from 'react';

// --- Stock Assets (Input) ---

export class UnsplashProvider implements StockProvider {
  id = 'unsplash';
  name = 'Unsplash';
  description = 'Beautiful, free images and photos.';
  type = 'stock' as const;
  icon = React.createElement(Image, { className: 'text-black dark:text-white' });
  isPrototype = false;

  isConnected() {
    return true;
  } // Mocked
  async connect() {}
  async disconnect() {}

  async search(query: string): Promise<StockAsset[]> {
    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      // Fallback to picsum for development
      await new Promise((r) => setTimeout(r, 600)); // Latency
      return Array.from({ length: 10 }, (_, i) => ({
        id: `unsplash-${Date.now()}-${i}`,
        url: `https://picsum.photos/seed/${query}${i}/800/600`,
        thumbnailUrl: `https://picsum.photos/seed/${query}${i}/200/150`,
        title: `${query} image ${i + 1}`,
        width: 800,
        height: 600,
        author: 'Lorem Picsum',
        source: 'unsplash',
      }));
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10`,
        { headers: { Authorization: `Client-ID ${accessKey}` } },
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();

      return data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.thumb,
        title: photo.description || photo.alt_description || 'Untitled',
        width: photo.width,
        height: photo.height,
        author: photo.user.name,
        source: 'unsplash',
      }));
    } catch (error) {
      console.error('Unsplash API error:', error);
      // Fallback to picsum on error
      return Array.from({ length: 10 }, (_, i) => ({
        id: `unsplash-${Date.now()}-${i}`,
        url: `https://picsum.photos/seed/${query}${i}/800/600`,
        thumbnailUrl: `https://picsum.photos/seed/${query}${i}/200/150`,
        title: `${query} image ${i + 1}`,
        width: 800,
        height: 600,
        author: 'Lorem Picsum',
        source: 'unsplash',
      }));
    }
  }
}

export class GiphyProvider implements StockProvider {
  id = 'giphy';
  name = 'Giphy';
  description = 'The top source for the best & newest GIFs.';
  type = 'stock' as const;
  icon = React.createElement(Image, { className: 'text-purple-500' });
  isPrototype = false;

  isConnected() {
    return true;
  }
  async connect() {}
  async disconnect() {}

  async search(query: string): Promise<StockAsset[]> {
    await new Promise((r) => setTimeout(r, 600));
    return Array.from({ length: 12 }).map((_, i) => ({
      id: `gip-${i}`,
      title: `${query} GIF ${i + 1}`,
      url: `https://picsum.photos/seed/${query}gif${i}/300/300`, // Fallback
      thumbnailUrl: `https://picsum.photos/seed/${query}gif${i}/150/150`,
      width: 300,
      height: 300,
      author: `GiphyArtist`,
      source: 'giphy',
    }));
  }
}

// --- Social Publishing (Output) ---

export class YouTubePublisher implements SocialPublisher {
  id = 'youtube';
  name = 'YouTube';
  description = 'Upload videos directly to your channel.';
  type = 'social' as const;
  icon = React.createElement(Video, { className: 'text-red-600' });
  isPrototype = true;

  isConnected() {
    return false;
  } // Mock disconnected first
  async connect() {}
  async disconnect() {}

  async publishVideo(videoUrl: string, metadata: any): Promise<string> {
    await new Promise((r) => setTimeout(r, 2000));
    return `https://youtube.com/watch?v=mockid_${Date.now()}`;
  }
}

// --- Productivity ---

export class SlackNotifier implements Notifier {
  id = 'slack';
  name = 'Slack';
  description = 'Post generation results to a channel.';
  type = 'productivity' as const;
  icon = React.createElement(Hash, { className: 'text-[#4A154B]' });
  isPrototype = false;

  isConnected() {
    // This is checked via the store in components, but for the class:
    return true;
  }
  async connect() {}
  async disconnect() {}

  async sendNotification(message: string, attachments?: string[]) {
    const response = await fetch('/api/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The store's getApiHeaders() should be used by the caller to populate the x-api-key-slack header
      },
      body: JSON.stringify({
        service: 'slack',
        message,
        attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send Slack notification');
    }
  }
}
