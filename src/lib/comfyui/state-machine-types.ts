import type { ComfyUIWorkflow } from './types';

// Conversation State Machine Types
export enum ConversationState {
  INITIAL = 'initial',
  INTENT_GATHERING = 'intent_gathering',
  PARAMETER_COLLECTION = 'parameter_collection',
  REFINEMENT = 'refinement',
  COMPLETE = 'complete',
}

export interface StateTransition {
  from: ConversationState;
  to: ConversationState;
  trigger: string;
  guard?: (context: ConversationContext) => boolean;
  action?: (context: ConversationContext) => ConversationContext;
}

export interface ConversationContext {
  currentState: ConversationState;
  templateId?: string;
  parameters: Record<string, unknown>;
  confidence: number;
  messageHistory: ConversationMessage[];
  partialWorkflow?: Partial<ComfyUIWorkflow>;
  completionPercentage: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface QuestionTemplate {
  id: string;
  state: ConversationState;
  question: string;
  parameterTarget: string;
  questionType: 'text' | 'select' | 'slider' | 'boolean';
  options?: string[] | number[];
  validation?: (answer: string) => boolean;
  priority: number; // 1-10, higher = more important
}

export interface StateAction {
  type: 'add_parameter' | 'update_confidence' | 'complete_workflow' | 'request_clarification';
  payload: unknown;
}
