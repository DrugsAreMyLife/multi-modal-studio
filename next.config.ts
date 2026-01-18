import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.openai.com' },
      { protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
      { protocol: 'https', hostname: 'cdn.openai.com' },
      { protocol: 'https', hostname: 'runwayml.com' },
      { protocol: 'https', hostname: '*.runwayml.com' },
      { protocol: 'https', hostname: 'lumalabs.ai' },
      { protocol: 'https', hostname: '*.lumalabs.ai' },
      { protocol: 'https', hostname: 'replicate.delivery' },
      { protocol: 'https', hostname: '*.supabase.co' }, // For user storage
    ],
  },
};

export default nextConfig;
