import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowNodeData } from '@/lib/workflow/types';

export const LLMNode = memo(({ data, selected }: NodeProps<any>) => {
    const status = data.status || 'idle';

    return (
        <Card className={cn(
            "w-[300px] shadow-lg border-2 transition-all",
            selected ? "border-primary ring-2 ring-primary/20" : "border-border",
            status === 'running' && "border-blue-500",
            status === 'completed' && "border-green-500",
            status === 'failed' && "border-red-500"
        )}>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary border-2 border-background !-left-2" />

            <CardHeader className="p-3 bg-muted/40 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-full bg-primary/10 text-primary")}>
                        <Brain size={16} />
                    </div>
                    <div className="font-semibold text-sm">LLM Processor</div>
                </div>
                {status !== 'idle' && (
                    <div className="text-xs font-mono lowercase flex items-center gap-1">
                        {status === 'running' && <span className="animate-spin"><Play size={10} /></span>}
                        {status === 'completed' && <CheckCircle2 size={12} className="text-green-500" />}
                        {status === 'failed' && <AlertCircle size={12} className="text-red-500" />}
                        {status}
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-3 text-xs space-y-2">
                {data.label && <div className="font-medium text-sm">{data.label}</div>}

                <div className="bg-muted/50 p-2 rounded border text-muted-foreground line-clamp-3 font-mono">
                    {data.prompt || "No prompt configured"}
                </div>

                {data.modelId && (
                    <Badge variant="outline" className="text-[10px] h-5">{data.modelId}</Badge>
                )}
            </CardContent>

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary border-2 border-background !-right-2" />
        </Card>
    );
});
