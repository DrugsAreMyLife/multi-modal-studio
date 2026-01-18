/**
 * ComfyUI Type Definitions
 *
 * Core types for ComfyUI workflows, nodes, and connections
 */

/**
 * Represents a reference to another node's output
 * [nodeId, outputSlotIndex]
 */
export type NodeConnection = [string, number];

/**
 * Input value can be a primitive, connection reference, or complex object
 */
export type InputValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | NodeConnection
  | InputValue[]
  | { [key: string]: InputValue };

/**
 * A single node in a ComfyUI workflow
 */
export interface ComfyUINode {
  /** The class/type of the node (e.g., 'KSampler', 'LoadModel') */
  class_type: string;

  /** Input values for the node */
  inputs: Record<string, InputValue>;

  /** Optional: UI position in pixels */
  pos?: [number, number];

  /** Optional: UI size in pixels */
  size?: [number, number];

  /** Optional: User-defined title */
  title?: string;

  /** Other optional properties */
  [key: string]: unknown;
}

/**
 * A complete ComfyUI workflow
 * Maps node IDs (strings) to node definitions
 */
export type ComfyUIWorkflow = Record<string, ComfyUINode>;

/**
 * Common ComfyUI node types with their schemas
 */
export interface NodeTypeSchema {
  /** Required input fields */
  required: string[];

  /** Expected types for inputs */
  types: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;

  /** Optional: Description of the node type */
  description?: string;
}

/**
 * Schema definitions for all known node types
 */
export interface NodeTypeSchemaRegistry {
  [nodeType: string]: NodeTypeSchema;
}

/**
 * Workflow execution request
 */
export interface WorkflowExecutionRequest {
  workflow: ComfyUIWorkflow;
  clientId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Workflow execution response
 */
export interface WorkflowExecutionResponse {
  promptId: string;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  results?: Record<string, unknown>;
  error?: string;
}

/**
 * Workflow validation response
 */
export interface WorkflowValidationResponse {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Node connection metadata
 */
export interface ConnectionMetadata {
  sourceNodeId: string;
  sourceSlotIndex: number;
  targetNodeId: string;
  targetInputKey: string;
}

/**
 * Workflow graph analysis results
 */
export interface WorkflowGraphAnalysis {
  /** Total number of nodes */
  nodeCount: number;

  /** Total number of connections */
  connectionCount: number;

  /** Nodes with no inputs (entry points) */
  entryNodes: string[];

  /** Nodes with no outgoing connections (exit points) */
  exitNodes: string[];

  /** Node IDs involved in cycles, if any */
  cycleNodes?: string[];

  /** All connections in the workflow */
  connections: ConnectionMetadata[];

  /** Node type distribution */
  nodeTypes: Record<string, number>;
}

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  userId: string;
  workflow: ComfyUIWorkflow;
  executionStartTime: number;
  status: 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled';
  results?: Record<string, unknown>;
  error?: Error;
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  status: 'success' | 'failed' | 'skipped';
  outputs?: Record<string, unknown>;
  error?: string;
  executionTime: number;
}

/**
 * Workflow execution event for streaming updates
 */
export interface WorkflowExecutionEvent {
  type: 'progress' | 'node_start' | 'node_complete' | 'complete' | 'error';
  payload: {
    workflowId?: string;
    nodeId?: string;
    progress?: number;
    message?: string;
    error?: string;
  };
}

/**
 * Parameter definition for workflow templates
 */
export interface TemplateParameter {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  default?: unknown;
  min?: number;
  max?: number;
  options?: string[];
  required?: boolean;
}

/**
 * Workflow template for reusable workflows with parameterized values
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: TemplateParameter[];
  workflow: ComfyUIWorkflow | Record<string, unknown>;
  thumbnail?: string;
  version?: string;
  author?: string;
  tags?: string[];
  requirements?: string[];
}

/**
 * Result of template customization
 */
export interface TemplateCustomizationResult {
  success: boolean;
  workflow?: ComfyUIWorkflow;
  error?: string;
  missingParameters?: string[];
}
