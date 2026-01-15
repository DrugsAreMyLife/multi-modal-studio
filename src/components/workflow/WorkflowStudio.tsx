'use client';

import { useCallback, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LLMNode } from './nodes/LLMNode';
import { Play, Save, FolderOpen } from 'lucide-react';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/lib/workflow/templates';
import { WorkflowEngine } from '@/lib/workflow/engine';
import { useChatStore } from '@/lib/store/chat-store'; // To output to chat? Or run in place?

// Custom Node Map
const nodeTypes: NodeTypes = {
    llm: LLMNode as any,
    // We can add simple default nodes for Input/Output or use custom ones
};

export function WorkflowStudio() {
    // Load initial template or empty
    const initialTemplate = WORKFLOW_TEMPLATES[0];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialTemplate.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialTemplate.edges);
    const [isRunning, setIsRunning] = useState(false);

    const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // Mock LLM Runner for client-side demo
    // In real app, this calls our API
    const runLLM = async (prompt: string, modelId: string): Promise<string> => {
        console.log(`Running ${modelId} with prompt: ${prompt.substring(0, 50)}...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
        return `[Output from ${modelId}]: This is a simulated response based on inputs.\nAnalysis of: ${prompt.substring(0, 30)}...`;
    };

    const handleRunWorkflow = async () => {
        setIsRunning(true);
        try {
            // Reset statuses
            const resetNodes = nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle' } }));
            setNodes(resetNodes as any);

            const engine = new WorkflowEngine(resetNodes as any, edges);
            const executionOrder = engine.getExecutionOrder();

            for (const nodeId of executionOrder) {
                // Update node to running
                setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));

                try {
                    await engine.runNode(nodeId, runLLM);
                    // Update node to completed
                    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'completed' } } : n));
                } catch (err) {
                    console.error(err);
                    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'failed' } } : n));
                    break; // Stop on error
                }
            }
        } catch (error) {
            console.error("Workflow failed", error);
        } finally {
            setIsRunning(false);
        }
    };

    const loadTemplate = (template: WorkflowTemplate) => {
        setNodes(template.nodes);
        setEdges(template.edges);
    };

    return (
        <div className="h-full w-full flex flex-col">
            {/* Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-4 bg-background/50 backdrop-blur">
                <div className="flex items-center gap-2">
                    <span className="font-bold mr-4">Workflow Studio</span>
                    {WORKFLOW_TEMPLATES.map(t => (
                        <Button key={t.id} variant="ghost" size="sm" onClick={() => loadTemplate(t)} className="text-xs">
                            {t.name}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="default" size="sm" onClick={handleRunWorkflow} disabled={isRunning} className="gap-2">
                        <Play size={14} /> {isRunning ? 'Running...' : 'Run Workflow'}
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 min-h-0 bg-secondary/20">
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
    );
}
