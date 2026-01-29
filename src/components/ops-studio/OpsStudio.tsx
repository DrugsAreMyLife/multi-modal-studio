'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Calendar,
  Clock,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Youtube,
  Instagram,
  Twitter,
  Zap,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PipelineJob {
  id: string;
  name: string;
  schedule: string;
  platform: 'youtube' | 'instagram' | 'twitter';
  status: 'active' | 'paused' | 'failed';
  lastRun: string;
  nextRun: string;
}

export function OpsStudio() {
  const [jobs, setJobs] = useState<PipelineJob[]>([
    {
      id: '1',
      name: 'Daily Sci-Fi Shorts Generator',
      schedule: '0 9 * * *',
      platform: 'youtube',
      status: 'active',
      lastRun: '2 hours ago',
      nextRun: 'In 22 hours',
    },
    {
      id: '2',
      name: 'Weekly Behind-The-Scenes',
      schedule: '0 12 * * 0',
      platform: 'instagram',
      status: 'paused',
      lastRun: '3 days ago',
      nextRun: 'Next Sunday',
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const toggleJob = (id: string) => {
    setJobs(
      jobs.map((j) =>
        j.id === id ? { ...j, status: j.status === 'active' ? 'paused' : 'active' } : j,
      ),
    );
    toast.success('Pipeline schedule updated.');
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      <TooltipProvider>
        {/* Left Panel: Automation Orchestrator */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold italic">
                <Timer className="text-primary" /> Operations Studio
              </h1>
              <p className="text-muted-foreground text-sm">
                Cron-based pipeline orchestration and autonomous publishing
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="shadow-primary/20 gap-2 shadow-lg">
                <Plus size={14} /> New Pipeline
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 overflow-auto">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="relative overflow-hidden border-white/5 bg-black/40 p-4 transition-all hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        job.platform === 'youtube'
                          ? 'bg-red-500/10 text-red-500'
                          : job.platform === 'instagram'
                            ? 'bg-fuchsia-500/10 text-fuchsia-500'
                            : 'bg-blue-500/10 text-blue-500',
                      )}
                    >
                      {job.platform === 'youtube' ? (
                        <Youtube size={24} />
                      ) : job.platform === 'instagram' ? (
                        <Instagram size={24} />
                      ) : (
                        <Twitter size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">{job.name}</h3>
                      <div className="mt-1 flex items-center gap-3">
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 font-mono text-[10px] opacity-40 hover:opacity-100">
                            <Clock size={10} /> {job.schedule}
                          </TooltipTrigger>
                          <TooltipContent>Standard Cron Expression</TooltipContent>
                        </Tooltip>
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-4 text-[9px]',
                            job.status === 'active'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                              : 'bg-zinc-500/10 text-zinc-500',
                          )}
                        >
                          {job.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden text-right md:block">
                      <p className="text-[10px] font-bold tracking-tighter uppercase opacity-40">
                        Next Execution
                      </p>
                      <p className="text-xs font-medium">{job.nextRun}</p>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => toggleJob(job.id)}
                          >
                            {job.status === 'active' ? (
                              <RotateCcw size={16} className="text-amber-500" />
                            ) : (
                              <Play size={16} className="text-emerald-500" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {job.status === 'active' ? 'Pause Pipeline' : 'Resume Pipeline'}
                        </TooltipContent>
                      </Tooltip>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Settings2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreVertical size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {job.status === 'active' && (
                  <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden bg-white/5">
                    <div className="bg-primary animate-progress h-full w-1/3" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel: Analytics & Health */}
        <div className="flex w-80 flex-col gap-6">
          <Card className="flex flex-col gap-6 border-white/5 bg-black/40 p-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              <h3 className="font-bold">Fleet Performance</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-40">Uptime</span>
                <span className="font-mono text-xs text-emerald-500">99.98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-40">Total Gens</span>
                <span className="font-mono text-xs">14,202</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="bg-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)] h-full w-[92%]" />
              </div>
            </div>

            <div className="bg-primary/5 border-primary/20 rounded-xl border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Zap size={14} className="text-amber-500" />
                <span className="text-[10px] font-bold tracking-wider uppercase">
                  Auto-Budgeting
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-400">
                Autonomous agent detected high GPU spot pricing. Throttling non-essential daily
                pipelines for 2 hours.
              </p>
            </div>
          </Card>

          <Card className="flex-1 border-white/5 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-500" />
              <h3 className="text-xs font-bold tracking-wider uppercase">Event Log</h3>
            </div>

            <div className="space-y-4">
              {[
                { time: '09:00', event: 'Video Studio: Daily Short Rendered', type: 'success' },
                { time: '08:45', event: 'Youtube: API Authenticated', type: 'success' },
                { time: '07:30', event: 'Ops: Budget Threshold Reached', type: 'alert' },
              ].map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-1 font-mono text-[9px] opacity-30">{log.time}</span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      {log.type === 'success' ? (
                        <CheckCircle2 size={10} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={10} className="text-amber-500" />
                      )}
                      <span className="text-[10px] leading-none font-medium">{log.event}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-8 h-8 w-full border-white/10 text-[10px] font-black uppercase italic"
            >
              Access Full Logs
            </Button>
          </Card>
        </div>
      </TooltipProvider>
    </div>
  );
}
