import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Allow scripts from self and inline (required for Next.js)
              "style-src 'self' 'unsafe-inline'", // Allow styles from self and inline (required for styled-components)
              [
                "img-src 'self' data: blob:",
                'https://images.openai.com', // OpenAI DALL-E images
                'https://oaidalleapiprodscus.blob.core.windows.net', // OpenAI DALL-E storage
                'https://replicate.delivery', // Replicate AI image delivery
                'https://*.runwayml.com', // Runway ML image/video outputs
                'https://*.lumalabs.ai', // Luma Labs Dream Machine outputs
                'https://*.supabase.co', // Supabase storage
                'https://img.youtube.com', // YouTube thumbnails
                'https://picsum.photos', // Stock placeholder images
                'https:', // Fallback for other AI-generated images
              ].join(' '), // Allow images from various sources
              "font-src 'self' data:", // Allow fonts from self and data URIs
              [
                "connect-src 'self'",
                'https://api.anthropic.com', // Claude AI
                'https://api.deepseek.com', // Deepseek LLM
                'https://api.elevenlabs.io', // ElevenLabs TTS
                'https://api.groq.com', // Groq LLM
                'https://api.lumalabs.ai', // Luma Labs Dream Machine
                'https://api.openai.com', // OpenAI GPT/DALL-E
                'https://api.replicate.com', // Replicate AI models
                'https://api.runwayml.com', // Runway ML Gen-3
                'https://api.stability.ai', // Stability AI (Stable Diffusion)
                'https://api.unsplash.com', // Unsplash stock photos
                'https://api.x.ai', // X.AI/Grok LLM
                'https://*.googleapis.com', // Google AI (Gemini)
                'https://*.supabase.co', // Supabase backend
                'https://openrouter.ai', // OpenRouter multi-model routing
                'http://localhost:*', // Local model servers (Ollama, LM Studio)
                'wss:', // WebSocket connections
                'https:', // Fallback for other HTTPS APIs
              ].join(' '), // Allow API connections
              "media-src 'self' blob: https:", // Allow media from self, blobs, and HTTPS sources
              "frame-ancestors 'none'", // Prevent embedding in iframes (clickjacking protection)
              "base-uri 'self'", // Restrict base tag to same origin
              "form-action 'self'", // Restrict form submissions to same origin
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

export default nextConfig;
