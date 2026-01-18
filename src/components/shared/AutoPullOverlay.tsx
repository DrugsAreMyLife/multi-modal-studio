'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface AutoPullOverlayProps {
  modelId: string;
  pullString?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function AutoPullOverlay({
  modelId,
  pullString,
  onComplete,
  onCancel,
}: AutoPullOverlayProps) {
  const [status, setStatus] = useState<'idle' | 'pulling' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const startPull = async () => {
    if (!pullString) return;
    setStatus('pulling');
    setProgress(0);
    setStatusText('Initiating download...');

    try {
      const response = await fetch('/api/models/local/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: pullString }),
      });

      if (!response.ok) throw new Error('Failed to connect to local AI server');
      if (!response.body) throw new Error('Dynamic pull failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.status) setStatusText(json.status);
            if (json.total && json.completed) {
              setProgress((json.completed / json.total) * 100);
            }
          } catch (e) {}
        }
      }

      toast.success(`${modelId} is now ready!`);
      onComplete();
    } catch (err) {
      setStatus('error');
      setStatusText(err instanceof Error ? err.message : 'Unknown error');
      toast.error(`Pull failed: ${statusText}`);
    }
  };

  useEffect(() => {
    startPull();
  }, []);

  return (
    <div className="bg-background/80 fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card w-full max-w-md rounded-2xl border p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
            {status === 'pulling' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : status === 'error' ? (
              <AlertTriangle className="text-destructive h-6 w-6" />
            ) : (
              <Download className="h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">Local Model Preparation</h3>
            <p className="text-muted-foreground text-sm">{modelId}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="mb-2 flex justify-between text-xs font-medium">
              <span className="truncate">{statusText || 'Preparing...'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <p className="text-muted-foreground text-xs">
            This model is not currently on your local system. We are pulling it now so you can use
            it. This might take a while depending on your internet speed.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            {status === 'error' && (
              <Button className="flex-1" onClick={startPull}>
                Retry
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
