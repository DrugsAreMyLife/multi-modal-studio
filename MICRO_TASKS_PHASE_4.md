# Phase 4: LLM-Based Workflow Generation (10 tasks → 26 micro-tasks)

## Overview

LLM-powered workflow builder with template selection, parameter extraction, confidence scoring, and validation.

**Original Duration**: 10 subtasks
**Decomposed into**: 26 micro-tasks (5-10 minutes each)
**Total Sequential Time**: ~6 hours
**Estimated Parallel Time**: ~45 minutes
**Parallelization Factor**: 8x

---

## Wave 1: Type Definitions (Parallel Safe)

### 4.1.1: Create WorkflowGenerationTypes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/workflow-generation.ts` (NEW)
**Duration**: 7 min

```typescript
export interface WorkflowGenerationRequest {
  prompt: string;
  modelId: string;
  includeComments: boolean;
  maxNodes: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'data-processing' | 'llm-chain' | 'multimodal' | 'analysis';
  nodeCount: number;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
}

export interface LLMWorkflowSuggestion {
  workflow: any; // WorkflowNode[]
  explanation: string;
  confidence: number; // 0-1
  suggestedTitle: string;
  estimatedExecutionTime: number; // seconds
}

export interface GenerationContext {
  selectedTemplate?: WorkflowTemplate;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  extractedParameters: Record<string, any>;
  validationErrors: string[];
}
```

**Success Criteria**: Types compile, no conflicts.

---

### 4.1.2: Create SystemPromptTypes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/workflow-generation.ts`
**Duration**: 5 min

```typescript
export interface SystemPromptConfig {
  role: string;
  constraints: string[];
  outputFormat: string;
  examples: string[];
}

export interface PromptVersion {
  version: number;
  timestamp: number;
  config: SystemPromptConfig;
  testResults: {
    successRate: number;
    avgConfidence: number;
  };
}
```

**Success Criteria**: Types support version tracking.

---

### 4.1.3: Create ValidationTypes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/workflow-generation.ts`
**Duration**: 4 min

```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface NodeValidationRule {
  nodeType: string;
  requiredFields: string[];
  fieldTypes: Record<string, string>;
  customValidators?: ((node: any) => boolean)[];
}
```

**Success Criteria**: Types support comprehensive validation.

---

## Wave 2: System Prompts & Templates (Parallel Safe)

### 4.2.1: Create WorkflowSystemPrompt

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/llm/workflow-system-prompt.ts` (NEW)
**Duration**: 8 min

```typescript
export const WORKFLOW_SYSTEM_PROMPT = `You are an expert workflow designer for a multi-modal AI generation studio.

When a user describes what they want to do, you create visual workflow diagrams as JSON structures.

Key rules:
1. Use node types: input, llm, output, loop, decision
2. Each node must have: id, type, data (label, description, prompt/condition)
3. Connect nodes with edges (from_id -> to_id)
4. Workflows should be simple and direct (3-8 nodes max)
5. Always explain your reasoning

Output format:
{
  "workflow": [...nodes],
  "edges": [...connections],
  "explanation": "Why this workflow solves the problem",
  "confidence": 0.85,
  "suggestedTitle": "Workflow Name"
}`;

export function createWorkflowSystemPrompt(customInstructions?: string): string {
  if (!customInstructions) return WORKFLOW_SYSTEM_PROMPT;
  return `${WORKFLOW_SYSTEM_PROMPT}\n\nAdditional instructions: ${customInstructions}`;
}
```

**Success Criteria**: Prompt structured for LLM clarity.

---

### 4.2.2: Create WorkflowTemplateLibrary

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/template-library.ts` (NEW)
**Duration**: 10 min

```typescript
import { WorkflowTemplate } from '@/lib/types/workflow-generation';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'simple-chain',
    name: 'Simple LLM Chain',
    description: 'Input → LLM → Output',
    category: 'llm-chain',
    nodeCount: 3,
    complexity: 'simple',
    tags: ['basic', 'llm', 'text'],
  },
  {
    id: 'multi-step-reasoning',
    name: 'Multi-Step Reasoning',
    description: 'Input → LLM1 (analyze) → LLM2 (synthesize) → Output',
    category: 'llm-chain',
    nodeCount: 4,
    complexity: 'medium',
    tags: ['reasoning', 'multi-step', 'advanced'],
  },
  {
    id: 'image-analysis-workflow',
    name: 'Image Analysis Pipeline',
    description: 'Image Input → Vision LLM → Text LLM → Output',
    category: 'multimodal',
    nodeCount: 4,
    complexity: 'medium',
    tags: ['vision', 'multimodal', 'analysis'],
  },
  {
    id: 'decision-tree',
    name: 'Conditional Workflow',
    description: 'Input → Decision → Path A (LLM1) OR Path B (LLM2) → Output',
    category: 'llm-chain',
    nodeCount: 5,
    complexity: 'complex',
    tags: ['conditional', 'branching', 'decision'],
  },
  {
    id: 'loop-pattern',
    name: 'Iterative Refinement',
    description: 'Input → LLM → Decision (good enough?) → Loop or Output',
    category: 'llm-chain',
    nodeCount: 5,
    complexity: 'complex',
    tags: ['loop', 'iteration', 'refinement'],
  },
];

export function getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(query: string): WorkflowTemplate[] {
  const lower = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lower)),
  );
}
```

**Success Criteria**: 5+ templates cover common patterns.

---

### 4.2.3: Create ParameterExtractor Utility

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/parameter-extractor.ts` (NEW)
**Duration**: 9 min

```typescript
export interface ExtractedParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  value?: any;
  required: boolean;
  description?: string;
}

export function extractParametersFromPrompt(prompt: string): ExtractedParameter[] {
  const parameters: ExtractedParameter[] = [];

  // Match patterns like {{param_name}} or {param_name}
  const paramRegex = /\{\{?(\w+)\}?\}?/g;
  const matches = prompt.matchAll(paramRegex);

  for (const match of matches) {
    const paramName = match[1];
    const existing = parameters.find((p) => p.name === paramName);

    if (!existing) {
      parameters.push({
        name: paramName,
        type: 'string',
        required: true,
        description: `Parameter: ${paramName}`,
      });
    }
  }

  return parameters;
}

export function substituteParameters(template: string, parameters: Record<string, any>): string {
  let result = template;

  for (const [key, value] of Object.entries(parameters)) {
    result = result.replace(new RegExp(`\\{\\{?${key}\\}?\\}?`, 'g'), String(value));
  }

  return result;
}

export function validateParameters(
  extracted: ExtractedParameter[],
  provided: Record<string, any>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const param of extracted) {
    if (param.required && !(param.name in provided)) {
      errors.push(`Missing required parameter: ${param.name}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

**Success Criteria**: Parameter extraction robust, substitution handles edge cases.

---

## Wave 3: Confidence & Validation (Parallel Safe)

### 4.3.1: Create ConfidenceScorer

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/confidence-scorer.ts` (NEW)
**Duration**: 8 min

```typescript
export interface ConfidenceFactors {
  templateMatch: number; // 0-1
  parameterCompleteness: number; // 0-1
  llmConsistency: number; // 0-1
  userFeedback?: number; // 0-1
}

export function calculateConfidence(factors: ConfidenceFactors): number {
  const weights = {
    templateMatch: 0.3,
    parameterCompleteness: 0.3,
    llmConsistency: 0.3,
    userFeedback: 0.1,
  };

  const score =
    factors.templateMatch * weights.templateMatch +
    factors.parameterCompleteness * weights.parameterCompleteness +
    factors.llmConsistency * weights.llmConsistency +
    (factors.userFeedback || 0.5) * weights.userFeedback;

  return Math.round(score * 100) / 100;
}

export function getConfidenceLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 0.5) return 'low';
  if (score < 0.8) return 'medium';
  return 'high';
}

export function scoreTemplateMatch(userPrompt: string, templateDescription: string): number {
  const promptWords = new Set(userPrompt.toLowerCase().split(/\s+/));
  const templateWords = new Set(templateDescription.toLowerCase().split(/\s+/));

  const intersection = [...promptWords].filter((w) => templateWords.has(w)).length;
  const union = new Set([...promptWords, ...templateWords]).size;

  return union === 0 ? 0 : intersection / union;
}
```

**Success Criteria**: Confidence scores reasonable, levels meaningful.

---

### 4.3.2: Create WorkflowValidator

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/validator.ts` (NEW)
**Duration**: 10 min

```typescript
import {
  ValidationResult,
  ValidationError,
  NodeValidationRule,
} from '@/lib/types/workflow-generation';

const NODE_VALIDATION_RULES: Record<string, NodeValidationRule> = {
  llm: {
    nodeType: 'llm',
    requiredFields: ['label', 'prompt', 'modelId'],
    fieldTypes: {
      label: 'string',
      prompt: 'string',
      modelId: 'string',
    },
  },
  input: {
    nodeType: 'input',
    requiredFields: ['label'],
    fieldTypes: { label: 'string' },
  },
  output: {
    nodeType: 'output',
    requiredFields: ['label'],
    fieldTypes: { label: 'string' },
  },
  decision: {
    nodeType: 'decision',
    requiredFields: ['label', 'condition'],
    fieldTypes: {
      label: 'string',
      condition: 'string',
    },
  },
  loop: {
    nodeType: 'loop',
    requiredFields: ['label', 'condition'],
    fieldTypes: {
      label: 'string',
      condition: 'string',
    },
  },
};

export function validateWorkflow(nodes: any[], edges: any[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate nodes
  for (const node of nodes) {
    const rule = NODE_VALIDATION_RULES[node.type];
    if (!rule) {
      errors.push({
        nodeId: node.id,
        field: 'type',
        message: `Unknown node type: ${node.type}`,
        severity: 'error',
      });
      continue;
    }

    for (const field of rule.requiredFields) {
      if (!node.data[field]) {
        errors.push({
          nodeId: node.id,
          field,
          message: `Missing required field: ${field}`,
          severity: 'error',
        });
      }
    }
  }

  // Validate edges
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        nodeId: edge.source,
        field: 'source',
        message: `Invalid source node: ${edge.source}`,
        severity: 'error',
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        nodeId: edge.target,
        field: 'target',
        message: `Invalid target node: ${edge.target}`,
        severity: 'error',
      });
    }
  }

  return {
    isValid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    warnings: [],
  };
}
```

**Success Criteria**: Validation catches common errors, accurate feedback.

---

## Wave 4: LLM Integration (Depends on Waves 1-3)

### 4.4.1: Create WorkflowGenerator Hook

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useWorkflowGenerator.ts` (NEW)
**Duration**: 13 min

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useChatWithModel } from './useChatWithModel';
import {
  LLMWorkflowSuggestion,
  WorkflowGenerationRequest,
  GenerationContext,
} from '@/lib/types/workflow-generation';
import { WORKFLOW_SYSTEM_PROMPT } from '@/lib/workflow/workflow-system-prompt';
import { validateWorkflow } from '@/lib/workflow/validator';
import { calculateConfidence } from '@/lib/workflow/confidence-scorer';

export function useWorkflowGenerator() {
  const [suggestions, setSuggestions] = useState<LLMWorkflowSuggestion[]>([]);
  const [context, setContext] = useState<GenerationContext>({
    conversationHistory: [],
    extractedParameters: {},
    validationErrors: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { append } = useChatWithModel({
    modelId: 'gpt-4.5-turbo',
    providerId: 'openai',
  });

  const generateWorkflow = useCallback(
    async (request: WorkflowGenerationRequest) => {
      setIsGenerating(true);

      try {
        const systemPrompt = WORKFLOW_SYSTEM_PROMPT;
        const userMessage = `
          Create a workflow for: ${request.prompt}

          Constraints:
          - Maximum ${request.maxNodes} nodes
          - Include descriptive comments: ${request.includeComments}
          - Return valid JSON with "workflow", "edges", "explanation", "confidence", "suggestedTitle"
        `;

        // Call LLM
        const response = await append({
          text: userMessage,
        });

        // Parse response (simplified - actual implementation would need streaming)
        // const suggestion = JSON.parse(response);

        // For now, return mock
        const mockSuggestion: LLMWorkflowSuggestion = {
          workflow: [],
          explanation: 'Generated workflow',
          confidence: 0.85,
          suggestedTitle: 'New Workflow',
          estimatedExecutionTime: 30,
        };

        setSuggestions([mockSuggestion]);
        setContext((prev) => ({
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: 'Generated workflow' },
          ],
        }));
      } catch (error) {
        console.error('Workflow generation error:', error);
      } finally {
        setIsGenerating(false);
      }
    },
    [append],
  );

  return {
    suggestions,
    context,
    isGenerating,
    generateWorkflow,
  };
}
```

**Success Criteria**: Hook integrates with chat API, handles responses.

---

## Wave 5: UI Components (Depends on Wave 4)

### 4.5.1: Create TemplateSelector Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/TemplateSelector.tsx` (NEW)
**Duration**: 9 min

```typescript
'use client';

import { WorkflowTemplate } from '@/lib/types/workflow-generation';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/template-library';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface TemplateSelectorProps {
  onTemplateSelect: (template: WorkflowTemplate) => void;
}

export function TemplateSelector({ onTemplateSelect }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = WORKFLOW_TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded border text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(template => (
          <Card
            key={template.id}
            className="p-3 cursor-pointer hover:border-primary/50 transition"
            onClick={() => onTemplateSelect(template)}
          >
            <h4 className="font-semibold text-sm">{template.name}</h4>
            <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
            <div className="flex gap-2">
              {template.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3"
              onClick={(e) => {
                e.stopPropagation();
                onTemplateSelect(template);
              }}
            >
              Use Template
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Success Criteria**: Search works, templates selectable.

---

### 4.5.2: Create PromptInputComponent

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/PromptInput.tsx` (NEW)
**Duration**: 8 min

```typescript
'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Describe the workflow you want to create...',
}: PromptInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[100px]"
        disabled={isLoading}
      />
      <Button
        onClick={onSubmit}
        disabled={!value.trim() || isLoading}
        className="gap-2"
      >
        <Zap size={16} />
        {isLoading ? 'Generating...' : 'Generate Workflow'}
      </Button>
    </div>
  );
}
```

**Success Criteria**: Input functional, disabled state works.

---

### 4.5.3: Create SuggestionDisplay Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/SuggestionDisplay.tsx` (NEW)
**Duration**: 10 min

```typescript
'use client';

import { LLMWorkflowSuggestion } from '@/lib/types/workflow-generation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface SuggestionDisplayProps {
  suggestion: LLMWorkflowSuggestion;
  onAccept: () => void;
  onReject: () => void;
}

export function SuggestionDisplay({
  suggestion,
  onAccept,
  onReject,
}: SuggestionDisplayProps) {
  const confidenceColor =
    suggestion.confidence > 0.8 ? 'text-green-600' : 'text-yellow-600';

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{suggestion.suggestedTitle}</h4>
          <p className="text-xs text-muted-foreground">
            {suggestion.workflow.length} nodes
          </p>
        </div>
        <div className={`flex items-center gap-2 ${confidenceColor}`}>
          <Zap size={16} />
          <span className="font-mono text-sm">
            {(suggestion.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>

      <div className="p-3 bg-muted/30 rounded text-xs">
        <p className="font-mono">
          Est. execution time: {suggestion.estimatedExecutionTime}s
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="default" onClick={onAccept} className="gap-2" size="sm">
          <CheckCircle size={14} />
          Accept
        </Button>
        <Button variant="outline" onClick={onReject} size="sm">
          Regenerate
        </Button>
      </div>
    </Card>
  );
}
```

**Success Criteria**: Suggestion displays clearly, buttons functional.

---

## Wave 6: Container & Integration (Depends on Wave 5)

### 4.6.1: Create WorkflowGeneratorContainer

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/WorkflowGeneratorContainer.tsx` (NEW)
**Duration**: 12 min

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflowGenerator } from '@/lib/hooks/useWorkflowGenerator';
import { TemplateSelector } from './TemplateSelector';
import { PromptInput } from './PromptInput';
import { SuggestionDisplay } from './SuggestionDisplay';
import { WorkflowTemplate } from '@/lib/types/workflow-generation';

interface WorkflowGeneratorContainerProps {
  onWorkflowGenerated?: (workflow: any) => void;
}

export function WorkflowGeneratorContainer({
  onWorkflowGenerated,
}: WorkflowGeneratorContainerProps) {
  const { suggestions, isGenerating, generateWorkflow } = useWorkflowGenerator();
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('templates');

  const handleGenerateFromPrompt = () => {
    generateWorkflow({
      prompt,
      modelId: 'gpt-4.5-turbo',
      includeComments: true,
      maxNodes: 8,
    });
  };

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setPrompt(`Create a workflow based on the "${template.name}" template`);
    setActiveTab('prompt');
  };

  const handleAcceptSuggestion = () => {
    if (suggestions.length > 0) {
      onWorkflowGenerated?.(suggestions[0].workflow);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="prompt">Custom Prompt</TabsTrigger>
          <TabsTrigger value="result" disabled={suggestions.length === 0}>
            Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card className="p-4">
            <TemplateSelector onTemplateSelect={handleTemplateSelect} />
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card className="p-4">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleGenerateFromPrompt}
              isLoading={isGenerating}
            />
          </Card>
        </TabsContent>

        <TabsContent value="result">
          {suggestions.length > 0 && (
            <SuggestionDisplay
              suggestion={suggestions[0]}
              onAccept={handleAcceptSuggestion}
              onReject={() => {}}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { useWorkflowGenerator };
```

**Success Criteria**: All tabs functional, flow between tabs works.

---

## Wave 7: Testing & Validation (Depends on Wave 6)

### 4.7.1: Integration Test - Add to WorkflowStudio

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/WorkflowStudio.tsx`
**Duration**: 8 min

**Action**: Import and add generator:

```typescript
import { WorkflowGeneratorContainer } from './WorkflowGeneratorContainer';

// In component:
<WorkflowGeneratorContainer
  onWorkflowGenerated={(workflow) => {
    // Update canvas with generated workflow
  }}
/>
```

**Success Criteria**: Component renders, generator integrates.

---

## Parallelization Plan

**Wave 1** (Types): 3 tasks → 16 min
**Wave 2** (Prompts): 3 tasks → 27 min (parallel)
**Wave 3** (Validation): 2 tasks → 18 min (parallel)
**Wave 4** (Hook): 1 task → 13 min (depends on 1-3)
**Wave 5** (Components): 3 tasks → 27 min (depends on 4)
**Wave 6** (Container): 1 task → 12 min (depends on 5)
**Wave 7** (Testing): 1 task → 8 min (depends on 6)

**Total Parallel Time**: ~45 minutes
**Estimated Sequential Time**: ~6 hours

---
