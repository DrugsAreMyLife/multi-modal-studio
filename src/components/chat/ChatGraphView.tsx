'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { UIMessage } from 'ai';
import { getLayoutedElements } from '@/lib/graph-layout';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface ChatGraphViewProps {
  messages: UIMessage[];
  activeMessageId?: string;
  onNodeClick?: (messageId: string) => void;
}

const MessageNode = ({ data }: { data: { label: UIMessage } }) => {
  const msg = data.label;
  const isUser = msg.role === 'user';
  const content = msg.parts.find((p) => p.type === 'text')?.text || 'No content';

  return (
    <Card
      className={cn(
        'bg-background border-border w-[240px] p-3 text-xs shadow-sm',
        isUser ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-emerald-500',
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="mb-1 flex items-center gap-2 opacity-70">
        {isUser ? <User size={12} /> : <Bot size={12} />}
        <span className="text-[10px] font-semibold uppercase">{msg.role}</span>
      </div>
      <div className="text-foreground/80 line-clamp-2 font-mono">{content}</div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </Card>
  );
};

const nodeTypes = {
  messageNode: MessageNode,
};

export function ChatGraphView({ messages, onNodeClick }: ChatGraphViewProps) {
  // Generate layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => getLayoutedElements(messages),
    [messages],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="border-border h-full w-full overflow-hidden rounded-lg border bg-slate-50 dark:bg-slate-900/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        fitView
        className="bg-grid-slate-500/[0.05]"
      >
        <Background color="#94a3b8" gap={16} size={1} className="opacity-10" />
        <Controls showInteractive={false} className="bg-background border-border" />
      </ReactFlow>
    </div>
  );
}
