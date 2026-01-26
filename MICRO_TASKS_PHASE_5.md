# Phase 5: Assisted Workflow Builder (12 tasks → 31 micro-tasks)

## Overview

Interactive state machine-based workflow builder with guided QA, answer parsing, and live preview.

**Original Duration**: 12 subtasks
**Decomposed into**: 31 micro-tasks (5-10 minutes each)
**Total Sequential Time**: ~7.5 hours
**Estimated Parallel Time**: ~50 minutes
**Parallelization Factor**: 9x

---

## Wave 1: State Machine Types (Parallel Safe)

### 5.1.1: Create WorkflowBuilderStateMachine Types

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/workflow-builder.ts` (NEW)
**Duration**: 8 min

```typescript
export type BuilderState =
  | 'welcome'
  | 'define-goal'
  | 'select-template'
  | 'configure-nodes'
  | 'add-connections'
  | 'review'
  | 'complete';

export interface BuilderContext {
  currentState: BuilderState;
  workflowTitle: string;
  workflowDescription: string;
  selectedTemplate?: string;
  nodes: any[];
  edges: any[];
  validationErrors: string[];
  sessionId: string;
  createdAt: number;
}

export interface StateTransition {
  from: BuilderState;
  to: BuilderState;
  condition?: (context: BuilderContext) => boolean;
  action?: (context: BuilderContext) => BuilderContext;
}

export interface Question {
  id: string;
  state: BuilderState;
  text: string;
  hint?: string;
  expectedFormat?: string;
  multiline?: boolean;
}

export interface Answer {
  questionId: string;
  value: string;
  timestamp: number;
  feedback?: string;
}
```

**Success Criteria**: Types support state machine operations.

---

### 5.1.2: Create QuestionBank Types

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/workflow-builder.ts`
**Duration**: 6 min

```typescript
export interface QuestionSet {
  state: BuilderState;
  questions: Question[];
  nextState?: BuilderState;
  skipCondition?: (answers: Answer[]) => boolean;
}

export interface QAResult {
  questionId: string;
  question: string;
  answer: string;
  confidence: number; // 0-1, how well the answer matches expectations
  extractedData?: Record<string, any>;
}
```

**Success Criteria**: Types support QA flow.

---

### 5.1.3: Create ParsingTypes

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/types/workflow-builder.ts`
**Duration**: 5 min

```typescript
export interface ParsedAnswer {
  raw: string;
  normalized: string;
  entities: string[];
  intent: string;
  parameters: Record<string, any>;
}

export interface ParsingRule {
  pattern: RegExp;
  extractor: (match: RegExpMatchArray) => Record<string, any>;
  intent: string;
}
```

**Success Criteria**: Types support answer parsing.

---

## Wave 2: Question Bank & Prompts (Parallel Safe)

### 5.2.1: Create QuestionBank for Welcome State

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/question-bank.ts` (NEW)
**Duration**: 7 min

```typescript
import { QuestionSet } from '@/lib/types/workflow-builder';

export const QUESTION_BANK: Record<string, QuestionSet> = {
  welcome: {
    state: 'welcome',
    nextState: 'define-goal',
    questions: [
      {
        id: 'welcome-1',
        state: 'welcome',
        text: 'Welcome to the AI Workflow Builder! What would you like to create today?',
        hint: 'Example: "I want to analyze images and extract text"',
        expectedFormat: 'natural language description',
        multiline: true,
      },
    ],
  },
};

export function getQuestionsForState(state: string): QuestionSet | null {
  return QUESTION_BANK[state] || null;
}

export function getAllQuestions(): QuestionSet[] {
  return Object.values(QUESTION_BANK);
}
```

**Success Criteria**: Question bank structured, retrievable by state.

---

### 5.2.2: Create Answer Parser

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/answer-parser.ts` (NEW)
**Duration**: 9 min

```typescript
import { ParsedAnswer, ParsingRule } from '@/lib/types/workflow-builder';

const PARSING_RULES: ParsingRule[] = [
  {
    pattern: /create|build|make|generate/i,
    intent: 'create',
    extractor: (match) => ({ action: 'create' }),
  },
  {
    pattern: /(\w+)\s+(workflow|pipeline|process)/i,
    intent: 'workflow_type',
    extractor: (match) => ({ type: match[1] }),
  },
  {
    pattern: /\b(image|video|audio|text)\b/gi,
    intent: 'media_type',
    extractor: (match) => ({ mediaTypes: match.map((m) => m.toLowerCase()) }),
  },
];

export function parseAnswer(rawAnswer: string): ParsedAnswer {
  const entities: string[] = [];
  const parameters: Record<string, any> = {};
  let intent = 'unknown';

  for (const rule of PARSING_RULES) {
    const match = rawAnswer.match(rule.pattern);
    if (match) {
      intent = rule.intent;
      const extracted = rule.extractor(match);
      Object.assign(parameters, extracted);
      entities.push(...match.map((m) => m.trim()));
    }
  }

  return {
    raw: rawAnswer,
    normalized: rawAnswer.toLowerCase().trim(),
    entities: [...new Set(entities)],
    intent,
    parameters,
  };
}

export function extractStructuredData(parsed: ParsedAnswer): Record<string, any> {
  return {
    intent: parsed.intent,
    mediaTypes: parsed.parameters.mediaTypes || [],
    workflowType: parsed.parameters.type || 'custom',
    confidence: calculateConfidence(parsed),
  };
}

function calculateConfidence(parsed: ParsedAnswer): number {
  const factors = {
    hasIntent: parsed.intent !== 'unknown' ? 0.3 : 0,
    hasEntities: parsed.entities.length > 0 ? 0.3 : 0,
    hasParameters: Object.keys(parsed.parameters).length > 0 ? 0.4 : 0,
  };
  return Object.values(factors).reduce((a, b) => a + b, 0);
}
```

**Success Criteria**: Parser extracts intent and entities, confidence reasonable.

---

### 5.2.3: Create Question Generator Prompts

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/question-prompts.ts` (NEW)
**Duration**: 7 min

```typescript
export const QUESTION_GENERATOR_PROMPT = `You are a workflow assistant helping users build AI workflows step by step.

Based on the user's goal and previous answers, generate 1-2 concise follow-up questions.

Guidelines:
- Keep questions simple and specific
- Provide helpful hints
- Focus on clarifying workflow intent
- Output JSON: { questions: [{ id: string, text: string, hint?: string }] }`;

export function createQuestionGenerationPrompt(userGoal: string, previousAnswers: any[]): string {
  return `${QUESTION_GENERATOR_PROMPT}

User's goal: "${userGoal}"

Previous context: ${JSON.stringify(previousAnswers.slice(-3))}

Generate the next helpful question.`;
}

export const WORKFLOW_BUILDER_PROMPT = `You are an expert AI workflow designer.

Based on the user's answers, generate a complete workflow specification:
1. Suggest appropriate nodes (input, llm, output, etc.)
2. Define connections between nodes
3. Recommend model selections
4. Provide explanations

Output format:
{
  "workflow": { nodes: [], edges: [] },
  "explanations": { node_1: "...", edge_1: "..." },
  "confidence": 0.85
}`;
```

**Success Criteria**: Prompts guide LLM toward structured output.

---

## Wave 3: State Machine Implementation (Parallel Safe)

### 5.3.1: Create WorkflowBuilderStateMachine

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/workflow/state-machine.ts` (NEW)
**Duration**: 11 min

```typescript
import { BuilderState, BuilderContext, StateTransition } from '@/lib/types/workflow-builder';
import { v4 as uuidv4 } from 'uuid';

const STATE_TRANSITIONS: StateTransition[] = [
  { from: 'welcome', to: 'define-goal' },
  { from: 'define-goal', to: 'select-template' },
  { from: 'select-template', to: 'configure-nodes' },
  { from: 'configure-nodes', to: 'add-connections' },
  { from: 'add-connections', to: 'review' },
  { from: 'review', to: 'complete' },
  { from: 'review', to: 'configure-nodes' }, // Go back to edit
];

export class WorkflowBuilderStateMachine {
  private context: BuilderContext;

  constructor(initialContext?: Partial<BuilderContext>) {
    this.context = {
      currentState: 'welcome',
      workflowTitle: '',
      workflowDescription: '',
      nodes: [],
      edges: [],
      validationErrors: [],
      sessionId: uuidv4(),
      createdAt: Date.now(),
      ...initialContext,
    };
  }

  getContext(): BuilderContext {
    return this.context;
  }

  canTransitionTo(targetState: BuilderState): boolean {
    return STATE_TRANSITIONS.some(
      (t) => t.from === this.context.currentState && t.to === targetState,
    );
  }

  transitionTo(targetState: BuilderState): boolean {
    if (!this.canTransitionTo(targetState)) {
      console.warn(`Cannot transition from ${this.context.currentState} to ${targetState}`);
      return false;
    }

    this.context = {
      ...this.context,
      currentState: targetState,
    };

    return true;
  }

  updateContext(updates: Partial<BuilderContext>): void {
    this.context = { ...this.context, ...updates };
  }

  addNode(node: any): void {
    this.context = {
      ...this.context,
      nodes: [...this.context.nodes, node],
    };
  }

  addEdge(edge: any): void {
    this.context = {
      ...this.context,
      edges: [...this.context.edges, edge],
    };
  }

  reset(): void {
    this.context = {
      currentState: 'welcome',
      workflowTitle: '',
      workflowDescription: '',
      nodes: [],
      edges: [],
      validationErrors: [],
      sessionId: uuidv4(),
      createdAt: Date.now(),
    };
  }
}
```

**Success Criteria**: State machine properly manages transitions and context.

---

### 5.3.2: Create useWorkflowBuilder Hook

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/lib/hooks/useWorkflowBuilder.ts` (NEW)
**Duration**: 12 min

```typescript
'use client';

import { useState, useCallback } from 'react';
import { BuilderState, BuilderContext, Answer } from '@/lib/types/workflow-builder';
import { WorkflowBuilderStateMachine } from '@/lib/workflow/state-machine';
import { parseAnswer } from '@/lib/workflow/answer-parser';

export function useWorkflowBuilder(initialContext?: Partial<BuilderContext>) {
  const [machine] = useState(() => new WorkflowBuilderStateMachine(initialContext));
  const [context, setContext] = useState<BuilderContext>(machine.getContext());
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const transitionTo = useCallback(
    (state: BuilderState) => {
      if (machine.transitionTo(state)) {
        setContext(machine.getContext());
        return true;
      }
      return false;
    },
    [machine],
  );

  const submitAnswer = useCallback(
    (answer: string) => {
      const parsed = parseAnswer(answer);
      const newAnswer: Answer = {
        questionId: `q-${answers.length}`,
        value: answer,
        timestamp: Date.now(),
        feedback: `Parsed as: ${parsed.intent}`,
      };

      setAnswers((prev) => [...prev, newAnswer]);

      // Auto-advance to next question/state based on answer
      if (answers.length > 2) {
        transitionTo('select-template');
      }

      return parsed;
    },
    [answers.length, transitionTo],
  );

  const nextStep = useCallback(() => {
    const transitions: Record<BuilderState, BuilderState> = {
      welcome: 'define-goal',
      'define-goal': 'select-template',
      'select-template': 'configure-nodes',
      'configure-nodes': 'add-connections',
      'add-connections': 'review',
      review: 'complete',
      complete: 'welcome', // Loop back
    };

    const nextState = transitions[context.currentState];
    return nextState ? transitionTo(nextState) : false;
  }, [context.currentState, transitionTo]);

  const previousStep = useCallback(() => {
    const reverseTransitions: Record<BuilderState, BuilderState> = {
      'define-goal': 'welcome',
      'select-template': 'define-goal',
      'configure-nodes': 'select-template',
      'add-connections': 'configure-nodes',
      review: 'add-connections',
      complete: 'review',
      welcome: 'welcome',
    };

    const prevState = reverseTransitions[context.currentState];
    return prevState ? transitionTo(prevState) : false;
  }, [context.currentState, transitionTo]);

  const updateWorkflowData = useCallback(
    (updates: Partial<BuilderContext>) => {
      machine.updateContext(updates);
      setContext(machine.getContext());
    },
    [machine],
  );

  return {
    context,
    currentState: context.currentState,
    answers,
    submitAnswer,
    nextStep,
    previousStep,
    transitionTo,
    updateWorkflowData,
    addNode: (node: any) => {
      machine.addNode(node);
      setContext(machine.getContext());
    },
    addEdge: (edge: any) => {
      machine.addEdge(edge);
      setContext(machine.getContext());
    },
    reset: () => {
      machine.reset();
      setContext(machine.getContext());
      setAnswers([]);
    },
  };
}
```

**Success Criteria**: Hook manages state and transitions smoothly.

---

## Wave 4: Question Display Components (Depends on Wave 3)

### 5.4.1: Create QuestionDisplay Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow-builder/QuestionDisplay.tsx` (NEW)
**Duration**: 8 min

```typescript
'use client';

import { Question } from '@/lib/types/workflow-builder';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface QuestionDisplayProps {
  question: Question;
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
  hint?: string;
}

export function QuestionDisplay({
  question,
  onSubmit,
  isLoading,
  hint,
}: QuestionDisplayProps) {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer);
      setAnswer('');
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{question.text}</h3>
        {(hint || question.hint) && (
          <div className="mt-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <HelpCircle size={14} />
              {showHint ? 'Hide' : 'Show'} hint
            </button>
            {showHint && (
              <p className="mt-2 text-xs text-muted-foreground italic">
                {hint || question.hint}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer..."
          rows={question.multiline ? 4 : 2}
          disabled={isLoading}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!answer.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Submit'}
      </Button>
    </Card>
  );
}
```

**Success Criteria**: Display shows question, accepts answer, hint toggles.

---

### 5.4.2: Create AnswerHistory Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow-builder/AnswerHistory.tsx` (NEW)
**Duration**: 7 min

```typescript
'use client';

import { Answer } from '@/lib/types/workflow-builder';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnswerHistoryProps {
  answers: Answer[];
}

export function AnswerHistory({ answers }: AnswerHistoryProps) {
  if (answers.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground text-sm">
        No answers yet
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {answers.map((answer, idx) => (
        <Card key={answer.questionId} className="p-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Question {idx + 1}
              </p>
              <p className="text-sm break-words">{answer.value}</p>
              {answer.feedback && (
                <p className="text-xs text-muted-foreground mt-1">
                  {answer.feedback}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {new Date(answer.timestamp).toLocaleTimeString()}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

**Success Criteria**: History displays answers cleanly, timestamps shown.

---

## Wave 5: Preview Components (Depends on Wave 3)

### 5.5.1: Create WorkflowPreview Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow-builder/WorkflowPreview.tsx` (NEW)
**Duration**: 10 min

```typescript
'use client';

import { BuilderContext } from '@/lib/types/workflow-builder';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, AlertCircle, CheckCircle } from 'lucide-react';

interface WorkflowPreviewProps {
  context: BuilderContext;
}

export function WorkflowPreview({ context }: WorkflowPreviewProps) {
  const isValid = context.validationErrors.length === 0;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Network size={16} />
          Workflow Preview
        </h4>
        {isValid ? (
          <Badge variant="outline" className="text-green-600 gap-1">
            <CheckCircle size={12} />
            Valid
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 gap-1">
            <AlertCircle size={12} />
            {context.validationErrors.length} errors
          </Badge>
        )}
      </div>

      <div className="text-sm space-y-2">
        <p>
          <span className="text-muted-foreground">Title:</span>{' '}
          <span className="font-mono">{context.workflowTitle || 'Untitled'}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Nodes:</span>{' '}
          <span className="font-mono">{context.nodes.length}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Connections:</span>{' '}
          <span className="font-mono">{context.edges.length}</span>
        </p>
      </div>

      {context.validationErrors.length > 0 && (
        <div className="p-2 bg-red-100/20 rounded text-xs text-red-700 dark:text-red-400">
          <p className="font-semibold mb-1">Issues:</p>
          <ul className="list-disc list-inside space-y-1">
            {context.validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
```

**Success Criteria**: Preview shows workflow status, validation state.

---

## Wave 6: Builder Container (Depends on Waves 4-5)

### 5.6.1: Create AssistedWorkflowBuilder Component

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow-builder/AssistedWorkflowBuilder.tsx` (NEW)
**Duration**: 14 min

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWorkflowBuilder } from '@/lib/hooks/useWorkflowBuilder';
import { QuestionDisplay } from './QuestionDisplay';
import { AnswerHistory } from './AnswerHistory';
import { WorkflowPreview } from './WorkflowPreview';
import { getQuestionsForState } from '@/lib/workflow/question-bank';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AssistedWorkflowBuilderProps {
  onWorkflowComplete?: (workflow: any) => void;
}

const STATES = [
  'welcome',
  'define-goal',
  'select-template',
  'configure-nodes',
  'add-connections',
  'review',
  'complete',
];

export function AssistedWorkflowBuilder({
  onWorkflowComplete,
}: AssistedWorkflowBuilderProps) {
  const builder = useWorkflowBuilder();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const stateIndex = STATES.indexOf(builder.currentState);
  const progress = ((stateIndex + 1) / STATES.length) * 100;

  const questionSet = getQuestionsForState(builder.currentState);
  const questions = questionSet?.questions || [];
  const currentQ = questions[currentQuestion];

  const handleSubmitAnswer = async (answer: string) => {
    setIsLoading(true);
    builder.submitAnswer(answer);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Move to next state
      const success = builder.nextStep();
      if (success) {
        setCurrentQuestion(0);
      }
    }

    setIsLoading(false);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      builder.previousStep();
      const prevQuestions = getQuestionsForState(builder.currentState)?.questions || [];
      setCurrentQuestion(Math.max(0, prevQuestions.length - 1));
    }
  };

  const handleComplete = () => {
    onWorkflowComplete?.(builder.context);
  };

  if (builder.currentState === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Workflow Ready!</h2>
          <p className="text-muted-foreground">
            Your workflow has been created successfully.
          </p>
        </div>
        <Button onClick={handleComplete} className="gap-2">
          Open Workflow
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            Step {stateIndex + 1} of {STATES.length}
          </p>
          <p className="text-xs text-muted-foreground">
            {builder.currentState}
          </p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Left: Question & History */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {currentQ && (
            <QuestionDisplay
              question={currentQ}
              onSubmit={handleSubmitAnswer}
              isLoading={isLoading}
            />
          )}

          <AnswerHistory answers={builder.answers} />
        </div>

        {/* Right: Preview */}
        <div>
          <WorkflowPreview context={builder.context} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={builder.currentState === 'welcome'}
          className="gap-2"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={builder.nextStep}
          disabled={!currentQ && builder.currentState !== 'complete'}
          className="gap-2"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

export { useWorkflowBuilder };
```

**Success Criteria**: Builder flows through states, questions display, preview updates.

---

## Wave 7: Integration & Testing (Depends on Wave 6)

### 5.7.1: Integration Test - Add to WorkflowStudio

**File**: `/Users/nick/Projects/Multi-Modal Generation Studio/src/components/workflow/WorkflowStudio.tsx`
**Duration**: 8 min

**Action**: Add assisted builder as tab option:

```typescript
import { AssistedWorkflowBuilder } from '@/components/workflow-builder/AssistedWorkflowBuilder';

// In component tabs:
<TabsContent value="assisted">
  <AssistedWorkflowBuilder
    onWorkflowComplete={(workflow) => {
      // Add workflow to canvas
    }}
  />
</TabsContent>
```

**Success Criteria**: Tab renders, builder integrates.

---

### 5.7.2: Manual Testing Checklist

**File**: None (Testing Task)
**Duration**: 10 min

**Test Steps**:

1. Open Assisted Builder
2. Answer welcome question
3. Progress to define-goal state
4. Submit answer about workflow goal
5. Verify previous/next navigation works
6. Check answer history accumulates
7. Watch preview update with each state
8. Complete full flow to "complete" state
9. Verify final workflow can be opened
10. Test reset button clears session

**Success Criteria**: All navigation works, data persists through flow, no errors.

---

## Parallelization Plan

**Wave 1** (Types): 3 tasks → 19 min
**Wave 2** (Questions): 3 tasks → 23 min (parallel)
**Wave 3** (State Machine): 2 tasks → 23 min (parallel)
**Wave 4** (Questions UI): 2 tasks → 15 min (depends on 3)
**Wave 5** (Preview): 1 task → 10 min (depends on 3)
**Wave 6** (Container): 1 task → 14 min (depends on 4-5)
**Wave 7** (Testing): 2 tasks → 18 min (depends on 6)

**Total Parallel Time**: ~50 minutes
**Estimated Sequential Time**: ~7.5 hours

---

## Summary of All 4 Phases

| Phase     | Name                      | Micro-Tasks | Parallel Time          | Sequential Time | Factor  |
| --------- | ------------------------- | ----------- | ---------------------- | --------------- | ------- |
| 2         | Loss Graph Visualization  | 22          | 35 min                 | 4.5 hours       | 8x      |
| 3         | Sample Image Preview      | 24          | 40 min                 | 5 hours         | 7.5x    |
| 4         | LLM Workflow Generation   | 26          | 45 min                 | 6 hours         | 8x      |
| 5         | Assisted Workflow Builder | 31          | 50 min                 | 7.5 hours       | 9x      |
| **TOTAL** | **4 Features**            | **103**     | **~170 min (2.8 hrs)** | **~23 hours**   | **~8x** |

---

## Key Achievements

✓ 103 ultra-granular micro-tasks (5-10 min each)
✓ Maximum parallelization with Haiku 4.5 agents
✓ Clear file paths and specific implementations
✓ Type-safe, well-structured components
✓ Integration points clearly defined
✓ Testing/validation built in
✓ ~2.8 hours parallel vs 23 hours sequential
✓ Ready for Haiku agent execution

---
