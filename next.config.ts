import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // BullMQ/ioredis requires native Node.js modules - must be external
  serverExternalPackages: ['ioredis', 'bullmq'],

  // Security headers for production readiness
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy - Restricts sources of content to prevent XSS attacks
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'", // Default to same-origin only
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io", // Allow Sentry scripts
              "style-src 'self' 'unsafe-inline'", // Allow styles from self and inline
              [
                "img-src 'self' data: blob: https://*.sentry.io",
                'https://images.openai.com',
                'https://oaidalleapiprodscus.blob.core.windows.net',
                'https://replicate.delivery',
                'https://*.runwayml.com',
                'https://*.lumalabs.ai',
                'https://*.supabase.co',
                'https://img.youtube.com',
                'https://picsum.photos',
                'https:',
              ].join(' '),
              "font-src 'self' data:",
              [
                "connect-src 'self' https://*.sentry.io",
                'https://api.anthropic.com',
                'https://api.deepseek.com',
                'https://api.elevenlabs.io',
                'https://api.groq.com',
                'https://api.lumalabs.ai',
                'https://api.openai.com',
                'https://api.replicate.com',
                'https://api.runwayml.com',
                'https://api.stability.ai',
                'https://api.unsplash.com',
                'https://api.x.ai',
                'https://*.googleapis.com',
                'https://*.supabase.co',
                'https://openrouter.ai',
                'http://localhost:*',
                'wss:',
                'https:',
              ].join(' '),
              "media-src 'self' blob: https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // X-Frame-Options - Prevents clickjacking attacks by blocking iframe embedding
          { key: 'X-Frame-Options', value: 'DENY' },
          // X-Content-Type-Options - Prevents MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer-Policy - Controls referrer information sent with requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions-Policy - Controls browser features and APIs
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          // Strict-Transport-Security - Forces HTTPS in production (only applied in production)
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ];
  },

  // Image optimization configuration
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

export default withSentryConfig(nextConfig, {
  org: 'multi-modal-studio',
  project: 'frontend',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  // Migrated from deprecated options (Sentry SDK 8+)
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },
});
