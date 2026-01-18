import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ImageNode = memo(({ data, selected }: NodeProps<any>) => {
  const status = data.status || 'idle';
  const resultUrl = data.output;

  return (
    <Card
      className={cn(
        'w-[250px] border-2 shadow-lg transition-all',
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
          <div className={cn('rounded-full bg-purple-500/10 p-1.5 text-purple-500')}>
            <ImageIcon size={16} />
          </div>
          <div className="text-sm font-semibold">Image Generator</div>
        </div>
        {status !== 'idle' && (
          <div className="text-muted-foreground flex items-center gap-1 font-mono text-[10px] lowercase">
            {status === 'running' && <Loader2 size={10} className="animate-spin" />}
            {status === 'completed' && <CheckCircle2 size={12} className="text-green-500" />}
            {status === 'failed' && <AlertCircle size={12} className="text-red-500" />}
            {status}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 p-3 text-xs">
        <div className="bg-muted/50 text-muted-foreground line-clamp-2 rounded border p-2 font-mono text-[10px]">
          {data.prompt || 'No prompt configured'}
        </div>

        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded border border-white/5 bg-black/40">
          {resultUrl ? (
            <img src={resultUrl} alt="Generated" className="h-full w-full object-cover" />
          ) : status === 'running' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-primary/40 animate-spin" />
              <span className="text-[10px] opacity-40">Generating...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
              <ImageIcon size={24} />
              <span className="text-[10px]">No image yet</span>
            </div>
          )}
        </div>

        {data.provider && (
          <Badge variant="outline" className="h-4 text-[9px] tracking-wider uppercase">
            {data.provider}
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
