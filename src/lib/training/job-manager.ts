// Training job manager with Docker orchestration
import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { supabase } from '@/lib/db/server';
import {
  createTrainingJob,
  updateTrainingJob,
  getActiveJobsForUser,
  getTrainingJob,
} from '@/lib/db/training';

const execFileAsync = promisify(execFile);

/**
 * Training job configuration interface
 */
export interface TrainingJobConfig {
  dataset_id: string;
  name?: string;
  type: 'lora' | 'dreambooth';
  base_model: string;
  config: {
    learning_rate?: number;
    batch_size?: number;
    steps?: number;
    resolution?: number;
    lora_rank?: number;
    lora_alpha?: number;
  };
  trigger_words?: string[];
}

/**
 * Training job database record
 */
export interface TrainingJob {
  id: string;
  user_id: string;
  dataset_id: string;
  name: string;
  type: 'lora' | 'dreambooth';
  base_model: string;
  config: Record<string, unknown>;
  trigger_words: string[];
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  container_id?: string;
  error_message?: string;
  progress_percent: number;
  current_step: number;
  total_steps: number;
  loss_history: Array<{ step: number; loss: number }>;
  sample_images: Array<{ step: number; url: string }>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Training configuration for Python script
 */
interface TrainingConfig {
  dataset_path: string;
  base_model: string;
  output_path: string;
  training_params: {
    learning_rate: number;
    batch_size: number;
    steps: number;
    resolution: number;
    lora_rank?: number;
    lora_alpha?: number;
  };
  trigger_words?: string[];
}

/**
 * Dataset record from database
 */
interface Dataset {
  id: string;
  user_id: string;
  name: string;
  type: string;
  image_count: number;
  status: string;
  created_at: string;
}

/**
 * Validate training configuration parameters
 */
function validateTrainingConfig(config: TrainingJobConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate learning rate
  if (config.config.learning_rate !== undefined) {
    const lr = config.config.learning_rate;
    if (lr < 1e-6 || lr > 1e-2) {
      errors.push('learning_rate must be between 1e-6 and 1e-2');
    }
  }

  // Validate batch size
  if (config.config.batch_size !== undefined) {
    const bs = config.config.batch_size;
    if (bs < 1 || bs > 8 || !Number.isInteger(bs)) {
      errors.push('batch_size must be an integer between 1 and 8');
    }
  }

  // Validate steps
  if (config.config.steps !== undefined) {
    const steps = config.config.steps;
    if (steps < 100 || steps > 10000 || !Number.isInteger(steps)) {
      errors.push('steps must be an integer between 100 and 10000');
    }
  }

  // Validate resolution
  if (config.config.resolution !== undefined) {
    const res = config.config.resolution;
    if (res < 256 || res > 1024 || !Number.isInteger(res) || res % 64 !== 0) {
      errors.push('resolution must be a multiple of 64 between 256 and 1024');
    }
  }

  // Validate LoRA rank
  if (config.config.lora_rank !== undefined) {
    const rank = config.config.lora_rank;
    if (rank < 4 || rank > 128 || !Number.isInteger(rank)) {
      errors.push('lora_rank must be an integer between 4 and 128');
    }
  }

  // Validate LoRA alpha
  if (config.config.lora_alpha !== undefined) {
    const alpha = config.config.lora_alpha;
    if (alpha < 1 || alpha > 128 || !Number.isInteger(alpha)) {
      errors.push('lora_alpha must be an integer between 1 and 128');
    }
  }

  // Validate trigger words if provided
  if (config.trigger_words) {
    if (!Array.isArray(config.trigger_words)) {
      errors.push('trigger_words must be an array of strings');
    } else if (config.trigger_words.some((word) => typeof word !== 'string')) {
      errors.push('all trigger_words must be strings');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Hugging Face model ID format
 */
function isValidHuggingFaceModel(modelId: string): boolean {
  // HF models are typically in format "username/model-name" or "organization/model-name"
  const hfModelPattern = /^[\w\-.]+\/[\w\-.]+$/;
  return hfModelPattern.test(modelId);
}

/**
 * Get count of active (running/pending) jobs for a user
 */
async function getActiveJobCountForUser(userId: string): Promise<number> {
  const jobs = await getActiveJobsForUser(userId);
  return jobs.length;
}

/**
 * Create training job record in database
 */
async function createTrainingJobRecord(
  userId: string,
  config: TrainingJobConfig,
  status: 'pending' | 'queued',
): Promise<TrainingJob | null> {
  const job = await createTrainingJob({
    user_id: userId,
    dataset_id: config.dataset_id,
    name: config.name || `Training Job ${new Date().toLocaleDateString()}`,
    type: config.type,
    base_model: config.base_model,
    config: config.config,
    trigger_words: config.trigger_words || [],
    status,
    progress_percent: 0,
    current_step: 0,
    total_steps: 0,
    loss_history: [],
    sample_images: [],
  });

  return job as unknown as TrainingJob | null;
}

/**
 * Update training job status and metadata
 * Note: This is a helper that updates without user context (internal use only)
 */
async function updateTrainingJobStatusInternal(
  jobId: string,
  updates: Partial<TrainingJob>,
): Promise<boolean> {
  const { error } = await supabase
    .from('training_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('[JobManager] Error updating job status:', error);
    return false;
  }

  return true;
}

/**
 * Get dataset by ID
 */
async function getDatasetById(datasetId: string): Promise<Dataset | null> {
  const { data, error } = await supabase.from('datasets').select('*').eq('id', datasetId).single();

  if (error) {
    console.error('[JobManager] Error fetching dataset:', error);
    return null;
  }

  return data as unknown as Dataset;
}

/**
 * Generate training configuration for Python script
 */
function generateTrainingConfig(job: TrainingJob, dataset: Dataset): TrainingConfig {
  const baseDir = path.join(process.cwd(), 'public', 'training');
  const datasetPath = path.join(process.cwd(), 'public', 'datasets', dataset.id);
  const outputPath = path.join(baseDir, 'outputs', job.id);

  return {
    dataset_path: datasetPath,
    base_model: job.base_model,
    output_path: outputPath,
    training_params: {
      learning_rate: ((job.config as Record<string, unknown>).learning_rate as number) || 1e-4,
      batch_size: ((job.config as Record<string, unknown>).batch_size as number) || 1,
      steps: ((job.config as Record<string, unknown>).steps as number) || 1000,
      resolution: ((job.config as Record<string, unknown>).resolution as number) || 512,
      lora_rank: (job.config as Record<string, unknown>).lora_rank as number | undefined,
      lora_alpha: (job.config as Record<string, unknown>).lora_alpha as number | undefined,
    },
    trigger_words: job.trigger_words,
  };
}

/**
 * Spawn Docker container for training job
 */
async function spawnDockerContainer(jobId: string, config: TrainingConfig): Promise<string | null> {
  return new Promise((resolve) => {
    const homeDir = process.env.HOME || '/root';
    const dockerArgs = [
      'run',
      '-d',
      `--name=training-${jobId}`,
      '--gpus',
      'all',
      '-v',
      `${config.dataset_path}:/workspace/datasets:ro`,
      '-v',
      `${config.output_path}:/workspace/outputs:rw`,
      '-v',
      `${path.join(homeDir, '.cache/huggingface')}:/workspace/models:rw`,
      'training-image',
      'python',
      'train_lora.py',
      '--config',
      '/workspace/config.json',
    ];

    const dockerProcess = spawn('docker', dockerArgs);
    let containerId = '';
    let errorOutput = '';

    dockerProcess.stdout.on('data', (data: Buffer) => {
      containerId += data.toString().trim();
    });

    dockerProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    dockerProcess.on('close', (code: number) => {
      if (code === 0 && containerId) {
        console.log(`[JobManager] Docker container spawned successfully: ${containerId}`);
        resolve(containerId);
      } else {
        console.error(`[JobManager] Docker spawn failed with code ${code}: ${errorOutput}`);
        resolve(null);
      }
    });

    dockerProcess.on('error', (err: Error) => {
      console.error('[JobManager] Failed to spawn Docker process:', err);
      resolve(null);
    });
  });
}

/**
 * Write training configuration to file
 */
async function writeTrainingConfigFile(
  jobId: string,
  config: TrainingConfig,
): Promise<string | null> {
  try {
    const baseDir = path.join(process.cwd(), 'public', 'training', 'configs');
    await mkdir(baseDir, { recursive: true });

    const configPath = path.join(baseDir, `${jobId}.json`);
    await writeFile(configPath, JSON.stringify(config, null, 2));

    return configPath;
  } catch (error) {
    console.error('[JobManager] Error writing config file:', error);
    return null;
  }
}

/**
 * Create output directory for training job
 */
async function createOutputDirectory(jobId: string): Promise<string | null> {
  try {
    const outputPath = path.join(process.cwd(), 'public', 'training', 'outputs', jobId);
    await mkdir(outputPath, { recursive: true });
    return outputPath;
  } catch (error) {
    console.error('[JobManager] Error creating output directory:', error);
    return null;
  }
}

/**
 * Main function to submit a training job
 * Returns job ID on success
 */
export async function submitTrainingJob(
  userId: string,
  config: TrainingJobConfig,
): Promise<{
  success: boolean;
  jobId?: string;
  status?: string;
  error?: string;
  statusCode?: number;
}> {
  // Validate configuration parameters
  const validation = validateTrainingConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join('; '),
      statusCode: 400,
    };
  }

  // Validate HuggingFace model ID
  if (!isValidHuggingFaceModel(config.base_model)) {
    return {
      success: false,
      error: 'Invalid base_model format. Expected format: "username/model-name"',
      statusCode: 400,
    };
  }

  // Verify dataset exists and belongs to user
  const dataset = await getDatasetById(config.dataset_id);
  if (!dataset) {
    return {
      success: false,
      error: 'Dataset not found',
      statusCode: 404,
    };
  }

  if (dataset.user_id !== userId) {
    return {
      success: false,
      error: 'Dataset does not belong to the requesting user',
      statusCode: 403,
    };
  }

  // Check active job count
  const activeJobCount = await getActiveJobCountForUser(userId);
  const MAX_CONCURRENT_JOBS = 2;
  const isAtLimit = activeJobCount >= MAX_CONCURRENT_JOBS;

  // Create database record
  const jobStatus = isAtLimit ? 'queued' : 'pending';
  const job = await createTrainingJobRecord(userId, config, jobStatus);

  if (!job) {
    return {
      success: false,
      error: 'Failed to create training job record',
      statusCode: 500,
    };
  }

  // If queued (at limit), return early
  if (isAtLimit) {
    return {
      success: true,
      jobId: job.id,
      status: 'queued',
    };
  }

  // Create output directory
  const outputDir = await createOutputDirectory(job.id);
  if (!outputDir) {
    await updateTrainingJobStatusInternal(job.id, {
      status: 'failed',
      error_message: 'Failed to create output directory',
    });

    return {
      success: false,
      error: 'Failed to create output directory',
      statusCode: 500,
    };
  }

  // Persist output path on the job record for safe cleanup
  await updateTrainingJobStatusInternal(job.id, {
    config: {
      ...(job.config as Record<string, unknown>),
      output_path: outputDir,
    },
  });

  // Generate training configuration
  const trainingConfig = generateTrainingConfig(job, dataset);

  // Write config file
  const configPath = await writeTrainingConfigFile(job.id, trainingConfig);
  if (!configPath) {
    await updateTrainingJobStatusInternal(job.id, {
      status: 'failed',
      error_message: 'Failed to write training configuration file',
    });

    return {
      success: false,
      error: 'Failed to write training configuration',
      statusCode: 500,
    };
  }

  // Spawn Docker container
  const containerId = await spawnDockerContainer(job.id, trainingConfig);
  if (!containerId) {
    await updateTrainingJobStatusInternal(job.id, {
      status: 'failed',
      error_message: 'Failed to spawn Docker container',
    });

    return {
      success: false,
      error: 'Failed to spawn training container',
      statusCode: 500,
    };
  }

  // Update job status to running with container ID
  const now = new Date().toISOString();
  const updated = await updateTrainingJobStatusInternal(job.id, {
    status: 'running',
    container_id: containerId,
    started_at: now,
  });

  if (!updated) {
    console.error('[JobManager] Failed to update job to running status');
    return {
      success: false,
      error: 'Failed to update job status',
      statusCode: 500,
    };
  }

  return {
    success: true,
    jobId: job.id,
    status: 'running',
  };
}

/**
 * Training job status response interface
 */
export interface TrainingJobStatus {
  job_id: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  current_step: number;
  total_steps: number;
  loss_history: Array<{ step: number; loss: number }>;
  sample_images: Array<{ step: number; url: string }>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
}

/**
 * Parse training output from Docker container logs
 * Expects JSON lines with format: {"type":"progress","step":100,"loss":0.245,"percent":10}
 */
function parseTrainingOutput(logs: string): {
  progress_percent: number;
  current_step: number;
  total_steps: number;
  loss_history: Array<{ step: number; loss: number }>;
  sample_images: Array<{ step: number; url: string }>;
  error?: string;
} {
  const result = {
    progress_percent: 0,
    current_step: 0,
    total_steps: 0,
    loss_history: [] as Array<{ step: number; loss: number }>,
    sample_images: [] as Array<{ step: number; url: string }>,
    error: undefined as string | undefined,
  };

  // Parse each line as JSON
  const lines = logs.split('\n').filter((line) => line.trim());
  for (const line of lines) {
    try {
      const event = JSON.parse(line);

      switch (event.type) {
        case 'progress':
          if (typeof event.step === 'number' && typeof event.percent === 'number') {
            result.current_step = event.step;
            result.progress_percent = Math.min(100, Math.max(0, event.percent));
            if (typeof event.total_steps === 'number') {
              result.total_steps = event.total_steps;
            }
            if (typeof event.loss === 'number') {
              result.loss_history.push({ step: event.step, loss: event.loss });
            }
          }
          break;

        case 'sample':
          if (typeof event.step === 'number' && typeof event.image_path === 'string') {
            result.sample_images.push({
              step: event.step,
              url: event.image_path,
            });
          }
          break;

        case 'error':
          if (typeof event.message === 'string') {
            result.error = event.message;
          }
          break;

        case 'complete':
          result.progress_percent = 100;
          break;

        default:
          // Ignore unknown event types
          break;
      }
    } catch {
      // Skip lines that are not valid JSON
      continue;
    }
  }

  return result;
}

/**
 * Get Docker container status
 */
async function getContainerStatus(containerId: string): Promise<'running' | 'exited' | 'error'> {
  try {
    const { stdout } = await execFileAsync('docker', [
      'inspect',
      '-f',
      '{{.State.Status}}',
      containerId,
    ]);
    const status = stdout.trim();
    if (status === 'running') return 'running';
    if (status === 'exited') return 'exited';
    return 'error';
  } catch (error) {
    console.error('[JobManager] Error checking container status:', error);
    return 'error';
  }
}

/**
 * Estimate completion time based on current progress
 */
function estimateCompletion(startTime: Date, currentStep: number, totalSteps: number): Date {
  if (currentStep === 0 || totalSteps === 0) {
    // No progress yet, estimate 1 hour
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  const now = new Date();
  const elapsedSeconds = (now.getTime() - startTime.getTime()) / 1000;
  const stepsPerSecond = currentStep / elapsedSeconds;

  if (stepsPerSecond === 0) {
    return new Date(Date.now() + 60 * 60 * 1000);
  }

  const remainingSteps = totalSteps - currentStep;
  const estimatedSecondsRemaining = remainingSteps / stepsPerSecond;

  return new Date(now.getTime() + estimatedSecondsRemaining * 1000);
}

/**
 * Update training job status from Docker container logs
 */
export async function updateJobStatus(jobId: string): Promise<TrainingJobStatus | null> {
  // Get the job from database
  const { data: jobData, error: jobError } = await supabase
    .from('training_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !jobData) {
    console.error('[JobManager] Error fetching job:', jobError);
    return null;
  }

  const job = jobData as any;

  // If job is not running, return current status
  if (!['pending', 'queued', 'running'].includes(job.status)) {
    return {
      job_id: job.id,
      status: job.status,
      progress_percent: job.progress_percent || 0,
      current_step: job.current_step || 0,
      total_steps: job.total_steps || 0,
      loss_history: job.loss_history || [],
      sample_images: job.sample_images || [],
      error: job.error_message,
      started_at: job.started_at,
      completed_at: job.completed_at,
    };
  }

  // If running, fetch Docker logs
  if (job.status === 'running' && job.container_id) {
    try {
      // Get container status first
      const containerStatus = await getContainerStatus(job.container_id);

      if (containerStatus === 'exited') {
        // Container has stopped - mark job as failed
        console.error('[JobManager] Container exited unexpectedly:', job.container_id);
        await supabase
          .from('training_jobs')
          .update({
            status: 'failed',
            error: 'Container exited unexpectedly',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        return {
          job_id: job.id,
          status: 'failed',
          progress_percent: job.progress_percent || 0,
          current_step: job.current_step || 0,
          total_steps: job.total_steps || 0,
          loss_history: job.loss_history || [],
          sample_images: job.sample_images || [],
          error: 'Container exited unexpectedly',
          started_at: job.started_at,
          completed_at: new Date().toISOString(),
        };
      }

      // Get container logs
      // docker logs training-${jobId} 2>&1 | tail -1000
      // execFile doesn't support pipes directly, so we use spawn or a shell wrapper safely
      const { stdout: logs } = await execFileAsync('docker', ['logs', `training-${jobId}`]);

      // Manually tail the logs if they are too large (simplification for this context)
      const tailLogs = logs.split('\n').slice(-1000).join('\n');

      // Parse the logs
      const parsed = parseTrainingOutput(logs);

      // Update database with parsed data
      const updates: any = {
        progress_percent: parsed.progress_percent,
        current_step: parsed.current_step,
        total_steps: parsed.total_steps,
        loss_history: parsed.loss_history,
        sample_images: parsed.sample_images,
        updated_at: new Date().toISOString(),
      };

      // Check if training is complete (100% progress)
      if (parsed.progress_percent === 100) {
        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();
      }

      // Check for errors
      if (parsed.error) {
        updates.status = 'failed';
        updates.error = parsed.error;
        updates.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('training_jobs')
        .update(updates)
        .eq('id', jobId);

      if (updateError) {
        console.error('[JobManager] Error updating job status:', updateError);
      }

      // Calculate estimated completion
      const estimatedCompletion =
        job.started_at && parsed.total_steps > 0
          ? estimateCompletion(new Date(job.started_at), parsed.current_step, parsed.total_steps)
          : undefined;

      return {
        job_id: job.id,
        status: updates.status || job.status,
        progress_percent: parsed.progress_percent,
        current_step: parsed.current_step,
        total_steps: parsed.total_steps,
        loss_history: parsed.loss_history,
        sample_images: parsed.sample_images,
        error: parsed.error || job.error_message,
        started_at: job.started_at,
        completed_at: updates.completed_at,
        estimated_completion: estimatedCompletion?.toISOString(),
      };
    } catch (error) {
      console.error('[JobManager] Error reading Docker logs:', error);

      // Return last known status if Docker logs fail
      return {
        job_id: job.id,
        status: job.status,
        progress_percent: job.progress_percent || 0,
        current_step: job.current_step || 0,
        total_steps: job.total_steps || 0,
        loss_history: job.loss_history || [],
        sample_images: job.sample_images || [],
        error: job.error_message,
        started_at: job.started_at,
        completed_at: job.completed_at,
      };
    }
  }

  return {
    job_id: job.id,
    status: job.status,
    progress_percent: job.progress_percent || 0,
    current_step: job.current_step || 0,
    total_steps: job.total_steps || 0,
    loss_history: job.loss_history || [],
    sample_images: job.sample_images || [],
    error: job.error_message,
    started_at: job.started_at,
    completed_at: job.completed_at,
  };
}

/**
 * Export helper functions for testing and external use
 */
export {
  validateTrainingConfig,
  isValidHuggingFaceModel,
  getActiveJobCountForUser,
  createTrainingJobRecord,
  updateTrainingJobStatusInternal,
  getDatasetById,
  generateTrainingConfig,
  spawnDockerContainer,
  writeTrainingConfigFile,
  createOutputDirectory,
  parseTrainingOutput,
  getContainerStatus,
  estimateCompletion,
};
