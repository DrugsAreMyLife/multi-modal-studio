# Multi-Modal Generation Studio

A comprehensive Next.js application for AI-powered content generation across multiple modalities: text, images, video, and audio. Built with TypeScript, React, and integrated with 15+ AI model providers.

## Features

- **Chat Interface**: Multi-model AI conversations with support for 15+ LLMs (GPT-5, Claude 4.5, Gemini 2.5, DeepSeek R1, and more)
- **Image Generation**: DALL-E 3, Stable Diffusion, and Replicate models
- **Video Generation**: Runway Gen-3, Luma Dream Machine, Kling, MiniMax, and more
- **Audio Generation**: ElevenLabs and OpenAI TTS
- **Icon Studio**: Specialized icon generation and style consistency
- **Analysis Studio**: Document and data analysis
- **Workflow Automation**: Visual workflow builder for chaining AI operations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS, shadcn/ui
- **State Management**: Zustand with persistence
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with OAuth (Google, GitHub)
- **AI SDKs**: Vercel AI SDK, OpenAI SDK, Anthropic SDK, Google Generative AI
- **Deployment**: Vercel-ready

## Quick Start

### Prerequisites

- Node.js 20+ and npm
- API keys for at least one AI provider (OpenAI, Anthropic, or Google)
- Supabase account (optional, for persistence and auth)

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <your-repo-url>
   cd multi-modal-generation-studio
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

3. **Configure API keys** (edit `.env`)

   ```bash
   # Required: At least one LLM provider
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   # OR
   GEMINI_API_KEY=...

   # Optional: Media generation providers
   RUNWAY_API_KEY=...
   LUMA_API_KEY=...
   ELEVENLABS_API_KEY=...

   # Optional: Supabase for persistence
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...

   # Optional: OAuth providers
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Configuration

### Supported AI Providers

#### Text Models (15 models)

- **OpenAI**: GPT-5, GPT-4.5 Turbo, o1, o3-mini
- **Anthropic**: Claude 4.5 Opus, Claude 4.5 Sonnet
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash
- **DeepSeek**: R1 (Reasoning), V3
- **Others**: Grok 2, Groq Llama, Mistral Large

#### Image Models

- **OpenAI**: DALL-E 3
- **Stability AI**: Stable Diffusion 3
- **Replicate**: FLUX Schnell

#### Video Models (11 models)

- Runway Gen-3 Alpha
- Luma Dream Machine
- Kling 1.0 Pro
- MiniMax (Hailuo)
- Sora (Preview)
- And 6 more...

#### Audio Models

- **ElevenLabs**: Multilingual V2
- **OpenAI**: TTS-1-HD, TTS-1

### Database Setup (Optional)

If using Supabase for persistence and authentication:

1. Create a new Supabase project at https://supabase.com
2. Run the schema migrations in `supabase/migrations/` (if provided)
3. Update `.env` with your Supabase URL and keys

**Required Tables**:

- `users` - User accounts
- `conversations` - Chat threads
- `messages` - Chat messages
- `generations` - Generated media (images, videos, audio)
- `api_usage` - API usage tracking
- `video_jobs` - Video generation job tracking

## Development

### Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # Chat streaming endpoint
│   │   ├── generate/     # Image, video, audio generation
│   │   ├── transcribe/   # Audio transcription
│   │   └── webhooks/     # Provider webhooks
│   └── page.tsx          # Main application
├── components/
│   ├── chat/             # Chat interface components
│   ├── audio-studio/     # Audio generation UI
│   ├── video-studio/     # Video generation UI
│   ├── image-studio/     # Image generation UI
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── models/           # AI model configurations
│   ├── store/            # Zustand state stores
│   ├── auth/             # Authentication logic
│   ├── db/               # Database clients (client/server)
│   └── middleware/       # Auth and rate limiting
└── types/                # TypeScript type definitions
```

### Key Files

- `src/lib/models/supported-models.ts` - All AI model metadata
- `src/lib/models/universal-model-factory.ts` - Provider abstraction layer
- `src/lib/store/chat-store.ts` - Chat state management
- `src/lib/hooks/useChatWithModel.ts` - Chat hook with model routing
- `src/lib/middleware/auth.ts` - Authentication and rate limiting

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

### CI/CD

GitHub Actions workflow configured in `.github/workflows/ci.yml`:

- Runs on push to `main` and `develop`
- Type checking with TypeScript
- ESLint validation
- Build verification

## Security

### Authentication

- NextAuth.js with JWT strategy
- OAuth tokens stored server-side only (not exposed to client)
- Supabase adapter for session persistence

### API Security

- Auth middleware on all generation endpoints
- Rate limiting (10 requests/minute for generation, 60/minute for chat)
- Webhook signature validation (HMAC-SHA256)

### Environment Variables

- Never commit `.env` files
- Use `.env.example` as template
- Service role keys server-side only

## Known Issues & Limitations

See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for current limitations including:

- Audio base64 response size
- In-memory video job tracking (migration to DB recommended)
- Replicate polling without timeouts
- In-memory rate limiting (Redis recommended for production)

## Testing

User testing documentation available in `User_Testing_Instructions/`:

- Phase 0 Tests: Model metadata, rate limiting, prototype badges
- Phase 1 Tests: Model selection, API routing, persistence
- Integration Tests: End-to-end user journeys

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker (Alternative)

```bash
docker build -t multi-modal-studio .
docker run -p 3000:3000 --env-file .env multi-modal-studio
```

### Environment Variables for Production

Required for production:

```bash
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-domain.com

# At least one AI provider key
OPENAI_API_KEY=...

# Recommended for persistence
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Recommended for webhook validation
RUNWAY_WEBHOOK_SECRET=...
LUMA_WEBHOOK_SECRET=...
REPLICATE_WEBHOOK_SECRET=...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Your License Here]

## Support

- Documentation: See `/User_Testing_Instructions` and `/IMPROVEMENT_PLAN.md`
- Issues: Create a GitHub issue
- Security: See SECURITY.md (if applicable)

---

**Built with** Next.js, TypeScript, and 15+ AI providers
**Last Updated**: 2026-01-17
