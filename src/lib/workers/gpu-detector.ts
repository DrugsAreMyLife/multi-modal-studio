import { execFileSync } from 'child_process';

/**
 * GPU Detection Module
 *
 * Detects available GPU hardware and capabilities for workstation nodes.
 * Supports NVIDIA CUDA (RTX 4090/5090), Apple Metal, and CPU-only fallback.
 */

export type GpuType = 'cuda' | 'metal' | 'cpu';

export interface GpuInfo {
  type: GpuType;
  name: string;
  vramMB: number;
  vramUsedMB: number;
  cudaVersion?: string;
  driverVersion?: string;
  computeCapability?: string;
  isAvailable: boolean;
}

export interface SystemGpuInfo {
  gpus: GpuInfo[];
  totalVramMB: number;
  availableVramMB: number;
  primaryGpu: GpuInfo | null;
  hasCuda: boolean;
  hasMetal: boolean;
}

// Cache GPU info to avoid repeated system calls
let cachedGpuInfo: SystemGpuInfo | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Safe execution helper using execFileSync (no shell injection risk)
 */
function safeExec(command: string, args: string[], timeout = 5000): string | null {
  try {
    return execFileSync(command, args, {
      encoding: 'utf-8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

/**
 * Detect NVIDIA GPUs using nvidia-smi
 * Supports RTX 4090, RTX 5090, and other CUDA-capable GPUs
 */
function detectNvidiaGpus(): GpuInfo[] {
  const gpus: GpuInfo[] = [];

  // Query nvidia-smi for GPU info in CSV format
  const result = safeExec('nvidia-smi', [
    '--query-gpu=name,memory.total,memory.used,driver_version,compute_cap',
    '--format=csv,noheader,nounits',
  ]);

  if (!result) return gpus;

  const lines = result.trim().split('\n');
  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length >= 5) {
      const gpuName = parts[0];
      const vramMB = parseInt(parts[1], 10);
      const vramUsedMB = parseInt(parts[2], 10);
      const driverVersion = parts[3];
      const computeCapability = parts[4];

      // Determine CUDA version from driver version
      let cudaVersion = '12.4'; // Default for modern drivers
      const driverNum = parseFloat(driverVersion);
      if (driverNum >= 560)
        cudaVersion = '12.6'; // RTX 5090 drivers
      else if (driverNum >= 550) cudaVersion = '12.4';
      else if (driverNum >= 535) cudaVersion = '12.2';
      else if (driverNum >= 525) cudaVersion = '12.0';
      else if (driverNum >= 515) cudaVersion = '11.7';

      gpus.push({
        type: 'cuda',
        name: gpuName,
        vramMB,
        vramUsedMB,
        driverVersion,
        computeCapability,
        cudaVersion,
        isAvailable: true,
      });

      console.log(
        `[GPU] Detected: ${gpuName} (${vramMB}MB VRAM, CUDA ${cudaVersion}, Compute ${computeCapability})`,
      );
    }
  }

  return gpus;
}

/**
 * Detect Apple Metal GPUs (M1/M2/M3/M4 chips)
 */
function detectMetalGpus(): GpuInfo[] {
  const gpus: GpuInfo[] = [];

  if (process.platform !== 'darwin') return gpus;

  // Use sysctl to get chip info
  const chipResult = safeExec('sysctl', ['-n', 'machdep.cpu.brand_string']);
  const memResult = safeExec('sysctl', ['-n', 'hw.memsize']);

  if (!memResult) return gpus;

  const totalBytes = parseInt(memResult.trim(), 10);
  // Apple Silicon typically allocates ~75% of RAM for GPU max
  const gpuVramMB = Math.floor((totalBytes / (1024 * 1024)) * 0.75);

  const chipName = chipResult?.trim() || 'Apple Silicon GPU';
  const isAppleSilicon =
    chipName.includes('Apple') ||
    chipName.includes('M1') ||
    chipName.includes('M2') ||
    chipName.includes('M3') ||
    chipName.includes('M4');

  if (isAppleSilicon || process.arch === 'arm64') {
    gpus.push({
      type: 'metal',
      name: chipName,
      vramMB: gpuVramMB,
      vramUsedMB: 0, // Metal doesn't expose this easily
      isAvailable: true,
    });

    console.log(`[GPU] Detected: ${chipName} (${gpuVramMB}MB unified memory, Metal)`);
  }

  return gpus;
}

/**
 * Get system GPU information
 */
export function getSystemGpuInfo(forceRefresh = false): SystemGpuInfo {
  const now = Date.now();

  // Return cached if valid
  if (!forceRefresh && cachedGpuInfo && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedGpuInfo;
  }

  const gpus: GpuInfo[] = [];

  // 1. Check for NVIDIA GPUs first (preferred for ML)
  const nvidiaGpus = detectNvidiaGpus();
  gpus.push(...nvidiaGpus);

  // 2. Check for Apple Metal GPUs
  const metalGpus = detectMetalGpus();
  gpus.push(...metalGpus);

  // 3. If no GPU found, create CPU fallback
  if (gpus.length === 0) {
    console.log('[GPU] No GPU detected, using CPU fallback');
    gpus.push({
      type: 'cpu',
      name: 'CPU (No GPU detected)',
      vramMB: 0,
      vramUsedMB: 0,
      isAvailable: false,
    });
  }

  const totalVramMB = gpus.reduce((sum, gpu) => sum + gpu.vramMB, 0);
  const availableVramMB = gpus.reduce((sum, gpu) => sum + (gpu.vramMB - gpu.vramUsedMB), 0);
  const hasCuda = gpus.some((gpu) => gpu.type === 'cuda');
  const hasMetal = gpus.some((gpu) => gpu.type === 'metal');

  const info: SystemGpuInfo = {
    gpus,
    totalVramMB,
    availableVramMB,
    primaryGpu: gpus.find((g) => g.isAvailable) || null,
    hasCuda,
    hasMetal,
  };

  // Update cache
  cachedGpuInfo = info;
  cacheTimestamp = now;

  return info;
}

/**
 * Check if CUDA is available
 */
export function isCudaAvailable(): boolean {
  return getSystemGpuInfo().hasCuda;
}

/**
 * Check if Metal is available
 */
export function isMetalAvailable(): boolean {
  return getSystemGpuInfo().hasMetal;
}

/**
 * Get total available VRAM in MB
 */
export function getTotalVramMB(): number {
  return getSystemGpuInfo().totalVramMB;
}

/**
 * Get currently available (free) VRAM in MB
 */
export function getAvailableVramMB(): number {
  // Force refresh for current VRAM usage
  return getSystemGpuInfo(true).availableVramMB;
}

/**
 * Get recommended device string for PyTorch
 */
export function getPyTorchDevice(): string {
  const info = getSystemGpuInfo();
  if (info.hasCuda) return 'cuda';
  if (info.hasMetal) return 'mps';
  return 'cpu';
}

/**
 * Check if system can run a model with specified VRAM requirement
 */
export function canRunModel(requiredVramMB: number): {
  canRun: boolean;
  reason?: string;
  device: string;
} {
  const info = getSystemGpuInfo(true);

  if (!info.primaryGpu || !info.primaryGpu.isAvailable) {
    return {
      canRun: false,
      reason: 'No GPU available. Install NVIDIA drivers or use Apple Silicon.',
      device: 'cpu',
    };
  }

  if (info.availableVramMB < requiredVramMB) {
    return {
      canRun: false,
      reason: `Insufficient VRAM. Required: ${requiredVramMB}MB, Available: ${info.availableVramMB}MB`,
      device: getPyTorchDevice(),
    };
  }

  return {
    canRun: true,
    device: getPyTorchDevice(),
  };
}

/**
 * Log GPU info for debugging
 */
export function logGpuInfo(): void {
  const info = getSystemGpuInfo(true);
  console.log('[GPU Detection] System GPU Information:');
  console.log(`  Total VRAM: ${info.totalVramMB}MB`);
  console.log(`  Available VRAM: ${info.availableVramMB}MB`);
  console.log(`  CUDA Available: ${info.hasCuda}`);
  console.log(`  Metal Available: ${info.hasMetal}`);
  console.log(`  PyTorch Device: ${getPyTorchDevice()}`);

  for (const gpu of info.gpus) {
    console.log(`  GPU: ${gpu.name}`);
    console.log(`    Type: ${gpu.type}`);
    console.log(`    VRAM: ${gpu.vramMB}MB (${gpu.vramUsedMB}MB used)`);
    if (gpu.cudaVersion) console.log(`    CUDA: ${gpu.cudaVersion}`);
    if (gpu.driverVersion) console.log(`    Driver: ${gpu.driverVersion}`);
  }
}
