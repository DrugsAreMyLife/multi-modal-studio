// Training job submission API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { submitTrainingJob, TrainingJobConfig } from '@/lib/training/job-manager';

/**
 * Request body interface for training job submission
 */
interface TrainingSubmitRequest {
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
 * Validation helper function
 */
function validateRequestBody(body: unknown): {
  valid: boolean;
  data?: TrainingSubmitRequest;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: ['Request body must be a JSON object'],
    };
  }

  const req = body as Record<string, unknown>;

  // Required fields
  if (!req.dataset_id || typeof req.dataset_id !== 'string') {
    errors.push('dataset_id is required and must be a string');
  }

  if (!req.type || !['lora', 'dreambooth'].includes(req.type as string)) {
    errors.push('type is required and must be either "lora" or "dreambooth"');
  }

  if (!req.base_model || typeof req.base_model !== 'string') {
    errors.push('base_model is required and must be a string');
  }

  // Config object
  if (!req.config || typeof req.config !== 'object') {
    errors.push('config is required and must be an object');
  } else {
    const config = req.config as Record<string, unknown>;

    // Validate individual config fields
    if (config.learning_rate !== undefined && typeof config.learning_rate !== 'number') {
      errors.push('config.learning_rate must be a number');
    }

    if (config.batch_size !== undefined && typeof config.batch_size !== 'number') {
      errors.push('config.batch_size must be a number');
    }

    if (config.steps !== undefined && typeof config.steps !== 'number') {
      errors.push('config.steps must be a number');
    }

    if (config.resolution !== undefined && typeof config.resolution !== 'number') {
      errors.push('config.resolution must be a number');
    }

    if (config.lora_rank !== undefined && typeof config.lora_rank !== 'number') {
      errors.push('config.lora_rank must be a number');
    }

    if (config.lora_alpha !== undefined && typeof config.lora_alpha !== 'number') {
      errors.push('config.lora_alpha must be a number');
    }
  }

  // Optional fields
  if (req.name !== undefined && typeof req.name !== 'string') {
    errors.push('name must be a string');
  }

  if (req.trigger_words !== undefined) {
    if (!Array.isArray(req.trigger_words)) {
      errors.push('trigger_words must be an array of strings');
    } else if (req.trigger_words.some((word: unknown) => typeof word !== 'string')) {
      errors.push('all trigger_words must be strings');
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  // Create a strict whitelist of config keys
  const config = req.config as Record<string, any>;
  const whitelistedConfig: any = {};
  const allowedKeys = [
    'learning_rate',
    'batch_size',
    'steps',
    'resolution',
    'lora_rank',
    'lora_alpha',
  ];

  allowedKeys.forEach((key) => {
    if (config[key] !== undefined) {
      whitelistedConfig[key] = config[key];
    }
  });

  return {
    valid: true,
    data: {
      dataset_id: req.dataset_id as string,
      name: req.name as string | undefined,
      type: req.type as 'lora' | 'dreambooth',
      base_model: req.base_model as string,
      config: whitelistedConfig,
      trigger_words: req.trigger_words as string[] | undefined,
    },
  };
}

/**
 * POST /api/training/submit
 * Submit a new LoRA or DreamBooth training job
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth and rate limiting
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/training/submit',
    RATE_LIMITS.generation,
  );

  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    // Parse request body
    let bodyData: unknown;
    try {
      bodyData = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 },
      );
    }

    // Validate request body
    const validation = validateRequestBody(bodyData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Request validation failed',
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const requestData = validation.data as TrainingSubmitRequest;

    // Submit training job
    const result = await submitTrainingJob(authResult.userId, {
      dataset_id: requestData.dataset_id,
      name: requestData.name,
      type: requestData.type,
      base_model: requestData.base_model,
      config: requestData.config,
      trigger_words: requestData.trigger_words,
    });

    // Handle submission result
    if (!result.success) {
      const statusCode = result.statusCode || 500;
      return NextResponse.json(
        {
          error: result.error,
          message: result.error,
        },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        success: true,
        job_id: result.jobId,
        status: result.status,
        message: `Training job ${result.jobId} ${result.status}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Training Submit] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS /api/training/submit
 * CORS preflight handler
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  );
}
