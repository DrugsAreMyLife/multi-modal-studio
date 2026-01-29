'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Workflow,
  Plus,
  Settings2,
  Play,
  Save,
  Share2,
  GitBranch,
  Terminal,
  Cpu,
  Database,
  Search,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Node {
  id: string;
  type: 'prompt' | 'model' | 'sampler' | 'upscaler' | 'output';
  label: string;
  position: { x: number; y: number };
  status: 'idle' | 'running' | 'complete';
}

export function NodeStudio() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      type: 'prompt',
      label: 'Positive Prompt',
      position: { x: 50, y: 50 },
      status: 'complete',
    },
    {
      id: '2',
      type: 'model',
      label: 'Stable Diffusion XL',
      position: { x: 300, y: 150 },
      status: 'complete',
    },
    {
      id: '3',
      type: 'sampler',
      label: 'Euler a / 30 Steps',
      position: { x: 300, y: 50 },
      status: 'idle',
    },
    {
      id: '4',
      type: 'output',
      label: 'Image Output',
      position: { x: 600, y: 100 },
      status: 'idle',
    },
  ]);

  const [isExecuting, setIsExecuting] = useState(false);
  const [promptId, setPromptId] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);

    // Convert visual nodes to ComfyUI workflow format
    const workflow = buildWorkflowFromNodes(nodes);

    try {
      const response = await fetch('/api/comfyui/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute workflow');
      }

      const result = await response.json();
      setPromptId(result.prompt_id);

      // Update node statuses to running
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          status: 'running' as const,
        })),
      );

      toast.success('Pipeline queued', {
        description: `Prompt ID: ${result.prompt_id}`,
      });

      // Poll for completion
      pollWorkflowStatus(result.prompt_id);
    } catch (error) {
      toast.error('Execution failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setIsExecuting(false);
    }
  };

  const pollWorkflowStatus = async (promptId: string) => {
    try {
      const response = await fetch(`/api/comfyui/status?prompt_id=${promptId}`);
      const status = await response.json();

      if (status.status === 'completed') {
        setNodes((prev) =>
          prev.map((node) => ({
            ...node,
            status: 'complete' as const,
          })),
        );
        setIsExecuting(false);
        toast.success('Pipeline complete', {
          description: 'All nodes executed successfully',
        });
      } else if (status.status === 'error') {
        setIsExecuting(false);
        toast.error('Pipeline failed', {
          description: status.error || 'Execution error',
        });
      } else {
        // Still running, poll again
        setTimeout(() => pollWorkflowStatus(promptId), 1000);
      }
    } catch {
      // If status check fails, assume still running
      setTimeout(() => pollWorkflowStatus(promptId), 2000);
    }
  };

  // Convert visual nodes to ComfyUI workflow format
  const buildWorkflowFromNodes = (nodes: Node[]) => {
    const workflow: Record<string, { class_type: string; inputs: Record<string, unknown> }> = {};

    nodes.forEach((node, index) => {
      const classTypeMap: Record<string, string> = {
        prompt: 'CLIPTextEncode',
        model: 'CheckpointLoaderSimple',
        sampler: 'KSampler',
        upscaler: 'UpscaleLatent',
        output: 'SaveImage',
      };

      workflow[node.id] = {
        class_type: classTypeMap[node.type] || 'Unknown',
        inputs: {
          // Basic inputs - real implementation would have proper connections
          text: node.type === 'prompt' ? node.label : undefined,
          ckpt_name: node.type === 'model' ? 'sd_xl_base_1.0.safetensors' : undefined,
        },
      };
    });

    return workflow;
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#050505]">
      <div className="flex items-center justify-between border-b border-white/5 bg-black/40 p-4 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-primary" />
            <h1 className="text-lg font-bold tracking-tight italic">Pro Node Studio</h1>
          </div>
          <Badge
            variant="outline"
            className="h-6 border-white/10 bg-white/5 text-[10px] font-bold text-zinc-500 uppercase"
          >
            v4.2-α Subgraph Engine
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 text-xs opacity-60 hover:opacity-100">
            <Save size={14} /> Save Recipe
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-xs opacity-60 hover:opacity-100">
            <Share2 size={14} /> Deploy API
          </Button>
          <div className="mx-2 h-4 w-px bg-white/10" />
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="shadow-primary/20 gap-2 shadow-lg"
          >
            {isExecuting ? (
              <Zap size={14} className="animate-pulse text-amber-500" />
            ) : (
              <Play size={14} />
            )}
            {isExecuting ? 'Synthesizing...' : 'Execute Pipeline'}
          </Button>
        </div>
      </div>

      <div className="relative flex-1 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:24px_24px]">
        {/* SVG Connections (Static for demo) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <path
            d="M 180 80 Q 240 80, 240 180 L 300 180"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 430 180 Q 515 180, 515 130 L 600 130"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={false}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: node.position.x, top: node.position.y }}
          >
            <Card
              className={cn(
                'flex min-w-[180px] flex-col overflow-hidden border-2 transition-all duration-300',
                node.status === 'complete'
                  ? 'border-emerald-500/20 bg-emerald-500/5 shadow-2xl shadow-emerald-500/5'
                  : 'border-white/5 bg-black/80',
              )}
            >
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-2 px-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      node.status === 'complete'
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                        : 'bg-zinc-500',
                    )}
                  />
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    {node.type}
                  </span>
                </div>
                <Settings2 size={12} className="opacity-40" />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium">{node.label}</p>
              </div>
              <div className="flex justify-between border-t border-white/5 bg-white/[0.02] p-1 px-3">
                <span className="text-[8px] italic opacity-20">in: none</span>
                <span className="text-[8px] italic opacity-20">out: latent</span>
              </div>
            </Card>
          </motion.div>
        ))}

        <div className="absolute bottom-6 left-6 flex gap-3">
          <Card className="flex items-center gap-1 border-white/5 bg-black/60 p-1 backdrop-blur-xl">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus size={16} />
            </Button>
            <div className="h-4 w-px bg-white/10" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <GitBranch size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Database size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Cpu size={16} />
            </Button>
          </Card>

          <Card className="flex items-center gap-2 border-white/5 bg-black/60 p-1 px-3 text-xs backdrop-blur-xl">
            <Search size={14} className="opacity-40" />
            <span className="opacity-40">Library Search...</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
