# UI Feature Audit Report - Multi-Modal Generation Studio

**Date**: 2026-01-26
**Purpose**: Ensure all model features are properly exposed in the UI

---

## SUMMARY

| Studio | API Capabilities | Exposed in UI | Coverage | Priority Gaps                        |
| ------ | ---------------- | ------------- | -------- | ------------------------------------ |
| Image  | 12+ parameters   | 10            | ~83%     | numImages, provider-specific         |
| Video  | 8+ parameters    | 5             | ~62%     | prompt input, duration, aspect ratio |
| Audio  | 10+ parameters   | 4             | ~40%     | voice tuning, format options         |
| Icons  | 6+ parameters    | 6             | 100%     | None                                 |

---

## IMAGE STUDIO

### Parameters EXPOSED

- Prompt (textarea)
- Model selection (21 models)
- Style Presets
- Width & Height (dimensions + manual)
- Aspect ratio selector
- Steps (1-50)
- CFG Scale / Guidance (1-20)
- Negative Prompt (conditional)
- Fine-tune: Lighting, Contrast, Warmth, Vibrance
- Advanced: Seed, Scheduler, Output Format
- Inpainting via canvas

### Parameters MISSING (API supports)

| Parameter               | Provider             | Priority                         |
| ----------------------- | -------------------- | -------------------------------- |
| `numImages`             | All                  | HIGH - Batch generation          |
| `quality`               | OpenAI               | MEDIUM - HD vs standard          |
| `aspect_ratio`          | Stability            | MEDIUM - Currently hardcoded 1:1 |
| Model version           | Replicate            | LOW                              |
| Upscaling options       | FLUX, Ideogram       | MEDIUM                           |
| Character reference     | Ideogram, Midjourney | HIGH - New v7 feature            |
| Style reference         | Ideogram, Midjourney | HIGH                             |
| Multi-reference editing | FLUX Max             | MEDIUM - Up to 10 refs           |

---

## VIDEO STUDIO

### Parameters EXPOSED

- Model selection (23 models)
- Camera Controls (pan X/Y, zoom, tilt, roll)
- Keyframe Controls
- Motion Tuning (Stability, Amplitude, Coherence)
- Seed
- Seamless Loop Mode
- Frame Interpolation

### Parameters MISSING (API supports)

| Parameter         | Provider            | Priority                        |
| ----------------- | ------------------- | ------------------------------- |
| **Prompt input**  | All                 | CRITICAL - Currently hardcoded! |
| `duration`        | All                 | HIGH - 4/5/8/10/12s options     |
| `aspect_ratio`    | Veo, Luma, Haiper   | HIGH                            |
| `resolution`      | All                 | HIGH - 720p/1080p/4K            |
| `negative_prompt` | Kling, Pika, Haiper | MEDIUM                          |
| `gen_mode`        | Haiper              | LOW - standard/smooth/enhanced  |
| `enable_audio`    | Kling 2.6, Sora     | MEDIUM - Native audio           |
| `remix_video_id`  | Sora                | LOW - Remix feature             |
| First/last frame  | Veo, Vidu           | MEDIUM                          |

---

## AUDIO STUDIO

### Parameters EXPOSED

- Voice selection (dropdown)
- Text input
- Language (Qwen3-TTS)
- Mode tabs (Generate, Compose, Clone, Design, Train)
- Clone: reference audio + transcript
- Design: voice description
- Training: sample upload

### Parameters MISSING (API supports)

| Parameter             | Provider   | Priority                        |
| --------------------- | ---------- | ------------------------------- |
| `stability`           | ElevenLabs | HIGH - Currently hardcoded 0.35 |
| `similarity_boost`    | ElevenLabs | HIGH - Hardcoded 0.8            |
| `style`               | ElevenLabs | MEDIUM - Hardcoded 0.2          |
| `use_speaker_boost`   | ElevenLabs | LOW - Hardcoded true            |
| `response_format`     | OpenAI TTS | MEDIUM - mp3/wav/opus/aac       |
| Audio quality/bitrate | All        | LOW                             |

---

## ICON STUDIO

### Parameters EXPOSED

- Style DNA Builder (complexity, curviness, contrast, vibrance, lighting)
- DNA mixing mode
- Theme-based generation
- Aesthetic vector visualization

### Status: COMPLETE - All parameters exposed

---

## RECOMMENDATIONS

### HIGH PRIORITY (Implement First)

1. **Video Prompt Input** - Remove hardcoded "Advanced cinematic shot" fallback, add text input field
2. **Duration Slider** - Video studio needs duration options (4-12s based on model)
3. **Batch Generation** - Add `numImages` slider to image studio (1-4)
4. **Aspect Ratio** - Add dropdown for video aspect ratios (16:9, 9:16, 1:1, etc.)
5. **Voice Tuning** - Expose ElevenLabs stability/similarity sliders

### MEDIUM PRIORITY

6. **Resolution Selection** - 720p/1080p/4K options for video
7. **Reference Images** - Character/style reference for Midjourney v7, Ideogram
8. **Negative Prompts** - Expose for video providers that support it
9. **Audio Format** - MP3/WAV/OGG dropdown

### LOW PRIORITY

10. **Gen Mode** - Haiper standard/smooth/enhanced toggle
11. **Native Audio** - Toggle for Sora/Kling audio generation
12. **Provider-specific presets** - Quality settings per provider

---

## IMPLEMENTATION APPROACH

### Dynamic Parameter Forms

Create adaptive UI that shows only parameters supported by selected model:

```tsx
// Example: Model capability-driven UI
const modelCapabilities = supportedModels[selectedModelId]?.capabilities;

{
  modelCapabilities?.duration && <Slider label="Duration" min={4} max={12} step={1} />;
}

{
  modelCapabilities?.characterReference && <ImageUpload label="Character Reference" />;
}
```

### Model Metadata Enhancement

Update `supported-models.ts` to include full parameter definitions:

```typescript
interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  parameters: {
    duration?: { min: number; max: number; default: number; options?: number[] };
    aspectRatio?: { options: string[]; default: string };
    resolution?: { options: string[]; default: string };
    // ... etc
  };
}
```

---

## FILES TO MODIFY

1. `src/components/video-studio/VideoStudio.tsx` - Add prompt input, duration, aspect ratio
2. `src/components/image-studio/ImageStudio.tsx` - Add numImages, reference uploads
3. `src/components/audio-studio/AudioStudio.tsx` - Add voice tuning sliders
4. `src/lib/models/supported-models.ts` - Add full parameter metadata per model
5. `src/lib/store/video-studio-store.ts` - Add duration, aspectRatio state
6. `src/lib/store/image-studio-store.ts` - Add numImages, references state
