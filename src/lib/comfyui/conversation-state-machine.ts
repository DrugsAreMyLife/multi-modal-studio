import type {
  ConversationState,
  ConversationContext,
  ConversationMessage,
  QuestionTemplate,
  StateTransition,
  StateAction,
} from './state-machine-types';
import { selectBestTemplate } from './template-selector';
import { extractParameters } from './parameter-extractor';
import { COMFYUI_TEMPLATES } from './templates';
import { generateWorkflowFromPrompt } from './workflow-generator';

/**
 * Question templates for each conversation state
 */
export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // INITIAL state questions
  {
    id: 'intent',
    state: 'initial' as ConversationState,
    question:
      'What would you like to create? (e.g., generate an image, transform a photo, upscale, etc.)',
    parameterTarget: 'intent',
    questionType: 'text',
    priority: 1,
  },

  // INTENT_GATHERING state questions
  {
    id: 'workflow_type',
    state: 'intent_gathering' as ConversationState,
    question: 'Which workflow type best matches your goal?',
    parameterTarget: 'template_id',
    questionType: 'select',
    options: COMFYUI_TEMPLATES.map((t) => t.id),
    priority: 2,
  },

  // PARAMETER_COLLECTION state questions
  {
    id: 'prompt',
    state: 'parameter_collection' as ConversationState,
    question: 'Describe what you want to create (your prompt):',
    parameterTarget: 'prompt',
    questionType: 'text',
    validation: (answer: string) => answer.trim().length > 0,
    priority: 3,
  },
  {
    id: 'dimensions',
    state: 'parameter_collection' as ConversationState,
    question:
      'What dimensions do you need? (portrait, landscape, square, or specific like 512x768)',
    parameterTarget: 'dimensions',
    questionType: 'text',
    priority: 4,
  },
  {
    id: 'quality',
    state: 'parameter_collection' as ConversationState,
    question: 'What quality level do you need?',
    parameterTarget: 'quality',
    questionType: 'select',
    options: ['low', 'medium', 'high', 'ultra'],
    priority: 5,
  },
  {
    id: 'steps',
    state: 'parameter_collection' as ConversationState,
    question: 'How many sampling steps? (20-50 typical, higher = better quality)',
    parameterTarget: 'steps',
    questionType: 'slider',
    options: [20, 25, 30, 35, 40, 45, 50],
    priority: 6,
  },

  // REFINEMENT state questions
  {
    id: 'refinement',
    state: 'refinement' as ConversationState,
    question: 'Any adjustments to the workflow? (or say "looks good" to proceed)',
    parameterTarget: 'refinement',
    questionType: 'text',
    priority: 7,
  },
];

/**
 * State transition rules
 */
const STATE_TRANSITIONS: StateTransition[] = [
  {
    from: 'initial' as ConversationState,
    to: 'intent_gathering' as ConversationState,
    trigger: 'user_provided_intent',
    guard: (ctx) => ctx.messageHistory.length > 0,
  },
  {
    from: 'intent_gathering' as ConversationState,
    to: 'parameter_collection' as ConversationState,
    trigger: 'template_selected',
    guard: (ctx) => !!ctx.templateId,
  },
  {
    from: 'parameter_collection' as ConversationState,
    to: 'refinement' as ConversationState,
    trigger: 'parameters_collected',
    guard: (ctx) => ctx.completionPercentage >= 70,
  },
  {
    from: 'refinement' as ConversationState,
    to: 'complete' as ConversationState,
    trigger: 'user_confirmed',
    guard: (ctx) => ctx.confidence >= 0.7,
  },
  {
    from: 'parameter_collection' as ConversationState,
    to: 'complete' as ConversationState,
    trigger: 'auto_complete',
    guard: (ctx) => ctx.completionPercentage >= 90 && ctx.confidence >= 0.8,
  },
];

/**
 * Initialize a new conversation context
 */
export function initializeConversation(): ConversationContext {
  return {
    currentState: 'initial' as ConversationState,
    parameters: {},
    confidence: 0,
    messageHistory: [],
    completionPercentage: 0,
  };
}

/**
 * Get the next question to ask based on current state
 */
export function getNextQuestion(context: ConversationContext): QuestionTemplate | null {
  // Find questions for current state that haven't been answered
  const unansweredQuestions = QUESTION_TEMPLATES.filter(
    (q) => q.state === context.currentState && !context.parameters[q.parameterTarget],
  ).sort((a, b) => a.priority - b.priority);

  return unansweredQuestions[0] || null;
}

/**
 * Parse user's answer and update context
 */
export function parseAnswer(
  context: ConversationContext,
  userAnswer: string,
  currentQuestion: QuestionTemplate,
): ConversationContext {
  const newContext = { ...context };

  // Add message to history
  newContext.messageHistory = [
    ...context.messageHistory,
    {
      role: 'user',
      content: userAnswer,
      timestamp: Date.now(),
    },
  ];

  // Extract parameter value from answer
  let parameterValue: unknown = userAnswer;

  // Type-specific parsing
  if (currentQuestion.questionType === 'select') {
    const matchedOption = currentQuestion.options?.find((opt) =>
      userAnswer.toLowerCase().includes(String(opt).toLowerCase()),
    );
    parameterValue = matchedOption || userAnswer;
  } else if (currentQuestion.questionType === 'slider') {
    const numberMatch = userAnswer.match(/\d+/);
    parameterValue = numberMatch ? parseInt(numberMatch[0], 10) : currentQuestion.options?.[0];
  } else if (currentQuestion.questionType === 'boolean') {
    parameterValue =
      userAnswer.toLowerCase().includes('yes') ||
      userAnswer.toLowerCase().includes('true') ||
      userAnswer.toLowerCase().includes('sure');
  }

  // Validate if validation function exists
  if (currentQuestion.validation && !currentQuestion.validation(String(parameterValue))) {
    // Add error message
    newContext.messageHistory.push({
      role: 'assistant',
      content: "That doesn't look quite right. Could you try again?",
      timestamp: Date.now(),
    });
    return newContext;
  }

  // Store parameter
  newContext.parameters[currentQuestion.parameterTarget] = parameterValue;

  // Update completion percentage
  const totalRequiredQuestions = QUESTION_TEMPLATES.filter(
    (q) => q.state === 'parameter_collection',
  ).length;
  const answeredQuestions = Object.keys(newContext.parameters).length;
  newContext.completionPercentage = Math.min(
    (answeredQuestions / totalRequiredQuestions) * 100,
    100,
  );

  // Update confidence based on collected parameters
  newContext.confidence = calculateConfidence(newContext);

  return newContext;
}

/**
 * Calculate confidence score based on collected parameters
 */
function calculateConfidence(context: ConversationContext): number {
  const requiredParams = ['intent', 'template_id', 'prompt'];
  const optionalParams = ['dimensions', 'quality', 'steps'];

  let score = 0;

  // Check required parameters (60% weight)
  const requiredCount = requiredParams.filter((p) => context.parameters[p]).length;
  score += (requiredCount / requiredParams.length) * 0.6;

  // Check optional parameters (40% weight)
  const optionalCount = optionalParams.filter((p) => context.parameters[p]).length;
  score += (optionalCount / optionalParams.length) * 0.4;

  return Math.min(score, 1.0);
}

/**
 * Transition to the next state based on current context
 */
export function transitionState(context: ConversationContext): ConversationContext {
  const newContext = { ...context };

  // Find applicable transitions
  const applicableTransitions = STATE_TRANSITIONS.filter(
    (t) => t.from === context.currentState && (!t.guard || t.guard(context)),
  );

  if (applicableTransitions.length > 0) {
    // Take the first applicable transition
    const transition = applicableTransitions[0];
    newContext.currentState = transition.to;

    // Execute transition action if exists
    if (transition.action) {
      return transition.action(newContext);
    }
  }

  return newContext;
}

/**
 * Process user message and advance conversation
 */
export async function processMessage(
  context: ConversationContext,
  userMessage: string,
): Promise<{
  context: ConversationContext;
  assistantMessage: string;
  isComplete: boolean;
}> {
  let newContext = { ...context };

  // Handle special commands
  if (
    userMessage.toLowerCase().includes('start over') ||
    userMessage.toLowerCase().includes('reset')
  ) {
    return {
      context: initializeConversation(),
      assistantMessage: "Sure! Let's start fresh. What would you like to create?",
      isComplete: false,
    };
  }

  // State-specific processing
  switch (newContext.currentState) {
    case 'initial':
      // Record the initial message
      newContext.messageHistory = [
        ...newContext.messageHistory,
        {
          role: 'user',
          content: userMessage,
          timestamp: Date.now(),
        },
      ];

      // Analyze initial intent
      const templateScores = selectBestTemplate(userMessage);
      if (templateScores[0] && templateScores[0].score > 0.5) {
        newContext.templateId = templateScores[0].templateId;
        newContext.parameters.template_id = templateScores[0].templateId;
        newContext.parameters.intent = userMessage;
        newContext = transitionState(newContext);

        const assistantMsg = `Great! I'll help you create a ${templateScores[0].templateId} workflow. Let me ask a few questions to customize it for you.\n\nDescribe what you want to create (your prompt):`;

        // Record assistant response with metadata
        newContext.messageHistory.push({
          role: 'assistant',
          content: assistantMsg,
          timestamp: Date.now(),
          metadata: { questionId: 'prompt' },
        });

        return {
          context: newContext,
          assistantMessage: assistantMsg,
          isComplete: false,
        };
      } else {
        newContext.currentState = 'intent_gathering' as ConversationState;
        const question = getNextQuestion(newContext);
        const assistantMsg = question?.question || 'What would you like to create?';

        // Record assistant response with metadata
        newContext.messageHistory.push({
          role: 'assistant',
          content: assistantMsg,
          timestamp: Date.now(),
          metadata: { questionId: question?.id || 'intent' },
        });

        return {
          context: newContext,
          assistantMessage: assistantMsg,
          isComplete: false,
        };
      }

    case 'intent_gathering':
      // Get current question and parse answer
      const intentQuestion = getNextQuestion(context);
      if (intentQuestion) {
        newContext = parseAnswer(newContext, userMessage, intentQuestion);
        newContext = transitionState(newContext);

        const nextQuestion = getNextQuestion(newContext);
        if (nextQuestion) {
          // Record assistant response with metadata
          newContext.messageHistory.push({
            role: 'assistant',
            content: nextQuestion.question,
            timestamp: Date.now(),
            metadata: { questionId: nextQuestion.id },
          });

          return {
            context: newContext,
            assistantMessage: nextQuestion.question,
            isComplete: false,
          };
        }
      }
      break;

    case 'parameter_collection':
      // Collect parameters
      const paramQuestion = getNextQuestion(context);
      if (paramQuestion) {
        newContext = parseAnswer(newContext, userMessage, paramQuestion);
        newContext = transitionState(newContext);

        // Check if we can auto-complete
        if (newContext.currentState === 'complete') {
          const paramResult = extractParameters(String(newContext.parameters.prompt));
          newContext.partialWorkflow = {
            ...newContext.parameters,
            ...paramResult.parameters,
          } as any; // Cast to bypass strict type check for MVP

          return {
            context: newContext,
            assistantMessage:
              'Perfect! I have all the information I need. Generating your workflow now...',
            isComplete: true,
          };
        }

        const nextParamQuestion = getNextQuestion(newContext);
        if (nextParamQuestion) {
          // Record assistant response with metadata
          newContext.messageHistory.push({
            role: 'assistant',
            content: nextParamQuestion.question,
            timestamp: Date.now(),
            metadata: { questionId: nextParamQuestion.id },
          });

          return {
            context: newContext,
            assistantMessage: nextParamQuestion.question,
            isComplete: false,
          };
        } else {
          // Move to refinement
          newContext.currentState = 'refinement' as ConversationState;
          newContext = transitionState(newContext);

          return {
            context: newContext,
            assistantMessage:
              'Great! I have all the parameters. Would you like to review or adjust anything, or should I generate the workflow?',
            isComplete: false,
          };
        }
      }
      break;

    case 'refinement':
      // Handle refinement or confirmation
      if (
        userMessage.toLowerCase().includes('looks good') ||
        userMessage.toLowerCase().includes('proceed') ||
        userMessage.toLowerCase().includes('generate') ||
        userMessage.toLowerCase().includes('yes')
      ) {
        newContext.currentState = 'complete' as ConversationState;

        return {
          context: newContext,
          assistantMessage: 'Excellent! Generating your workflow now...',
          isComplete: true,
        };
      } else {
        // Parse refinement request
        // TODO: Implement refinement parsing

        return {
          context: newContext,
          assistantMessage:
            "I've made those adjustments. Anything else to change, or should we proceed?",
          isComplete: false,
        };
      }

    case 'complete':
      return {
        context: newContext,
        assistantMessage: 'Workflow generation complete!',
        isComplete: true,
      };
  }

  // Default fallback
  return {
    context: newContext,
    assistantMessage: "I'm not sure I understood that. Could you rephrase?",
    isComplete: false,
  };
}

/**
 * Generate the final workflow from collected context
 */
export async function generateFinalWorkflow(context: ConversationContext) {
  if (!context.parameters.prompt) {
    throw new Error('Missing required parameter: prompt');
  }

  // Use the autonomous workflow generator with collected parameters
  const result = await generateWorkflowFromPrompt(String(context.parameters.prompt));

  return {
    ...result,
    parameters: context.parameters,
    conversationContext: context,
  };
}

/**
 * Get conversation progress summary
 */
export function getProgressSummary(context: ConversationContext): {
  state: string;
  completion: number;
  confidence: number;
  collectedParameters: string[];
  missingParameters: string[];
} {
  const requiredParams = ['intent', 'template_id', 'prompt'];
  const allParams = [...requiredParams, 'dimensions', 'quality', 'steps'];

  const collected = allParams.filter((p) => context.parameters[p]);
  const missing = requiredParams.filter((p) => !context.parameters[p]);

  return {
    state: context.currentState,
    completion: context.completionPercentage,
    confidence: context.confidence,
    collectedParameters: collected,
    missingParameters: missing,
  };
}
