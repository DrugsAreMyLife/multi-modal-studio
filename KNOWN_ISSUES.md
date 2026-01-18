# Known Issues & Limitations

## Audio Generation - Base64 Response Size

**Issue**: Audio generation endpoints return full audio files as base64-encoded data URLs in the response body.

**Impact**:

- Large audio files (>1MB) can cause slow response times
- Base64 encoding increases payload size by ~33%
- May hit API gateway size limits for long audio clips

**Current Implementation**:

```typescript
// src/app/api/generate/audio/route.ts
const audioBuffer = await response.arrayBuffer();
const base64 = Buffer.from(audioBuffer).toString('base64');
return {
  success: true,
  audioBase64: base64, // Full file in response
  audioUrl: `data:audio/mpeg;base64,${base64}`, // Data URL
};
```

**Recommended Solutions** (pick one):

### Option 1: Stream Audio Directly (Best)

```typescript
// Return streaming response instead of JSON
const audioBuffer = await response.arrayBuffer();
return new Response(audioBuffer, {
  headers: {
    'Content-Type': 'audio/mpeg',
    'Content-Length': audioBuffer.byteLength.toString(),
  },
});
```

### Option 2: Upload to Storage & Return URL

```typescript
// Upload to cloud storage (S3, Supabase Storage, etc.)
const audioUrl = await uploadToStorage(audioBuffer, `audio-${Date.now()}.mp3`);
return {
  success: true,
  audioUrl, // Public URL instead of base64
};
```

### Option 3: Use Blob URLs (Client-side)

```typescript
// Server returns streaming response
// Client creates blob URL:
const blob = await response.blob();
const url = URL.createObjectURL(blob);
```

**Workarounds**:

- Limit audio duration to <30 seconds
- Use lower quality audio formats (tts-1 instead of tts-1-hd)
- Implement client-side chunking for long audio

---

## Video Generation - In-Memory Job Tracking

**Issue**: Video generation job status is tracked in-memory using JavaScript Maps.

**Impact**:

- Jobs lost on server restart
- No persistence between deployments
- Not scalable to multiple server instances

**Current Implementation**:

```typescript
// src/app/api/generate/video/status/route.ts
export const videoJobs = new Map<string, {...}>();
```

**Recommended Solution**: Use database for job tracking

- Database table created: `video_jobs`
- Functions added in `src/lib/db/server.ts`:
  - `createVideoJob()` - track new jobs
  - `getVideoJobByProviderId()` - lookup by provider job ID
  - `updateVideoJob()` - update status/progress

**Migration Path**:

1. Update video generation endpoint to call `createVideoJob()`
2. Update status endpoint to query database first, fallback to memory
3. Remove in-memory Maps once database is stable

---

## Replicate Polling - No Timeout

**Issue**: Replicate predictions poll indefinitely until completion/failure.

**Impact**:

- Hanging requests if prediction never completes
- Resource exhaustion on long-running jobs
- No automatic cleanup of stuck jobs

**Current Implementation**:

```typescript
// Polls forever
while (result.status !== 'succeeded' && result.status !== 'failed') {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const pollResponse = await fetch(result.urls.get);
  result = await pollResponse.json();
}
```

**Recommended Solution**: Add timeout and max attempts

```typescript
const MAX_ATTEMPTS = 120; // 2 minutes
const POLL_INTERVAL = 1000; // 1 second
let attempts = 0;

while (result.status !== 'succeeded' && result.status !== 'failed') {
  if (attempts++ >= MAX_ATTEMPTS) {
    return { success: false, error: 'Prediction timed out after 2 minutes' };
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  const pollResponse = await fetch(result.urls.get);
  result = await pollResponse.json();
}
```

**Better Solution**: Use webhooks instead of polling

- Replicate supports webhook callbacks
- Return job ID immediately, receive completion via webhook
- Already implemented in `src/app/api/webhooks/video/route.ts`

---

## Rate Limiting - In-Memory Store

**Issue**: Rate limiting uses in-memory Map, not shared across instances.

**Impact**:

- Rate limits not enforced across multiple servers
- Limits reset on server restart
- No distributed rate limiting

**Current Implementation**:

```typescript
// src/lib/middleware/auth.ts
const rateLimitStore = new Map<string, {...}>();
```

**Recommended Solution**: Use Redis for distributed rate limiting

```typescript
import { Redis } from '@upstash/redis';
const redis = new Redis({...});

// Sliding window rate limiting
const key = `rate-limit:${userId}:${endpoint}`;
const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, windowSeconds);
}
```

---

**Last Updated**: 2026-01-17
**Status**: Production awareness documented
