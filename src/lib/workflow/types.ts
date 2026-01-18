import { Node, Edge } from '@xyflow/react';

export type WorkflowNodeType = 'input' | 'llm' | 'output' | 'loop' | 'decision';

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  // Dynamic properties based on type
  prompt?: string;
  modelId?: string;
  systemMessage?: string;
  variableName?: string;
  // Execution state
  status?: 'idle' | 'running' | 'completed' | 'failed';
  output?: any;
  error?: string;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;
