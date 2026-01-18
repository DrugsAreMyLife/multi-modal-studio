/**
 * ComfyUI Workflow Validation and Sanitization System
 *
 * Provides comprehensive validation, circular dependency detection,
 * and input sanitization for ComfyUI workflows.
 */

import type { ComfyUINode, ComfyUIWorkflow, InputValue, NodeConnection } from './types';

// Re-export types from types.ts for convenience
export type { ComfyUINode, ComfyUIWorkflow };

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Schema definitions for common ComfyUI node types
 */
const NODE_SCHEMAS: Record<string, { required: string[]; types: Record<string, string> }> = {
  KSampler: {
    required: ['model', 'positive', 'negative', 'latent_image', 'seed', 'steps', 'cfg'],
    types: {
      seed: 'number',
      steps: 'number',
      cfg: 'number',
    },
  },
  CLIPTextEncode: {
    required: ['clip', 'text'],
    types: {
      text: 'string',
    },
  },
  LoadImage: {
    required: ['image'],
    types: {
      image: 'string',
    },
  },
  LoadCheckpoint: {
    required: ['ckpt_name'],
    types: {
      ckpt_name: 'string',
    },
  },
  SaveImage: {
    required: ['images'],
    types: {
      images: 'object',
    },
  },
  VAEDecode: {
    required: ['samples', 'vae'],
    types: {
      samples: 'object',
    },
  },
  VAEEncode: {
    required: ['pixels', 'vae'],
    types: {
      pixels: 'object',
    },
  },
};

/**
 * Dangerous patterns that could indicate injection attacks
 */
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /import\s+/gi,
  /require\s*\(/gi,
];

/**
 * Allowed directories for file paths (relative to ComfyUI working directory)
 */
const ALLOWED_PATH_ROOTS = [
  'models/',
  'input/',
  'output/',
  'temp/',
  'checkpoints/',
  'loras/',
  'vae/',
  'embeddings/',
];

/**
 * Validates that the workflow is a valid object
 */
function validateWorkflowStructure(workflow: unknown): string[] {
  const errors: string[] = [];

  if (workflow === null || workflow === undefined) {
    errors.push('Workflow cannot be null or undefined');
    return errors;
  }

  if (Array.isArray(workflow)) {
    errors.push('Workflow must be an object, not an array');
    return errors;
  }

  if (typeof workflow !== 'object') {
    errors.push(`Workflow must be an object, got ${typeof workflow}`);
    return errors;
  }

  return errors;
}

/**
 * Validates that all nodes have required fields
 */
function validateNodeStructure(workflow: ComfyUIWorkflow): string[] {
  const errors: string[] = [];

  Object.entries(workflow).forEach(([nodeId, node]) => {
    // Check if node is an object
    if (typeof node !== 'object' || node === null) {
      errors.push(`Node '${nodeId}': Must be an object`);
      return;
    }

    // Check for required class_type field
    if (!('class_type' in node)) {
      errors.push(`Node '${nodeId}': Missing required field 'class_type'`);
      return;
    }

    if (typeof node.class_type !== 'string') {
      errors.push(`Node '${nodeId}': Field 'class_type' must be a string`);
      return;
    }

    // Check for required inputs field
    if (!('inputs' in node)) {
      errors.push(`Node '${nodeId}': Missing required field 'inputs'`);
      return;
    }

    if (typeof node.inputs !== 'object' || node.inputs === null) {
      errors.push(`Node '${nodeId}': Field 'inputs' must be an object`);
      return;
    }
  });

  return errors;
}

/**
 * Validates that all node IDs are unique strings
 */
function validateNodeIds(workflow: ComfyUIWorkflow): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  Object.keys(workflow).forEach((nodeId) => {
    if (typeof nodeId !== 'string') {
      errors.push(`Node ID must be a string, got ${typeof nodeId}`);
      return;
    }

    if (nodeId.trim() === '') {
      errors.push('Node ID cannot be empty');
      return;
    }

    if (ids.has(nodeId)) {
      errors.push(`Duplicate node ID: '${nodeId}'`);
      return;
    }

    ids.add(nodeId);
  });

  return errors;
}

/**
 * Validates that all node connections reference existing nodes
 */
function validateConnections(workflow: ComfyUIWorkflow): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(Object.keys(workflow));

  Object.entries(workflow).forEach(([nodeId, node]) => {
    if (!node.inputs || typeof node.inputs !== 'object') {
      return;
    }

    Object.entries(node.inputs).forEach(([inputKey, inputValue]) => {
      // Check for connection tuples: [nodeId, slotIndex]
      if (Array.isArray(inputValue) && inputValue.length === 2) {
        const [refNodeId, slotIndex] = inputValue;

        if (typeof refNodeId !== 'string') {
          errors.push(
            `Node '${nodeId}', input '${inputKey}': Invalid connection - node ID must be a string`,
          );
          return;
        }

        if (!nodeIds.has(refNodeId)) {
          errors.push(
            `Node '${nodeId}', input '${inputKey}': Invalid connection [${JSON.stringify(
              refNodeId,
            )}, ${slotIndex}] - node ${refNodeId} does not exist`,
          );
          return;
        }

        if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex) || slotIndex < 0) {
          errors.push(
            `Node '${nodeId}', input '${inputKey}': Invalid connection - slot index must be a non-negative integer`,
          );
          return;
        }
      }
    });
  });

  return errors;
}

/**
 * Detects circular dependencies in the workflow graph using DFS
 */
export function detectCycles(workflow: ComfyUIWorkflow): string[] {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles: string[] = [];

  function dfs(nodeId: string, path: string[]): void {
    if (!workflow[nodeId]) {
      return;
    }

    if (visiting.has(nodeId)) {
      // Found a cycle
      const cycleStartIndex = path.indexOf(nodeId);
      const cycle = path.slice(cycleStartIndex);
      cycle.push(nodeId);
      cycles.push(`Circular dependency detected: ${cycle.join(' → ')}`);
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    const node = workflow[nodeId];

    if (node.inputs && typeof node.inputs === 'object') {
      Object.values(node.inputs).forEach((inputValue) => {
        // Extract node references from input values
        if (Array.isArray(inputValue) && inputValue.length === 2) {
          const [refNodeId] = inputValue;
          if (typeof refNodeId === 'string') {
            dfs(refNodeId, [...path, nodeId]);
          }
        }
      });
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  // Check all nodes for cycles
  Object.keys(workflow).forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  });

  return cycles;
}

/**
 * Validates node type-specific requirements
 */
function validateNodeSchemas(workflow: ComfyUIWorkflow): string[] {
  const errors: string[] = [];

  Object.entries(workflow).forEach(([nodeId, node]) => {
    const schema = NODE_SCHEMAS[node.class_type];
    if (!schema) {
      // No schema defined for this node type, skip validation
      return;
    }

    // Check required fields
    schema.required.forEach((fieldName) => {
      if (!(fieldName in (node.inputs || {}))) {
        errors.push(
          `Node '${nodeId}' (${node.class_type}): Missing required parameter '${fieldName}'`,
        );
      }
    });

    // Check parameter types
    if (node.inputs && typeof node.inputs === 'object') {
      Object.entries(schema.types).forEach(([fieldName, expectedType]) => {
        const value = node.inputs[fieldName];
        if (value !== undefined && value !== null) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== expectedType) {
            errors.push(
              `Node '${nodeId}' (${node.class_type}): Parameter '${fieldName}' should be ${expectedType}, got ${actualType}`,
            );
          }
        }
      });
    }
  });

  return errors;
}

/**
 * Main validation function
 */
export function validateWorkflow(workflow: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Validate basic structure
  const structureErrors = validateWorkflowStructure(workflow);
  if (structureErrors.length > 0) {
    return {
      valid: false,
      errors: structureErrors,
    };
  }

  const typedWorkflow = workflow as ComfyUIWorkflow;

  // Step 2: Validate node structure
  errors.push(...validateNodeStructure(typedWorkflow));

  // Step 3: Validate node IDs
  errors.push(...validateNodeIds(typedWorkflow));

  // Only continue if no structural errors
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Step 4: Validate connections
  errors.push(...validateConnections(typedWorkflow));

  // Step 5: Detect circular dependencies
  errors.push(...detectCycles(typedWorkflow));

  // Step 6: Validate node schemas
  errors.push(...validateNodeSchemas(typedWorkflow));

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Checks if a string contains dangerous patterns
 */
function hasDangerousPattern(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Checks if a file path is in an allowed directory
 * Currently unused but available for future file path validation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAllowedPath(filePath: string): boolean {
  if (typeof filePath !== 'string') {
    return false;
  }

  // Reject absolute paths
  if (filePath.startsWith('/') || filePath.startsWith('\\')) {
    return false;
  }

  // Reject paths with parent directory traversal
  if (filePath.includes('..')) {
    return false;
  }

  // Check if path starts with an allowed root
  return ALLOWED_PATH_ROOTS.some((root) => filePath.startsWith(root) || !filePath.includes('/'));
}

/**
 * Sanitizes a single value
 */
function sanitizeValue(value: unknown): InputValue {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    // Check for dangerous patterns
    if (hasDangerousPattern(value)) {
      console.warn('Potentially dangerous pattern detected in string value');
      return '';
    }

    // Limit string length to 10000 characters
    if (value.length > 10000) {
      return value.substring(0, 10000);
    }

    return value;
  }

  if (typeof value === 'number') {
    // Clamp numeric values to reasonable ranges
    const MIN_SAFE_NUMBER = -1e8;
    const MAX_SAFE_NUMBER = 1e8;

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(MIN_SAFE_NUMBER, Math.min(MAX_SAFE_NUMBER, value));
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    // For connection tuples [nodeId, slotIndex], return as-is
    if (value.length === 2 && typeof value[0] === 'string' && typeof value[1] === 'number') {
      return [value[0], Math.max(0, Math.floor(value[1]))] as NodeConnection;
    }

    // For other arrays, sanitize each element
    return value.map((item) => sanitizeValue(item)).slice(0, 1000) as InputValue[];
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, InputValue> = {};
    let keyCount = 0;

    for (const [key, val] of Object.entries(value)) {
      // Limit object keys
      if (keyCount >= 1000) {
        break;
      }

      // Sanitize key
      const sanitizedKey = typeof key === 'string' ? key.substring(0, 256) : String(key);

      // Sanitize value
      sanitized[sanitizedKey] = sanitizeValue(val);
      keyCount++;
    }

    return sanitized;
  }

  return null;
}

/**
 * Sanitizes a complete workflow
 */
export function sanitizeWorkflow(workflow: ComfyUIWorkflow): ComfyUIWorkflow {
  const sanitized: ComfyUIWorkflow = {};

  Object.entries(workflow).forEach(([nodeId, node]) => {
    if (typeof node !== 'object' || node === null) {
      return;
    }

    // Sanitize node ID
    const sanitizedNodeId = String(nodeId).substring(0, 256);

    // Create sanitized node
    const sanitizedNode: ComfyUINode = {
      class_type: String(node.class_type || '').substring(0, 256),
      inputs: {},
    };

    // Sanitize inputs
    if (node.inputs && typeof node.inputs === 'object') {
      Object.entries(node.inputs).forEach(([inputKey, inputValue]) => {
        const sanitizedInputKey = String(inputKey).substring(0, 256);
        sanitizedNode.inputs[sanitizedInputKey] = sanitizeValue(inputValue);
      });
    }

    // Copy over other node properties, sanitized
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'class_type' || key === 'inputs') {
        return; // Already handled
      }

      if (key === 'title' || key === 'pos' || key === 'size') {
        // These are safe UI properties, set on the node object directly
        (sanitizedNode as Record<string, unknown>)[key] = value;
      } else {
        // Sanitize other properties
        (sanitizedNode as Record<string, unknown>)[key] = sanitizeValue(value);
      }
    });

    sanitized[sanitizedNodeId] = sanitizedNode;
  });

  return sanitized;
}

/**
 * Validates and sanitizes a workflow in one step
 */
export function validateAndSanitizeWorkflow(workflow: unknown): {
  valid: boolean;
  sanitized?: ComfyUIWorkflow;
  validation: ValidationResult;
} {
  // First validate the workflow
  const validation = validateWorkflow(workflow);

  if (!validation.valid) {
    return {
      valid: false,
      validation,
    };
  }

  // If valid, sanitize it
  const sanitized = sanitizeWorkflow(workflow as ComfyUIWorkflow);

  return {
    valid: true,
    sanitized,
    validation,
  };
}
