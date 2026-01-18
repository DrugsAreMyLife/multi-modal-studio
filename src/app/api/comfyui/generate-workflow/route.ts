import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validateWorkflow, sanitizeWorkflow } from '@/lib/comfyui/validator';
import type { ComfyUIWorkflow } from '@/lib/comfyui/types';
import type { ComfyUIWorkflow as ValidatorWorkflow } from '@/lib/comfyui/validator';

export const maxDuration = 30;

/**
 * Message type for conversation history
 */
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Request body for workflow generation
 */
interface GenerateWorkflowRequest {
  prompt: string;
  mode: 'autonomous' | 'assisted';
  conversation?: Message[];
}

/**
 * Response for autonomous mode
 */
interface AutonomousResponse {
  success: true;
  workflow: ComfyUIWorkflow;
  confidence: number;
  explanation: string;
  template_used: string;
}

/**
 * Response for assisted mode
 */
interface AssistedResponse {
  success: true;
  question: string;
  partial_workflow?: ComfyUIWorkflow;
  progress: number;
  state: string;
}

/**
 * Error response
 */
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
}

type WorkflowGenerationResponse = AutonomousResponse | AssistedResponse | ErrorResponse;

/**
 * Validates the request body
 */
function validateRequest(
  body: unknown,
): { valid: true; data: GenerateWorkflowRequest } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const req = body as Record<string, unknown>;

  // Validate prompt
  if (!req.prompt || typeof req.prompt !== 'string') {
    return {
      valid: false,
      error: 'Missing or invalid required field: prompt (must be a non-empty string)',
    };
  }

  if (req.prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (req.prompt.length > 2000) {
    return {
      valid: false,
      error: `Prompt exceeds maximum length of 2000 characters (received ${req.prompt.length})`,
    };
  }

  // Validate mode
  if (!req.mode || typeof req.mode !== 'string') {
    return {
      valid: false,
      error: 'Missing or invalid required field: mode (must be "autonomous" or "assisted")',
    };
  }

  if (req.mode !== 'autonomous' && req.mode !== 'assisted') {
    return {
      valid: false,
      error: `Invalid mode: "${req.mode}". Must be either "autonomous" or "assisted"`,
    };
  }

  // Validate conversation (optional, for assisted mode)
  let conversation: Message[] | undefined;
  if (req.conversation !== undefined) {
    if (!Array.isArray(req.conversation)) {
      return { valid: false, error: 'Field conversation must be an array' };
    }

    conversation = req.conversation.map((msg: unknown, idx: number) => {
      if (typeof msg !== 'object' || msg === null) {
        throw new Error(`Conversation message at index ${idx} must be an object`);
      }

      const m = msg as Record<string, unknown>;

      if (
        !m.role ||
        typeof m.role !== 'string' ||
        !['user', 'assistant', 'system'].includes(m.role)
      ) {
        throw new Error(
          `Conversation message at index ${idx}: invalid role. Must be "user", "assistant", or "system"`,
        );
      }

      if (!m.content || typeof m.content !== 'string') {
        throw new Error(`Conversation message at index ${idx}: content must be a non-empty string`);
      }

      return {
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      };
    });
  }

  return {
    valid: true,
    data: {
      prompt: req.prompt,
      mode: req.mode as 'autonomous' | 'assisted',
      conversation,
    },
  };
}

/**
 * Generates a workflow from a prompt using autonomous mode
 * This is a stub implementation that will be connected to the LLM
 */
async function generateWorkflowAutonomous(prompt: string): Promise<AutonomousResponse> {
  // TODO: Implement LLM-based workflow generation
  // For now, return a placeholder response
  // In production, this would:
  // 1. Call an LLM (Claude, GPT-4, etc.)
  // 2. Parse the LLM response into a workflow
  // 3. Validate the workflow
  // 4. Return confidence score and explanation

  const placeholderWorkflow: ComfyUIWorkflow = {
    '1': {
      class_type: 'LoadCheckpoint',
      inputs: {
        ckpt_name: 'sd_xl_base_1.0.safetensors',
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['1', 1],
        text: prompt,
      },
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['1', 1],
        text: 'low quality, blurry',
      },
    },
    '4': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['5', 0],
        seed: 42,
        steps: 20,
        cfg: 7.0,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
      },
    },
    '5': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: 'sd_xl_base_1.0.safetensors',
      },
    },
  };

  return {
    success: true,
    workflow: placeholderWorkflow,
    confidence: 0.75,
    explanation: 'Generated a text-to-image workflow based on your prompt using SDXL model',
    template_used: 'text_to_image_v1',
  };
}

/**
 * Generates a workflow from a prompt using assisted mode
 * This maintains conversation state and asks clarifying questions
 */
async function generateWorkflowAssisted(
  prompt: string,
  conversation?: Message[],
): Promise<AssistedResponse> {
  // TODO: Implement LLM-based assisted workflow generation
  // For now, return a placeholder response
  // In production, this would:
  // 1. Analyze the conversation history
  // 2. Determine what clarifying questions are needed
  // 3. Build a partial workflow based on user input
  // 4. Return progress and next question

  // Determine progress based on conversation length
  const conversationLength = conversation?.length ?? 0;
  const maxTurns = 5;
  const progress = Math.min(100, (conversationLength / maxTurns) * 100);

  const state =
    conversationLength === 0
      ? 'initial'
      : conversationLength < 4
        ? 'gathering_details'
        : 'finalizing';

  // Generate a contextual question
  let question = 'What style or aesthetic would you like for the output?';
  if (conversationLength > 0) {
    question = 'What aspect ratio would you prefer for the final output?';
  }
  if (conversationLength > 2) {
    question = 'Are there any specific details or elements you want to emphasize?';
  }

  return {
    success: true,
    question,
    progress,
    state,
  };
}

/**
 * POST /api/comfyui/generate-workflow
 * Generates a ComfyUI workflow from a natural language prompt
 */
export async function POST(req: NextRequest): Promise<NextResponse<WorkflowGenerationResponse>> {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/comfyui/generate-workflow',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: authResult.response.statusText,
      },
      { status: 401 },
    );
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: validation.error as string,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 },
      );
    }

    const { prompt, mode, conversation } = validation.data;

    // Generate workflow based on mode
    let response: AutonomousResponse | AssistedResponse;

    if (mode === 'autonomous') {
      response = await generateWorkflowAutonomous(prompt);

      // Validate the generated workflow
      const workflowValidation = validateWorkflow(response.workflow);
      if (!workflowValidation.valid) {
        console.error('Generated workflow validation failed:', workflowValidation.errors);
        return NextResponse.json(
          {
            success: false,
            error: 'Workflow generation failed',
            message:
              'Generated workflow failed validation. Please try again with a different prompt.',
            code: 'WORKFLOW_VALIDATION_ERROR',
          },
          { status: 500 },
        );
      }

      // Sanitize the workflow for safety
      response.workflow = sanitizeWorkflow(response.workflow) as ComfyUIWorkflow;
    } else {
      // Assisted mode
      response = await generateWorkflowAssisted(prompt, conversation);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Workflow generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Workflow generation failed',
        message: `Failed to generate workflow: ${errorMessage}`,
        code: 'GENERATION_ERROR',
      },
      { status: 500 },
    );
  }
}
