# Qwen3-TTS Full Implementation Plan

## Overview

Complete frontend and backend integration for Qwen3-TTS with voice cloning, custom voices, voice design, and LoRA voice training.

## Current Status (Completed)

- [x] VoiceSelector component fixed to use store voices
- [x] Audio studio store types (QwenTTSMode, VoiceCloneRef, TrainingSample, VoiceTrainingJob)
- [x] Audio studio store actions (all Qwen3 actions)
- [x] Backend API routes (clone, custom, design)
- [x] Python worker script (scripts/qwen-tts-worker.py)
- [x] Model registry (5 Qwen3-TTS models)
- [x] QWEN3_VOICES array (9 premium timbres)

---

## Micro-Task Breakdown (48 Tasks)

### GROUP 1: QwenTTSPanel Component Core (5 tasks)

| Task | Description                                       | File                                           | Dependencies |
| ---- | ------------------------------------------------- | ---------------------------------------------- | ------------ |
| 1.1  | Create QwenTTSPanel shell with tab structure      | `src/components/audio-studio/QwenTTSPanel.tsx` | None         |
| 1.2  | Add Clone tab UI with ref audio upload section    | `QwenTTSPanel.tsx`                             | 1.1          |
| 1.3  | Add Custom tab UI with style instruction input    | `QwenTTSPanel.tsx`                             | 1.1          |
| 1.4  | Add Design tab UI with voice description textarea | `QwenTTSPanel.tsx`                             | 1.1          |
| 1.5  | Add Train tab header and dataset upload section   | `QwenTTSPanel.tsx`                             | 1.1          |

### GROUP 2: Reference Audio Upload Component (5 tasks)

| Task | Description                                 | File                                                   | Dependencies |
| ---- | ------------------------------------------- | ------------------------------------------------------ | ------------ |
| 2.1  | Create ReferenceAudioUpload component shell | `src/components/audio-studio/ReferenceAudioUpload.tsx` | None         |
| 2.2  | Implement file upload handler with blob URL | `ReferenceAudioUpload.tsx`                             | 2.1          |
| 2.3  | Add audio preview player with waveform      | `ReferenceAudioUpload.tsx`                             | 2.2          |
| 2.4  | Add transcript input field                  | `ReferenceAudioUpload.tsx`                             | 2.1          |
| 2.5  | Add file size/duration validation           | `ReferenceAudioUpload.tsx`                             | 2.1, 2.2     |

### GROUP 3: Training Dataset Upload (5 tasks)

| Task | Description                               | File                                                 | Dependencies |
| ---- | ----------------------------------------- | ---------------------------------------------------- | ------------ |
| 3.1  | Create DragDropZone component             | `src/components/audio-studio/DragDropZone.tsx`       | None         |
| 3.2  | Implement file validation in DragDropZone | `DragDropZone.tsx`                                   | 3.1          |
| 3.3  | Add multiple file batch upload handler    | `DragDropZone.tsx`                                   | 3.1, 3.2     |
| 3.4  | Create TrainingSampleList component       | `src/components/audio-studio/TrainingSampleList.tsx` | None         |
| 3.5  | Add remove/edit buttons to each sample    | `TrainingSampleList.tsx`                             | 3.4          |

### GROUP 4: Training Progress & Language UI (4 tasks)

| Task | Description                              | File                                                      | Dependencies |
| ---- | ---------------------------------------- | --------------------------------------------------------- | ------------ |
| 4.1  | Create TrainingProgressDisplay component | `src/components/audio-studio/TrainingProgressDisplay.tsx` | None         |
| 4.2  | Add time estimate and speed metrics      | `TrainingProgressDisplay.tsx`                             | 4.1          |
| 4.3  | Add language selector to QwenTTSPanel    | `QwenTTSPanel.tsx`                                        | 1.1          |
| 4.4  | Add X-Vector mode toggle to Clone tab    | `QwenTTSPanel.tsx`                                        | 1.2          |

### GROUP 5: Batch Transcript & Integration (3 tasks)

| Task | Description                                 | File               | Dependencies |
| ---- | ------------------------------------------- | ------------------ | ------------ |
| 5.1  | Add transcript batch input UI to Train tab  | `QwenTTSPanel.tsx` | 1.5          |
| 5.2  | Implement transcript parsing and validation | `QwenTTSPanel.tsx` | 5.1          |
| 5.3  | Connect QwenTTSPanel to AudioStudio         | `AudioStudio.tsx`  | 1.1-1.5      |

### GROUP 6: Training API Route (5 tasks)

| Task | Description                                 | File                                             | Dependencies |
| ---- | ------------------------------------------- | ------------------------------------------------ | ------------ |
| 6.1  | Create /api/generate/audio/qwen/train route | `src/app/api/generate/audio/qwen/train/route.ts` | None         |
| 6.2  | Add auth and request validation             | `train/route.ts`                                 | 6.1          |
| 6.3  | Add multipart form-data parsing             | `train/route.ts`                                 | 6.1          |
| 6.4  | Create training job and trigger worker      | `train/route.ts`                                 | 6.2, 6.3     |
| 6.5  | Return job status with polling endpoint     | `train/route.ts`                                 | 6.4          |

### GROUP 7: Training Webhook (2 tasks)

| Task | Description                             | File                                          | Dependencies |
| ---- | --------------------------------------- | --------------------------------------------- | ------------ |
| 7.1  | Create POST /api/webhooks/qwen/training | `src/app/api/webhooks/qwen/training/route.ts` | None         |
| 7.2  | Implement job status updates in webhook | `training/route.ts`                           | 7.1          |

### GROUP 8: Python Worker Training (3 tasks)

| Task | Description                             | File                         | Dependencies |
| ---- | --------------------------------------- | ---------------------------- | ------------ |
| 8.1  | Create /train endpoint in Python worker | `scripts/qwen-tts-worker.py` | None         |
| 8.2  | Implement LoRA fine-tuning pipeline     | `qwen-tts-worker.py`         | 8.1          |
| 8.3  | Add progress tracking callbacks         | `qwen-tts-worker.py`         | 8.1          |

### GROUP 9: AudioStudio Integration (6 tasks)

| Task | Description                               | File              | Dependencies |
| ---- | ----------------------------------------- | ----------------- | ------------ |
| 9.1  | Update handleGenerate to detect Qwen mode | `AudioStudio.tsx` | 5.3          |
| 9.2  | Route clone mode to /qwen/clone           | `AudioStudio.tsx` | 9.1          |
| 9.3  | Route custom mode to /qwen/custom         | `AudioStudio.tsx` | 9.1          |
| 9.4  | Route design mode to /qwen/design         | `AudioStudio.tsx` | 9.1          |
| 9.5  | Route train mode to /qwen/train           | `AudioStudio.tsx` | 9.1          |
| 9.6  | Add polling for training job progress     | `AudioStudio.tsx` | 9.5          |

### GROUP 10: Error Handling & Streaming (3 tasks)

| Task | Description                            | File               | Dependencies |
| ---- | -------------------------------------- | ------------------ | ------------ |
| 10.1 | Add error handling to all Qwen calls   | `AudioStudio.tsx`  | 9.1-9.5      |
| 10.2 | Add streaming audio response handling  | All Qwen endpoints | GROUP 6-7    |
| 10.3 | Add timeout handling for training jobs | `AudioStudio.tsx`  | 9.6          |

### GROUP 11: Verification (3 tasks)

| Task | Description                        | File      | Dependencies |
| ---- | ---------------------------------- | --------- | ------------ |
| 11.1 | Test QwenTTSPanel renders all tabs | Test file | GROUP 1-5    |
| 11.2 | Test clone workflow end-to-end     | Test file | GROUP 9      |
| 11.3 | Test training workflow end-to-end  | Test file | GROUP 9      |

---

## Parallelization Plan

### Wave 1 (Parallel) - Component & Route Shells

- Tasks: 1.1, 2.1, 3.1, 3.4, 4.1, 6.1, 7.1, 8.1
- All component shells and endpoint stubs

### Wave 2 (Parallel) - Component Implementations

- Tasks: 1.2-1.5, 2.2-2.5, 3.2-3.5, 4.2-4.4, 5.1-5.2
- Full component logic

### Wave 3 (Parallel) - API & Worker Logic

- Tasks: 6.2-6.5, 7.2, 8.2-8.3
- Endpoint validation, worker training logic

### Wave 4 (Sequential) - Integration

- Tasks: 5.3, 9.1-9.6
- AudioStudio integration (must be after endpoints ready)

### Wave 5 (Parallel) - Polish & Test

- Tasks: 10.1-10.3, 11.1-11.3
- Error handling and verification

---

## File Structure

```
src/
  components/audio-studio/
    QwenTTSPanel.tsx              (NEW)
    ReferenceAudioUpload.tsx      (NEW)
    DragDropZone.tsx              (NEW)
    TrainingSampleList.tsx        (NEW)
    TrainingProgressDisplay.tsx   (NEW)
    AudioStudio.tsx               (MODIFY)
    VoiceSelector.tsx             (DONE)
  app/api/generate/audio/qwen/
    train/route.ts                (NEW)
    clone/route.ts                (DONE)
    custom/route.ts               (DONE)
    design/route.ts               (DONE)
  app/api/webhooks/qwen/
    training/route.ts             (NEW)
  lib/store/
    audio-studio-store.ts         (DONE)
  lib/types/
    audio-studio.ts               (DONE)

scripts/
  qwen-tts-worker.py              (MODIFY - add /train)
```

---

## Qwen3-TTS Model Variants Reference

| Model                           | Size | Use Case                   | VRAM |
| ------------------------------- | ---- | -------------------------- | ---- |
| Qwen3-TTS-12Hz-1.7B-Base        | 1.7B | Voice cloning, fine-tuning | 8GB  |
| Qwen3-TTS-12Hz-0.6B-Base        | 0.6B | Lightweight cloning        | 4GB  |
| Qwen3-TTS-12Hz-1.7B-CustomVoice | 1.7B | 9 premium voices           | 8GB  |
| Qwen3-TTS-12Hz-0.6B-CustomVoice | 0.6B | 9 premium voices (light)   | 4GB  |
| Qwen3-TTS-12Hz-1.7B-VoiceDesign | 1.7B | Create voices from text    | 8GB  |

## 9 Premium CustomVoice Speakers

| Speaker  | Gender | Native Language    | Best For               |
| -------- | ------ | ------------------ | ---------------------- |
| Vivian   | Female | Chinese            | Marketing, Ads         |
| Serena   | Female | Chinese            | Audiobooks, Meditation |
| Uncle_Fu | Male   | Chinese            | Documentaries          |
| Dylan    | Male   | Chinese (Beijing)  | Vlogs, Tutorials       |
| Eric     | Male   | Chinese (Sichuan)  | Regional content       |
| Ryan     | Male   | English            | Sports, Gaming         |
| Aiden    | Male   | English (American) | E-learning             |
| Ono_Anna | Female | Japanese           | Anime, Games           |
| Sohee    | Female | Korean             | Drama, K-content       |

## Supported Languages

Chinese, English, Japanese, Korean, German, French, Russian, Portuguese, Spanish, Italian

---

## Sources

- [Qwen3-TTS GitHub](https://github.com/QwenLM/Qwen3-TTS)
- [Qwen3-TTS Technical Report](https://arxiv.org/abs/2601.15621)
- [HuggingFace Model Cards](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice)
