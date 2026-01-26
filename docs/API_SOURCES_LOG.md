# Multi-Modal Generation Studio - API Sources Log

**Last Updated**: 2026-01-26
**Purpose**: Quick reference for all AI model API documentation

---

## VIDEO PROVIDERS

### OpenAI Sora 2

- **Official Docs**: https://platform.openai.com/docs/api-reference/videos
- **Guide**: https://platform.openai.com/docs/guides/video-generation
- **Models**: `sora-2` (default), `sora-2-pro` (higher quality, slower)
- **Parameters**:
  - `duration`: 4, 8, or 12 seconds (default: 4)
  - `resolution`: e.g., "720x1280", "1024x1792"
  - `input_reference`: Image for image-to-video (must match target resolution)
  - `remix_video_id`: For remixing existing videos
- **Features**: Native audio generation (speech, SFX, ambience), remix capability
- **Workflow**: POST /videos → poll GET /videos/{id} or use webhooks

### Google Veo 2

- **Official Docs**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/2-0-generate
- **API Reference**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation
- **Model ID**: `veo-2.0-generate-exp`
- **Parameters**:
  - `duration`: 5-8 seconds (default: 8)
  - `aspectRatio`: Various aspect ratios
  - `negativePrompt`: Content to exclude
  - `personGeneration`: Safety settings ("allow_adult")
  - `sampleCount`: 1-4 videos per request
  - `seed`: For reproducibility
- **Features**: Text-to-video, Image-to-video, First/Last frame interpolation, 4K output
- **Access**: Vertex AI, Google AI Studio, VideoFX

### Kling AI

- **Official Docs**: https://klingai.com/global/dev/model/video
- **Third-party**: https://piapi.ai/kling-api, https://docs.aimlapi.com/api-references/video-models/kling-ai
- **Models**: Kling 1.6, 2.0, 2.1, 2.6 Pro
- **Parameters**:
  - `prompt`: Max 2,500 characters
  - `negative_prompt`: 2-2,500 characters
  - `cfg_scale`: 0-1 (default: 0.5)
  - `duration`: 5 or 10 seconds
  - `frame_rate`: 30 FPS
  - `camera`: horizontal, vertical, pan, tilt, roll, zoom
  - `enable_audio`: Native audio (v2.6 Pro only, 2x price)
- **Resolutions**:
  - Standard: 1280×720, 720×720, 720×1280
  - Pro: 1920×1080, 1080×1080, 1080×1920
- **Features**: Video extension (+4.5s), native audio (v2.6), camera controls

### Pika Labs

- **Official**: https://pika.art/api (via Fal.ai)
- **Fal.ai**: https://fal.ai/models/fal-ai/pika/v2.2/text-to-video
- **Third-party**: https://www.pikapikapika.io/, https://docs.pollo.ai/m/pika/pika-v2-2
- **Models**: Pika 2.2, Pika 2.2 Pro
- **Parameters**:
  - `prompt`, `negativePrompt`
  - `resolution`: 720p or 1080p
  - `length`: 5-10 seconds
  - `aspectRatio`: e.g., "16:9"
  - `frameRate`: e.g., 24
  - `camera`: rotate, zoom, tilt, pan
  - `guidanceScale`, `motion`, `seed`
- **Features**: PikaFrames (keyframe interpolation), Pikascenes (multi-reference)
- **Pricing**: $0.20/5s (720p), $0.45/5s (1080p)

### Runway Gen-4

- **Official Docs**: https://docs.dev.runwayml.com/
- **API Reference**: https://docs.dev.runwayml.com/api/
- **Models**: `gen4_turbo` (image-to-video), `gen4_aleph` (video-to-video)
- **Parameters**:
  - Supported resolutions: "1280:720", "720:1280", "1104:832", "960:960", "832:1104", "1584:672", "848:480", "640:480"
- **Features**: Image-to-video, Video-to-video, 4X upscaling (max 4096px), character/location consistency
- **Upcoming**: Gen-4.5 API, GWM-1 Avatars API, Robotics SDK
- **Pricing**: 1 credit = $0.01

### Luma Dream Machine (Ray2/Ray3)

- **Official Docs**: https://docs.lumalabs.ai/docs/api
- **Ray2 Guide**: https://lumalabs.ai/learning-hub/dream-machine-guide-ray2
- **Fal.ai**: https://fal.ai/models/fal-ai/luma-dream-machine/ray-2/api
- **Models**: Ray2, Ray3 (latest)
- **Features**:
  - Ray2: 1080p native, 4K upscaling, audio generation
  - Ray3: State-of-the-art realism, physics, character consistency, higher detail
- **Workflow**: Create request → get ID → poll until ready

### Vidu 2.0

- **Official Docs**: https://docs.pollo.ai/m/vidu/vidu-v2-0
- **Platform**: https://platform.vidu.com/
- **Parameters**:
  - `image`: HTTPS URL (JPG, PNG, JPEG)
  - `prompt`: Up to 2,500 characters
  - `length`: 4 or 8 seconds (default: 4)
  - `resolution`: 720p or 1080p
  - `imageTail`: End-frame URL for transitions
  - `movementAmplitude`: auto, small, medium, large
  - `seed`: For reproducibility
- **Features**: Multi-reference (up to 7 images), first/last frame control
- **Pricing**: ~$0.0375/second (55% cheaper than average)

### Genmo (Mochi 1)

- **GitHub**: https://github.com/genmoai/mochi
- **HuggingFace**: https://huggingface.co/genmo/mochi-1-preview
- **Type**: Local/Python inference (no REST API)
- **Parameters**:
  - `height`, `width`: Video dimensions
  - `num_frames`: Up to 31 frames
  - `num_inference_steps`: 64 recommended
  - `prompt`, `negative_prompt`
  - `seed`, `sigma_schedule`, `cfg_schedule`
- **Features**: 10B params, LoRA fine-tuning, ComfyUI integration
- **Hardware**: 1 H100 (~60GB VRAM), or <20GB with ComfyUI optimizations
- **Pricing**: Free/Open-source (Apache 2.0)

### Haiper AI

- **Official Docs**: https://docs.haiper.ai/
- **Text-to-Video**: https://docs.haiper.ai/api-reference/endpoint/2-0-text-to-video
- **Image-to-Video**: https://docs.haiper.ai/api-reference/endpoint/2-0-image-to-video
- **Parameters**:
  - `prompt`, `negative_prompt`
  - `duration`: 4 or 6 seconds
  - `aspect_ratio`: 21:9, 16:9, 9:16, 3:4, 4:3, 1:1
  - `gen_mode`: standard, smooth, enhanced
  - `seed`, `is_enable_prompt_enhancer`
- **Pricing**: $0.05/sec (720p), $0.033/sec (540p)
- **Plans**: Explorer $8/mo, Pro $24/mo

### Adobe Firefly Video

- **Official Docs**: https://developer.adobe.com/firefly-services/docs/firefly-api/
- **Audio/Video API**: https://developer.adobe.com/audio-video-firefly-services/
- **Parameters**:
  - `duration`: 5, 8, or 10 seconds
  - `resolution`: 720p or 1080p
  - Frame rates: 24, 25, 29.97, 30, 50, 59.94, 60 FPS
- **Features**: Text/image-to-video, Video Reframing, Translate & Lip Sync, Avatar Video
- **Auth**: OAuth 2.0 (Client ID + Secret)
- **Rate Limit**: 100 req/min

---

## IMAGE PROVIDERS

### Black Forest Labs FLUX.2 Max

- **Official Docs**: https://docs.bfl.ml/quick_start/introduction
- **Replicate**: https://replicate.com/black-forest-labs/flux-2-max
- **DeepInfra**: https://deepinfra.com/black-forest-labs/FLUX-2-max/api
- **Model**: `black-forest-labs/FLUX-2-max` (32B parameters)
- **Parameters**:
  - `prompt`: Text description
  - `size`: e.g., "1024x1024"
  - `n`: Number of images
  - Multi-reference editing: Up to 10 reference images
- **Features**: Exceptional editing consistency (colors, lighting, faces, text), multi-reference support
- **Pricing (OpenRouter)**:
  - Input: $0.03 per megapixel
  - Output: $0.07 first MP, $0.03 each subsequent
- **Use Cases**: Product marketing, e-commerce, interior design, 3D reconstruction

### Midjourney v7

- **Official Docs**: https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
- **Version Info**: https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- **Third-party API**: https://piapi.ai/docs/midjourney-api/v7
- **Parameters**:
  - `--ar`: Aspect ratio
  - `--no`: Negative prompt
  - `--v`: Version (e.g., --v 7)
  - `--cref`: Character reference (improved in v7)
  - `--sref`: Style reference
  - `--oref`: Object reference (keep subject consistent)
  - `--draft`: Fast preview mode
  - `--quality`: Works differently in v7
- **Features**: Character/style/object consistency, draft mode for fast previews
- **Note**: No official API; use third-party services (PiAPI, TT API)

### Ideogram 3.0

- **Official Docs**: https://developer.ideogram.ai/
- **Generate Endpoint**: https://developer.ideogram.ai/api-reference/api-reference/generate-v3
- **Edit Endpoint**: https://developer.ideogram.ai/api-reference/api-reference/edit-v3
- **Remix Endpoint**: https://developer.ideogram.ai/api-reference/api-reference/remix-v3
- **Together AI**: https://www.together.ai/models/ideogram-3-0
- **Parameters**:
  - `prompt`, `negative_prompt`
  - `aspect_ratio`: Default 1x1 (cannot use with resolution)
  - `seed`: For reproducibility
  - `magic_prompt`: Optional enhancement
  - `style_preset`: Predefined artistic styles
  - `style_reference_images`: Up to 3 images (max 10MB total)
  - `character_reference`: 1 image (max 10MB), special pricing
- **Features**: Industry-leading text rendering, style references
- **Auth**: Header "Api-Key"

---

## ICON/VECTOR PROVIDERS

### Recraft v3

- **Official Docs**: https://www.recraft.ai/docs/api-reference/getting-started
- **Swagger**: https://external.api.recraft.ai/doc/
- **Endpoint**: `POST https://api.recraft.ai/v1/images/generations`
- **Auth**: Bearer token (`Authorization: Bearer RECRAFT_API_TOKEN`)
- **Parameters**:
  - `model`: "recraft-v3" or "recraft-v2"
  - `prompt`: Max 4,000 characters
  - `image_size`: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9 (or custom 64-1536px, multiples of 32)
  - `style`: realistic_image, digital_illustration, vector_illustration, icon
  - `substyles`: engraving, line_art, line_circuit, linocut
  - `colors`: RGB color preferences array
  - `num_images`: 1 per request
- **Output Formats**: PNG, JPG, WEBP (raster), SVG (vector)
- **Pricing**: $0.04/image (raster), $0.08/image (vector/SVG)
- **Rate Limit**: 100 images/min
- **Features**: Superior text rendering, custom styles via reference images

### Adobe Firefly Vector

- **Official Docs**: https://developer.adobe.com/firefly-services/docs/firefly-api/
- **Endpoint**: `POST https://firefly-api.adobe.io/v2/images/generate`
- **Text-to-Vector**: Vector Model 2
- **Auth**: OAuth 2.0 (Client ID + Secret, 24h token expiry)
- **Scopes**: openid, AdobeID, session, firefly_api, ff_apis
- **Parameters**:
  - `prompt`: Text description
  - `n`: Number of variations
  - `size`: Max native 2048px, upscaling to 4K/8K
  - `style`: Preset options (cinematic, dramatic_lighting, etc.)
  - `negative_prompt`: Exclusions
  - `contentClass`, `structure`: Additional controls
- **Output**: PNG, JPG, SVG with editable paths/gradients
- **Features**: C2PA content credentials, upscaling, Creative Cloud integration
- **Pricing**: ~$0.02/image or generative credits system

---

## LOCAL WORKERS

### Qwen-Image

- **Model**: Qwen-VL series
- **Port**: 8004
- **VRAM**: ~10GB

### Hunyuan 3.0 (Image)

- **Model**: Tencent Hunyuan DiT
- **Port**: 8005
- **VRAM**: ~12GB

### SAM 2

- **Model**: Meta Segment Anything 2
- **Port**: 8006
- **VRAM**: ~6GB

### Hunyuan Video

- **Model**: Tencent Hunyuan Video
- **Port**: 8007
- **VRAM**: ~24GB

### SVG Turbo

- **Port**: 8008
- **VRAM**: ~2GB

---

## AUDIO PROVIDERS

### ElevenLabs

- **Docs**: https://elevenlabs.io/docs/api-reference
- **Model**: `eleven_multilingual_v3`
- **Parameters**: stability, similarity_boost, style, use_speaker_boost

### OpenAI TTS

- **Model**: `tts-2-hd`
- **Voices**: alloy, echo, fable, onyx, nova, shimmer

---

## SEARCH LOG

| Date       | Provider       | Search Query              | Quality Sources Found                    |
| ---------- | -------------- | ------------------------- | ---------------------------------------- |
| 2026-01-26 | Sora 2         | OpenAI Sora API 2026      | platform.openai.com/docs                 |
| 2026-01-26 | Veo 2          | Google Veo 2 API 2026     | docs.cloud.google.com                    |
| 2026-01-26 | Kling          | Kling AI API 2026         | klingai.com, piapi.ai                    |
| 2026-01-26 | Pika           | Pika Labs API 2026        | fal.ai, pikapikapika.io                  |
| 2026-01-26 | Runway         | Runway Gen-4 API 2026     | docs.dev.runwayml.com                    |
| 2026-01-26 | Luma           | Luma Ray2 API 2026        | docs.lumalabs.ai                         |
| 2026-01-26 | FLUX           | FLUX 2 Max API 2026       | docs.bfl.ml                              |
| 2026-01-26 | Midjourney     | Midjourney v7 API 2026    | docs.midjourney.com                      |
| 2026-01-26 | Ideogram       | Ideogram 3.0 API 2026     | developer.ideogram.ai                    |
| 2026-01-26 | Vidu           | Vidu 2.0 API 2026         | docs.pollo.ai, platform.vidu.com         |
| 2026-01-26 | Genmo          | Genmo Mochi API 2026      | github.com/genmoai, huggingface.co       |
| 2026-01-26 | Haiper         | Haiper AI API 2026        | docs.haiper.ai                           |
| 2026-01-26 | Firefly Video  | Adobe Firefly Video 2026  | developer.adobe.com                      |
| 2026-01-26 | Recraft        | Recraft v3 API 2026       | recraft.ai/docs, external.api.recraft.ai |
| 2026-01-26 | Firefly Vector | Adobe Firefly Vector 2026 | developer.adobe.com                      |
