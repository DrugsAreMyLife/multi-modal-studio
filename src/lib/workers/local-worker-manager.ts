import { spawn, ChildProcess } from 'child_process';
import path from 'path';

/**
 * Unified Local Worker Manager
 *
 * Manages all local Python workers for audio/video/image generation.
 * Workers are started on-demand and can be stopped to free resources.
 */

export type LocalWorkerId =
  | 'qwen-tts'
  | 'heart'
  | 'audio-processor'
  | 'comfyui'
  | 'qwen-image'
  | 'hunyuan-image'
  | 'sam2'
  | 'hunyuan-video'
  | 'svg-turbo'
  | 'nvidia-personaplex';

export interface WorkerConfig {
  id: LocalWorkerId;
  label: string;
  script: string;
  port: number;
  healthEndpoint: string;
  envVar: string;
  startupTimeout: number; // ms
  vramEstimate: string;
  description: string;
}

export interface WorkerState {
  process: ChildProcess | null;
  pid: number | null;
  isStarting: boolean;
  isReady: boolean;
  lastHealthCheck: number | null;
  startAttempts: number;
  error: string | null;
  loadedAt: number | null;
}

export interface WorkerStatus {
  id: LocalWorkerId;
  label: string;
  isRunning: boolean;
  isReady: boolean;
  isStarting: boolean;
  error: string | null;
  vramEstimate: string;
  url: string;
  loadedAt: number | null;
}

// Worker configurations
export const WORKER_CONFIGS: Record<LocalWorkerId, WorkerConfig> = {
  'qwen-tts': {
    id: 'qwen-tts',
    label: 'Qwen3-TTS',
    script: 'scripts/qwen-tts-worker.py',
    port: 8003,
    healthEndpoint: '/health',
    envVar: 'QWEN_TTS_WORKER_URL',
    startupTimeout: 90000, // 90s for model loading
    vramEstimate: '8GB',
    description: 'Text-to-speech with voice cloning, design, and training',
  },
  heart: {
    id: 'heart',
    label: 'Heart Music',
    script: 'scripts/heart-worker.py',
    port: 8001,
    healthEndpoint: '/health',
    envVar: 'HEART_WORKER_URL',
    startupTimeout: 120000, // 2min for music model
    vramEstimate: '12GB',
    description: 'AI music generation with style control',
  },
  'audio-processor': {
    id: 'audio-processor',
    label: 'Audio Processor',
    script: 'scripts/audio-processor.py',
    port: 8002,
    healthEndpoint: '/health',
    envVar: 'AUDIO_PROCESSOR_URL',
    startupTimeout: 60000, // 1min for Demucs
    vramEstimate: '4GB',
    description: 'Stem separation, enhancement, and audio processing',
  },
  comfyui: {
    id: 'comfyui',
    label: 'ComfyUI',
    script: '', // External process, not managed by us
    port: 8188,
    healthEndpoint: '/system_stats',
    envVar: 'COMFYUI_BASE_URL',
    startupTimeout: 30000,
    vramEstimate: 'Variable',
    description: 'Image and video generation workflows',
  },
  'qwen-image': {
    id: 'qwen-image',
    label: 'Qwen-Image',
    script: 'scripts/qwen-image-worker.py',
    port: 8004,
    healthEndpoint: '/health',
    envVar: 'QWEN_IMAGE_WORKER_URL',
    startupTimeout: 90000,
    vramEstimate: '10GB',
    description: 'High-quality local image generation',
  },
  'hunyuan-image': {
    id: 'hunyuan-image',
    label: 'Hunyuan 3.0',
    script: 'scripts/hunyuan-image-worker.py',
    port: 8005,
    healthEndpoint: '/health',
    envVar: 'HUNYUAN_IMAGE_WORKER_URL',
    startupTimeout: 90000,
    vramEstimate: '12GB',
    description: 'Tencent Hunyuan 3.0 image model',
  },
  sam2: {
    id: 'sam2',
    label: 'SAM 2',
    script: 'scripts/sam2-worker.py',
    port: 8006,
    healthEndpoint: '/health',
    envVar: 'SAM2_WORKER_URL',
    startupTimeout: 60000,
    vramEstimate: '6GB',
    description: 'Segment Anything Model 2 for object isolation',
  },
  'hunyuan-video': {
    id: 'hunyuan-video',
    label: 'Hunyuan Video',
    script: 'scripts/hunyuan-video-worker.py',
    port: 8007,
    healthEndpoint: '/health',
    envVar: 'HUNYUAN_VIDEO_WORKER_URL',
    startupTimeout: 120000,
    vramEstimate: '24GB',
    description: 'Tencent Hunyuan Video flagship model',
  },
  'svg-turbo': {
    id: 'svg-turbo',
    label: 'SVG Turbo',
    script: 'scripts/svg-turbo-worker.py',
    port: 8008,
    healthEndpoint: '/health',
    envVar: 'SVG_TURBO_WORKER_URL',
    startupTimeout: 30000,
    vramEstimate: '2GB',
    description: 'Fast local SVG generation',
  },
  'nvidia-personaplex': {
    id: 'nvidia-personaplex',
    label: 'PersonaPlex',
    script: 'scripts/personaplex-worker.py',
    port: 8015,
    healthEndpoint: '/health',
    envVar: 'PERSONAPLEX_WORKER_URL',
    startupTimeout: 120000, // 2min for 7B model loading
    vramEstimate: '16GB',
    description: 'NVIDIA 7B full-duplex conversational voice AI',
  },
};

// Helper to parse VRAM strings to MB
function parseVramToMB(vram: string): number {
  const match = vram.match(/^(\d+)GB$/);
  return match ? parseInt(match[1]) * 1024 : 0;
}

const TOTAL_SYSTEM_VRAM_MB = 24 * 1024; // Default to 24GB (typical high-end GPU)

// Singleton state for all workers
const workerStates: Record<LocalWorkerId, WorkerState> = {
  'qwen-tts': createEmptyState(),
  heart: createEmptyState(),
  'audio-processor': createEmptyState(),
  comfyui: createEmptyState(),
  'qwen-image': createEmptyState(),
  'hunyuan-image': createEmptyState(),
  sam2: createEmptyState(),
  'hunyuan-video': createEmptyState(),
  'svg-turbo': createEmptyState(),
  'nvidia-personaplex': createEmptyState(),
};

function createEmptyState(): WorkerState {
  return {
    process: null,
    pid: null,
    isStarting: false,
    isReady: false,
    lastHealthCheck: null,
    startAttempts: 0,
    error: null,
    loadedAt: null,
  };
}

const MAX_START_ATTEMPTS = 3;

/**
 * Get the URL for a worker
 */
export function getWorkerUrl(workerId: LocalWorkerId): string {
  const config = WORKER_CONFIGS[workerId];
  const envUrl = process.env[config.envVar];
  if (envUrl) return envUrl;
  return `http://localhost:${config.port}`;
}

/**
 * Check if a worker is healthy
 */
export async function checkWorkerHealth(workerId: LocalWorkerId): Promise<boolean> {
  const config = WORKER_CONFIGS[workerId];
  const state = workerStates[workerId];
  const url = getWorkerUrl(workerId);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}${config.healthEndpoint}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      // Check for models_loaded flag (Qwen pattern) or just status
      const isHealthy =
        data.status === 'healthy' || data.status === 'ok' || data.models_loaded === true;
      state.isReady = isHealthy;
      state.lastHealthCheck = Date.now();
      state.error = null;
      if (isHealthy && !state.loadedAt) {
        state.loadedAt = Date.now();
      }
      return isHealthy;
    }
    return false;
  } catch {
    state.isReady = false;
    return false;
  }
}

/**
 * Start a worker process
 */
export async function startWorker(
  workerId: LocalWorkerId,
): Promise<{ success: boolean; error?: string }> {
  const config = WORKER_CONFIGS[workerId];
  const state = workerStates[workerId];

  // ComfyUI is external, just check health
  if (workerId === 'comfyui') {
    const healthy = await checkWorkerHealth(workerId);
    if (healthy) {
      return { success: true };
    }
    return { success: false, error: 'ComfyUI is not running. Please start it externally.' };
  }

  // Already running and healthy
  if (await checkWorkerHealth(workerId)) {
    return { success: true };
  }

  // VRAM check
  const currentUsageMB = Object.keys(workerStates)
    .filter((id) => workerStates[id as LocalWorkerId].isReady)
    .reduce((sum, id) => sum + parseVramToMB(WORKER_CONFIGS[id as LocalWorkerId].vramEstimate), 0);

  const estimatedNeededMB = parseVramToMB(config.vramEstimate);

  if (currentUsageMB + estimatedNeededMB > TOTAL_SYSTEM_VRAM_MB) {
    return {
      success: false,
      error: `Insufficient VRAM. Total used: ${currentUsageMB}MB, Needed: ${estimatedNeededMB}MB, Limit: ${TOTAL_SYSTEM_VRAM_MB}MB. Please stop other workers.`,
    };
  }

  // Already starting
  if (state.isStarting) {
    return waitForWorkerReady(workerId);
  }

  // Too many failed attempts
  if (state.startAttempts >= MAX_START_ATTEMPTS) {
    return {
      success: false,
      error: `Failed to start ${config.label} after ${MAX_START_ATTEMPTS} attempts. ${state.error || ''}`,
    };
  }

  state.isStarting = true;
  state.startAttempts++;

  try {
    const scriptPath = path.join(process.cwd(), config.script);
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    console.log(`[${config.label}] Starting worker (attempt ${state.startAttempts})...`);

    const workerProcess = spawn(pythonCmd, [scriptPath], {
      env: {
        ...process.env,
        [`${workerId.toUpperCase().replace('-', '_')}_PORT`]: config.port.toString(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    state.process = workerProcess;
    state.pid = workerProcess.pid || null;

    // Log stdout
    workerProcess.stdout?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[${config.label}] ${message}`);
        if (
          message.includes('Uvicorn running') ||
          message.includes('Application startup complete')
        ) {
          state.isReady = true;
        }
      }
    });

    // Log stderr
    workerProcess.stderr?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        if (message.includes('INFO') || message.includes('Uvicorn running')) {
          console.log(`[${config.label}] ${message}`);
          if (
            message.includes('Uvicorn running') ||
            message.includes('Application startup complete')
          ) {
            state.isReady = true;
          }
        } else if (!message.includes('WARNING')) {
          console.error(`[${config.label} Error] ${message}`);
        }
      }
    });

    // Handle process exit
    workerProcess.on('exit', (code, signal) => {
      console.log(`[${config.label}] Process exited with code ${code}, signal ${signal}`);
      state.process = null;
      state.pid = null;
      state.isReady = false;
      state.isStarting = false;
      state.loadedAt = null;
      if (code !== 0 && code !== null) {
        state.error = `Worker exited with code ${code}`;
      }
    });

    workerProcess.on('error', (err) => {
      console.error(`[${config.label}] Process error:`, err);
      state.error = err.message;
      state.isStarting = false;
      state.isReady = false;
    });

    return waitForWorkerReady(workerId);
  } catch (err) {
    state.isStarting = false;
    state.error = (err as Error).message;
    return { success: false, error: state.error };
  }
}

/**
 * Wait for a worker to become ready
 */
async function waitForWorkerReady(
  workerId: LocalWorkerId,
): Promise<{ success: boolean; error?: string }> {
  const config = WORKER_CONFIGS[workerId];
  const state = workerStates[workerId];
  const startTime = Date.now();

  while (Date.now() - startTime < config.startupTimeout) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (await checkWorkerHealth(workerId)) {
      state.isStarting = false;
      state.startAttempts = 0;
      state.loadedAt = Date.now();
      console.log(`[${config.label}] Worker is ready!`);
      return { success: true };
    }

    // Check if process died
    if (!state.process && !state.isStarting) {
      return { success: false, error: state.error || 'Worker process died during startup' };
    }
  }

  state.isStarting = false;
  return { success: false, error: `${config.label} startup timed out` };
}

/**
 * Stop a worker process
 */
export function stopWorker(workerId: LocalWorkerId): void {
  const config = WORKER_CONFIGS[workerId];
  const state = workerStates[workerId];

  if (state.process) {
    console.log(`[${config.label}] Stopping worker...`);
    state.process.kill('SIGTERM');
    state.process = null;
    state.pid = null;
    state.isReady = false;
    state.loadedAt = null;
  }
}

/**
 * Get status of a specific worker
 */
export function getWorkerStatus(workerId: LocalWorkerId): WorkerStatus {
  const config = WORKER_CONFIGS[workerId];
  const state = workerStates[workerId];

  return {
    id: workerId,
    label: config.label,
    isRunning: state.process !== null || state.isReady,
    isReady: state.isReady,
    isStarting: state.isStarting,
    error: state.error,
    vramEstimate: config.vramEstimate,
    url: getWorkerUrl(workerId),
    loadedAt: state.loadedAt,
  };
}

/**
 * Get status of all workers
 */
export function getAllWorkerStatuses(): WorkerStatus[] {
  return Object.keys(WORKER_CONFIGS).map((id) => getWorkerStatus(id as LocalWorkerId));
}

/**
 * Ensure a worker is ready before making requests
 */
export async function ensureWorkerReady(
  workerId: LocalWorkerId,
): Promise<{ ready: boolean; error?: string }> {
  // Quick health check first
  if (await checkWorkerHealth(workerId)) {
    return { ready: true };
  }

  // Try to start the worker
  const result = await startWorker(workerId);
  return { ready: result.success, error: result.error };
}

/**
 * Stop all workers
 */
export function stopAllWorkers(): void {
  for (const workerId of Object.keys(WORKER_CONFIGS) as LocalWorkerId[]) {
    stopWorker(workerId);
  }
}

/**
 * Get total VRAM usage in MB
 */
export function getAvailableVram(): number {
  const usedMB = Object.keys(workerStates)
    .filter((id) => workerStates[id as LocalWorkerId].isReady)
    .reduce((sum, id) => sum + parseVramToMB(WORKER_CONFIGS[id as LocalWorkerId].vramEstimate), 0);
  return Math.max(0, TOTAL_SYSTEM_VRAM_MB - usedMB);
}

/**
 * Reset a worker's state (for retrying after errors)
 */
export function resetWorkerState(workerId: LocalWorkerId): void {
  stopWorker(workerId);
  workerStates[workerId] = createEmptyState();
}

/**
 * Get total estimated VRAM usage of running workers
 */
export function getActiveVramUsage(): string {
  const running = Object.keys(WORKER_CONFIGS)
    .filter((id) => workerStates[id as LocalWorkerId].isReady)
    .map((id) => WORKER_CONFIGS[id as LocalWorkerId].vramEstimate);

  if (running.length === 0) return '0GB';
  return running.join(' + ');
}

// Global exit handlers to ensure workers are cleaned up (VRAM release)
if (typeof process !== 'undefined') {
  const shutdown = () => {
    console.log('[WorkerManager] System shutdown detected. Cleaning up workers...');
    stopAllWorkers();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('beforeExit', shutdown);
  process.on('exit', shutdown);
}
