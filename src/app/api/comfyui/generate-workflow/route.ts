import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { validateWorkflow, sanitizeWorkflow } from '@/lib/comfyui/validator';
import type { ComfyUIWorkflow } from '@/lib/comfyui/types';
import type { ComfyUIWorkflow as ValidatorWorkflow } from '@/lib/comfyui/validator';
import { generateWorkflowFromPrompt } from '@/lib/comfyui/workflow-generator';
import {
  processMessage,
  initializeConversation,
  generateFinalWorkflow,
  QUESTION_TEMPLATES,
  parseAnswer,
  transitionState,
} from '@/lib/comfyui/conversation-state-machine';
import { selectBestTemplate } from '@/lib/comfyui/template-selector';
import type {
  ConversationMessage,
  ConversationContext,
  QuestionTemplate,
} from '@/lib/comfyui/state-machine-types';

export const maxDuration = 30;

/**
 * Validation constants for input limits
 */
const MAX_CONVERSATION_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 5000;

/**
 * Message type for conversation history
 */
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
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

    // Validate conversation size to prevent DoS attacks
    if (req.conversation.length > MAX_CONVERSATION_MESSAGES) {
      return {
        valid: false,
        error: `Conversation exceeds maximum of ${MAX_CONVERSATION_MESSAGES} messages (received ${req.conversation.length})`,
      };
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

      // Validate message content length
      if (m.content.length > MAX_MESSAGE_LENGTH) {
        throw new Error(
          `Conversation message at index ${idx}: content exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters (received ${m.content.length})`,
        );
      }

      return {
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        metadata: m.metadata as Record<string, any>,
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
 * Uses LLM-based workflow generation with template selection
 */
async function generateWorkflowAutonomous(prompt: string): Promise<AutonomousResponse> {
  // Call the real workflow generator
  const result = await generateWorkflowFromPrompt(prompt, 'autonomous');

  return {
    success: true,
    workflow: result.workflow,
    confidence: result.confidence,
    explanation: result.explanation,
    template_used: result.template_used || 'unknown',
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
  // Convert conversation to the state machine format
  let context: ConversationContext;

  if (!conversation || conversation.length === 0) {
    // Initialize new conversation
    context = initializeConversation();
  } else {
    // Reconstruct context from conversation history
    context = initializeConversation();
    context.messageHistory = conversation.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: Date.now(),
    }));

    // Replay history to rebuild state and parameters
    for (let i = 0; i < conversation.length; i++) {
      const msg = conversation[i];
      if (msg.role === 'user') {
        const assistantMsg = i > 0 ? conversation[i - 1] : null;

        if (assistantMsg && assistantMsg.role === 'assistant') {
          // 1. Try metadata matching (robust)
          const questionId = assistantMsg.metadata?.questionId;
          const question = QUESTION_TEMPLATES.find((q: QuestionTemplate) => q.id === questionId);

          if (question) {
            context = parseAnswer(context, msg.content, question);
          } else {
            // 2. Fallback to text matching (legacy/initial turn)
            const textMatchedQuestion = QUESTION_TEMPLATES.find((q: QuestionTemplate) =>
              assistantMsg.content.includes(q.question),
            );

            if (textMatchedQuestion) {
              context = parseAnswer(context, msg.content, textMatchedQuestion);
            } else if (context.currentState === 'initial') {
              // It's the initial message, process it
              const templateScores = selectBestTemplate(msg.content);
              if (templateScores[0] && templateScores[0].score > 0.5) {
                context.templateId = templateScores[0].templateId;
                context.parameters.template_id = templateScores[0].templateId;
                context.parameters.intent = msg.content;
              }
            }
          }
        } else if (i === 0) {
          // Special case: very first message in conversation
          const templateScores = selectBestTemplate(msg.content);
          if (templateScores[0] && templateScores[0].score > 0.5) {
            context.templateId = templateScores[0].templateId;
            context.parameters.template_id = templateScores[0].templateId;
            context.parameters.intent = msg.content;
          }
        }
        // Advance state after each user message
        context = transitionState(context);
      }
    }
  }

  // Process the user's message
  const result = await processMessage(context, prompt);

  // Check if workflow generation is complete
  if (result.isComplete) {
    const workflowResult = await generateFinalWorkflow(result.context);

    return {
      success: true,
      question: result.assistantMessage,
      partial_workflow: workflowResult.workflow,
      progress: result.context.completionPercentage,
      state: result.context.currentState,
    };
  }

  // Return next question
  return {
    success: true,
    question: result.assistantMessage,
    progress: result.context.completionPercentage,
    state: result.context.currentState,
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
