'use client';

import { useCallback, useState } from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LLMNode } from './nodes/LLMNode';
import { ImageNode } from './nodes/ImageNode';
import { Plus, Play, Save, FolderOpen, Brain, ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/lib/workflow/templates';
import { WorkflowEngine } from '@/lib/workflow/engine';
import { useChatStore } from '@/lib/store/chat-store';
import { useIntegrationStore } from '@/lib/integrations/store';

// Custom Node Map
const nodeTypes: NodeTypes = {
  llm: LLMNode as any,
  image: ImageNode as any,
};

export function WorkflowStudio() {
  // Load initial template or empty
  const initialTemplate = WORKFLOW_TEMPLATES[0];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialTemplate.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialTemplate.edges);
  const [isRunning, setIsRunning] = useState(false);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Mock LLM Runner for client-side demo
  // In real app, this calls our API
  const runLLM = async (prompt: string, modelId: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...useIntegrationStore.getState().getApiHeaders(),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          modelId: modelId || 'gpt-4o',
          providerId: modelId.includes('claude') ? 'anthropic' : 'openai', // Simplistic mapping
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      // For workflow, we might want the full text, not just a stream
      // But /api/chat is designed for streaming.
      // We can use a reader to collect the full response.
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let fullText = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // The /api/chat returns data stream format (0:"text", etc)
        // We'll just extract the text parts for simplicity in this MVP
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            const content = line
              .substring(2)
              .replace(/^"/, '')
              .replace(/"$/, '')
              .replace(/\\n/g, '\n');
            fullText += content;
          }
        }
      }
      return fullText;
    } catch (err) {
      console.error('Workflow Node Execution Error:', err);
      throw err;
    }
  };

  const runImage = async (prompt: string, provider: string): Promise<string> => {
    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...useIntegrationStore.getState().getApiHeaders(),
        },
        body: JSON.stringify({
          prompt,
          provider: provider || 'openai',
          numImages: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Image API failed');
      }

      const data = await response.json();

      // If jobId is returned, poll for completion
      if (data.jobId) {
        let status = data.status || 'pending';
        let imageUrl = null;
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds

        while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;

          const statusRes = await fetch(`/api/generate/image/status?jobId=${data.jobId}`, {
            headers: useIntegrationStore.getState().getApiHeaders(),
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            status = statusData.status;
            if (status === 'completed') {
              imageUrl = statusData.result_url;
            } else if (status === 'failed') {
              throw new Error('Generation failed');
            }
          }
        }
        return imageUrl || '';
      }

      return data.images?.[0]?.url || '';
    } catch (err) {
      console.error('Workflow Image execution error:', err);
      throw err;
    }
  };

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    try {
      // Reset statuses and clear previous outputs
      const resetNodes = nodes.map((n) => ({
        ...n,
        data: { ...n.data, status: 'idle', output: undefined },
      }));
      setNodes(resetNodes as any);

      const engine = new WorkflowEngine(resetNodes as any, edges);
      const executionOrder = engine.getExecutionOrder();

      for (const nodeId of executionOrder) {
        // Update node to running
        setNodes((nds) =>
          nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n)),
        );

        try {
          const result = await engine.runNode(nodeId, runLLM, runImage);
          // Update node to completed with output
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, status: 'completed', output: result } }
                : n,
            ),
          );
        } catch (err) {
          console.error(`Node ${nodeId} failed:`, err);
          setNodes((nds) =>
            nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: 'failed' } } : n)),
          );
          break; // Stop on error
        }
      }
    } catch (error) {
      console.error('Workflow execution failed', error);
    } finally {
      setIsRunning(false);
    }
  };

  const loadTemplate = (template: WorkflowTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
  };

  const onAddNode = (type: 'llm' | 'image') => {
    const newNode = {
      id: uuidv4(),
      type,
      position: { x: 100, y: 100 },
      data: {
        label: `New ${type.toUpperCase()} Node`,
        prompt: '',
        modelId: type === 'llm' ? 'gpt-4o' : undefined,
        provider: type === 'image' ? 'openai' : undefined,
      },
    };
    setNodes((nds) => nds.concat(newNode as any));
  };

  return (
    <ErrorBoundary name="Workflow Studio">
      <div className="flex h-full w-full flex-col">
        {/* Toolbar */}
        <div className="bg-background/50 flex h-14 items-center justify-between border-b px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="mr-4 font-bold">Workflow Studio</span>
            {WORKFLOW_TEMPLATES.map((t) => (
              <Button
                key={t.id}
                variant="ghost"
                size="sm"
                onClick={() => loadTemplate(t)}
                className="text-xs"
              >
                {t.name}
              </Button>
            ))}
            <div className="bg-border mx-2 h-6 w-px" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                  <Plus size={14} /> Add Node
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="bg-background/80 w-48 border-white/10 backdrop-blur-xl"
              >
                <DropdownMenuItem onClick={() => onAddNode('llm')} className="gap-2">
                  <Brain size={14} className="text-primary" /> LLM Processor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddNode('image')} className="gap-2">
                  <ImageIcon size={14} className="text-purple-500" /> Image Generator
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleRunWorkflow}
              disabled={isRunning}
              className="gap-2"
            >
              <Play size={14} /> {isRunning ? 'Running...' : 'Run Workflow'}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-secondary/20 min-h-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </ErrorBoundary>
  );
}
