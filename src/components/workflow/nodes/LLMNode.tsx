import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const LLMNode = memo(({ data, selected }: NodeProps<any>) => {
  const status = data.status || 'idle';

  return (
    <Card
      className={cn(
        'w-[300px] border-2 shadow-lg transition-all',
        selected ? 'border-primary ring-primary/20 ring-2' : 'border-border',
        status === 'running' && 'border-blue-500',
        status === 'completed' && 'border-green-500',
        status === 'failed' && 'border-red-500',
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="bg-primary border-background !-left-2 h-3 w-3 border-2"
      />

      <CardHeader className="bg-muted/40 flex flex-row items-center justify-between space-y-0 p-3">
        <div className="flex items-center gap-2">
          <div className={cn('bg-primary/10 text-primary rounded-full p-1.5')}>
            <Brain size={16} />
          </div>
          <div className="text-sm font-semibold">LLM Processor</div>
        </div>
        {status !== 'idle' && (
          <div className="flex items-center gap-1 font-mono text-xs lowercase">
            {status === 'running' && (
              <span className="animate-spin">
                <Play size={10} />
              </span>
            )}
            {status === 'completed' && <CheckCircle2 size={12} className="text-green-500" />}
            {status === 'failed' && <AlertCircle size={12} className="text-red-500" />}
            {status}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2 p-3 text-xs">
        {data.label && <div className="text-sm font-medium">{data.label}</div>}

        <div className="bg-muted/30 text-muted-foreground line-clamp-2 rounded border border-dashed p-2 font-mono text-[10px]">
          {data.prompt || 'No prompt configured'}
        </div>

        {data.output && (
          <div className="bg-primary/5 text-primary border-primary/20 line-clamp-4 rounded border p-2 font-mono text-[10px]">
            {data.output}
          </div>
        )}

        {status === 'running' && !data.output && (
          <div className="flex items-center justify-center p-4">
            <Loader2 size={24} className="text-primary/40 animate-spin" />
          </div>
        )}

        {data.modelId && (
          <Badge variant="outline" className="h-5 text-[10px]">
            {data.modelId}
          </Badge>
        )}
      </CardContent>

      <Handle
        type="source"
        position={Position.Right}
        className="bg-primary border-background !-right-2 h-3 w-3 border-2"
      />
    </Card>
  );
});
