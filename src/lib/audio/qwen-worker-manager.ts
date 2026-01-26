import { spawn, ChildProcess } from 'child_process';
import path from 'path';

interface WorkerState {
  process: ChildProcess | null;
  pid: number | null;
  isStarting: boolean;
  isReady: boolean;
  lastHealthCheck: number | null;
  startAttempts: number;
  error: string | null;
}

const WORKER_PORT = parseInt(process.env.QWEN_TTS_WORKER_PORT || '8003', 10);
const WORKER_URL = process.env.QWEN_TTS_WORKER_URL || `http://localhost:${WORKER_PORT}`;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_START_ATTEMPTS = 3;
const STARTUP_TIMEOUT = 60000; // 60 seconds for model loading

// Singleton state for the worker
let workerState: WorkerState = {
  process: null,
  pid: null,
  isStarting: false,
  isReady: false,
  lastHealthCheck: null,
  startAttempts: 0,
  error: null,
};

/**
 * Check if the Qwen TTS worker is healthy
 */
export async function checkWorkerHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${WORKER_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      workerState.isReady = data.status === 'healthy' && data.models_loaded;
      workerState.lastHealthCheck = Date.now();
      workerState.error = null;
      return workerState.isReady;
    }
    return false;
  } catch {
    workerState.isReady = false;
    return false;
  }
}

/**
 * Start the Qwen TTS Python worker as a background process
 */
export async function startWorker(): Promise<{ success: boolean; error?: string }> {
  // Already running and healthy
  if (await checkWorkerHealth()) {
    return { success: true };
  }

  // Already starting
  if (workerState.isStarting) {
    // Wait for startup to complete
    return waitForWorkerReady();
  }

  // Too many failed attempts
  if (workerState.startAttempts >= MAX_START_ATTEMPTS) {
    return {
      success: false,
      error: `Failed to start worker after ${MAX_START_ATTEMPTS} attempts. ${workerState.error || ''}`,
    };
  }

  workerState.isStarting = true;
  workerState.startAttempts++;

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'qwen-tts-worker.py');

    // Check if Python and required packages are available
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    console.log(`[QwenWorker] Starting worker (attempt ${workerState.startAttempts})...`);
    console.log(`[QwenWorker] Script path: ${scriptPath}`);

    const workerProcess = spawn(pythonCmd, [scriptPath], {
      env: {
        ...process.env,
        QWEN_TTS_PORT: WORKER_PORT.toString(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    workerState.process = workerProcess;
    workerState.pid = workerProcess.pid || null;

    // Log stdout
    workerProcess.stdout?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[QwenWorker] ${message}`);
        // Check for ready signal
        if (
          message.includes('Uvicorn running') ||
          message.includes('Application startup complete')
        ) {
          workerState.isReady = true;
        }
      }
    });

    // Log stderr
    workerProcess.stderr?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        // Filter out normal startup logs that go to stderr
        if (message.includes('INFO') || message.includes('Uvicorn running')) {
          console.log(`[QwenWorker] ${message}`);
          if (
            message.includes('Uvicorn running') ||
            message.includes('Application startup complete')
          ) {
            workerState.isReady = true;
          }
        } else {
          console.error(`[QwenWorker Error] ${message}`);
        }
      }
    });

    // Handle process exit
    workerProcess.on('exit', (code, signal) => {
      console.log(`[QwenWorker] Process exited with code ${code}, signal ${signal}`);
      workerState.process = null;
      workerState.pid = null;
      workerState.isReady = false;
      workerState.isStarting = false;

      if (code !== 0 && code !== null) {
        workerState.error = `Worker exited with code ${code}`;
      }
    });

    workerProcess.on('error', (err) => {
      console.error(`[QwenWorker] Process error:`, err);
      workerState.error = err.message;
      workerState.isStarting = false;
      workerState.isReady = false;
    });

    // Wait for the worker to become ready
    return waitForWorkerReady();
  } catch (err) {
    workerState.isStarting = false;
    workerState.error = (err as Error).message;
    return { success: false, error: workerState.error };
  }
}

/**
 * Wait for the worker to become ready
 */
async function waitForWorkerReady(): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < STARTUP_TIMEOUT) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (await checkWorkerHealth()) {
      workerState.isStarting = false;
      workerState.startAttempts = 0;
      console.log('[QwenWorker] Worker is ready!');
      return { success: true };
    }

    // Check if process died
    if (!workerState.process && !workerState.isStarting) {
      return { success: false, error: workerState.error || 'Worker process died during startup' };
    }
  }

  workerState.isStarting = false;
  return { success: false, error: 'Worker startup timed out' };
}

/**
 * Stop the worker process
 */
export function stopWorker(): void {
  if (workerState.process) {
    console.log('[QwenWorker] Stopping worker...');
    workerState.process.kill('SIGTERM');
    workerState.process = null;
    workerState.pid = null;
    workerState.isReady = false;
  }
}

/**
 * Get the current worker status
 */
export function getWorkerStatus(): {
  isRunning: boolean;
  isReady: boolean;
  isStarting: boolean;
  pid: number | null;
  error: string | null;
  url: string;
} {
  return {
    isRunning: workerState.process !== null,
    isReady: workerState.isReady,
    isStarting: workerState.isStarting,
    pid: workerState.pid,
    error: workerState.error,
    url: WORKER_URL,
  };
}

/**
 * Ensure worker is running and ready before making requests
 * This is the main function API routes should call
 */
export async function ensureWorkerReady(): Promise<{ ready: boolean; error?: string }> {
  // Quick health check first
  if (await checkWorkerHealth()) {
    return { ready: true };
  }

  // Try to start the worker
  const result = await startWorker();
  return { ready: result.success, error: result.error };
}

/**
 * Get the worker URL for making requests
 */
export function getWorkerUrl(): string {
  return WORKER_URL;
}

/**
 * Reset the worker state (for testing or after fatal errors)
 */
export function resetWorkerState(): void {
  stopWorker();
  workerState = {
    process: null,
    pid: null,
    isStarting: false,
    isReady: false,
    lastHealthCheck: null,
    startAttempts: 0,
    error: null,
  };
}
