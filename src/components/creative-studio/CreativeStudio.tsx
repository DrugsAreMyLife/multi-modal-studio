/**
 * CreativeStudio.tsx
 * @orchestration-role "Adobe Command Intel"
 * A dedicated workspace for Photoshop/Illustrator features via verbal commands.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Image as ImageIcon,
  Type,
  Layers,
  Mic,
  Command,
  ShieldCheck,
  Activity,
  Box,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { useJobProgress } from '@/hooks/useJobProgress';
import { Progress } from '@/components/ui/progress';

export default function CreativeStudio() {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const job = useJobProgress(activeJobId);

  const handleExecute = async () => {
    if (!command) return;
    setIsProcessing(true);
    setActiveJobId(null);

    try {
      // Call the API endpoint instead of importing server-only code
      const response = await fetch('/api/creative/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute command');
      }

      const result = await response.json();

      if (result.jobId) {
        setActiveJobId(result.jobId);
        toast.info(`Task queued: ${result.operation}`, {
          description: 'Connecting to industrial worker stack...',
        });
      } else {
        setHistory([result, ...history]);
        toast.success(`Executed ${result.operation} via Adobe Command Intel`);
      }
      setCommand('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to handle job completion
  useEffect(() => {
    if (job.status === 'completed' && job.result) {
      setHistory((prev) => [
        {
          operation: 'refinement_complete',
          timestamp: Date.now(),
          status: 'success',
          ...(job.result as any),
        },
        ...prev,
      ]);
      setActiveJobId(null);
      toast.success('Creative refinement complete');
    } else if (job.status === 'failed') {
      toast.error('Creative operation failed', {
        description: job.error,
      });
      setActiveJobId(null);
    }
  }, [job.status, job.result, job.error]);

  return (
    <div className="flex h-full w-full flex-col space-y-8 bg-[#050505] p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tighter italic">
            <Command className="text-primary" size={32} />
            CREATIVE STUDIO
            <Badge
              variant="outline"
              className="border-primary/20 text-primary bg-primary/5 ml-2 font-mono text-[10px] uppercase"
            >
              Adobe Intel v1.0
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            High-level Photoshop & Illustrator operations via verbal creative intent.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="gap-2 border-white/5 bg-white/5 text-xs">
            <Layers size={14} /> Layer Stack
          </Button>
          <Button
            variant="outline"
            className="text-primary gap-2 border-white/5 bg-white/5 text-xs"
          >
            <ShieldCheck size={14} /> Industrial Guard
          </Button>
        </div>
      </header>

      <div className="flex h-full min-h-0 gap-8">
        {/* Main Interaction Area */}
        <Card className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-white/5 bg-black/40 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,184,212,0.05)_0%,transparent_70%)]" />

          <div className="z-10 w-full max-w-2xl space-y-8">
            <div className="space-y-2 text-center">
              <Sparkles className="text-primary mx-auto animate-pulse" size={48} />
              <h2 className="text-2xl font-bold">What is your creative intent?</h2>
              <p className="text-sm opacity-40">
                "Harmonize lighting," "remove background," or "standardize vector paths"
              </p>
            </div>

            <div className="group relative">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter verbal or written command..."
                className="focus:ring-primary/20 h-16 rounded-2xl border-white/10 bg-white/5 pr-24 pl-6 text-xl font-medium transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
              />
              <div className="absolute top-1/2 right-3 flex -translate-y-1/2 gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-primary h-10 w-10 border border-white/5 bg-black/40"
                >
                  <Mic size={20} />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 drop-shadow-lg"
                  onClick={handleExecute}
                  disabled={isProcessing}
                >
                  <Sparkles size={20} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: ImageIcon, label: 'Raster FX', color: 'text-blue-400' },
                { icon: Type, label: 'Vector Path', color: 'text-orange-400' },
                { icon: Box, label: 'Retopo', color: 'text-emerald-400' },
                { icon: FileCode, label: 'SVG Bake', color: 'text-purple-400' },
              ].map((tool, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className="hover:border-primary/20 flex h-24 flex-col gap-2 border border-white/5 bg-white/5 hover:bg-white/10"
                >
                  <tool.icon className={tool.color} size={24} />
                  <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                    {tool.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Audit & Manifest Area */}
        <div className="flex w-96 flex-col gap-6">
          <Card className="space-y-4 border-white/5 bg-black/60 p-6">
            <div className="text-primary flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
              <Activity size={14} /> Operation History
            </div>
            <div className="space-y-3">
              {activeJobId && (
                <div className="bg-primary/5 border-primary/20 animate-pulse rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-primary text-[10px] font-black uppercase">
                      Active Worker Job
                    </span>
                    <span className="font-mono text-[10px]">{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-1" />
                  <p className="mt-2 text-[9px] italic opacity-40">
                    {job.message || 'Initializing...'}
                  </p>
                </div>
              )}

              {history.length === 0 && !activeJobId ? (
                <div className="py-8 text-center text-xs italic opacity-20">
                  No active operations
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/5 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase">{h.operation}</span>
                      <Badge className="h-4 border-none bg-emerald-500/10 text-[8px] text-emerald-500">
                        SUCCESS
                      </Badge>
                    </div>
                    <p className="text-[9px] opacity-40">
                      {h.artifactUrl ? 'Asset refined & synced.' : 'Ready for AssetNexus sync.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="flex-1 border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={16} />
              <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase">
                Adobe Intel Hub
              </span>
            </div>
            <p className="mb-4 text-[11px] leading-relaxed opacity-80">
              Adobe Command Intel translates high-level creative intent into industrial-grade
              assets. Uses SAM-v3 for ultra-nuanced masking and Firefly nodes for lighting
              harmonization.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px]">
                <span className="uppercase opacity-40">Raster Engine:</span>
                <span className="font-mono text-emerald-500">NVIDIA_SAM-V3</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="uppercase opacity-40">Vector Engine:</span>
                <span className="font-mono text-emerald-500">QWEN-GEO-V2</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
