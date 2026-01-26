'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Cpu,
  CheckCircle,
  XCircle,
  Loader2,
  Power,
  PowerOff,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkerStatus {
  id: string;
  label: string;
  isRunning: boolean;
  isReady: boolean;
  isStarting: boolean;
  error: string | null;
  vramEstimate: string;
  url: string;
  loadedAt: number | null;
}

interface WorkersResponse {
  success: boolean;
  workers: WorkerStatus[];
  activeVram: string;
}

export function WorkerStatusIndicator() {
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [activeVram, setActiveVram] = useState<string>('0GB');
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/workers/status');
      if (response.ok) {
        const data: WorkersResponse = await response.json();
        setWorkers(data.workers);
        setActiveVram(data.activeVram);
      }
    } catch {
      console.error('Failed to fetch worker status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleWorkerAction = async (workerId: string, action: 'start' | 'stop' | 'restart') => {
    setActionInProgress(workerId);
    try {
      const response = await fetch('/api/workers/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, action }),
      });
      if (response.ok) {
        await fetchStatus();
      }
    } catch {
      console.error(`Failed to ${action} worker`);
    } finally {
      setActionInProgress(null);
    }
  };

  const readyCount = workers.filter((w) => w.isReady).length;
  const startingCount = workers.filter((w) => w.isStarting).length;
  const totalCount = workers.length;

  // Determine indicator color
  const getIndicatorColor = () => {
    if (startingCount > 0) return 'text-blue-400';
    if (readyCount > 0) return 'text-emerald-400';
    return 'text-muted-foreground';
  };

  const getIndicatorIcon = () => {
    if (startingCount > 0) {
      return <Loader2 size={14} className="animate-spin" />;
    }
    return <Cpu size={14} />;
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground h-8 gap-1.5 px-2 text-xs">
        <Loader2 size={14} className="animate-spin" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 gap-1.5 px-2 text-xs', getIndicatorColor())}
          title="Local Workers"
        >
          {getIndicatorIcon()}
          <span className="hidden sm:inline">
            {readyCount}/{totalCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-border border-b p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Local Workers</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchStatus}
              title="Refresh status"
            >
              <RefreshCw size={12} />
            </Button>
          </div>
          {activeVram !== '0GB' && (
            <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <HardDrive size={10} />
              <span>Active VRAM: {activeVram}</span>
            </div>
          )}
        </div>

        <div className="max-h-80 overflow-auto p-2">
          {workers.map((worker) => (
            <WorkerRow
              key={worker.id}
              worker={worker}
              isLoading={actionInProgress === worker.id}
              onStart={() => handleWorkerAction(worker.id, 'start')}
              onStop={() => handleWorkerAction(worker.id, 'stop')}
              onRestart={() => handleWorkerAction(worker.id, 'restart')}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function WorkerRow({
  worker,
  isLoading,
  onStart,
  onStop,
  onRestart,
}: {
  worker: WorkerStatus;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
}) {
  const getStatusBadge = () => {
    if (worker.isStarting || isLoading) {
      return (
        <span className="flex items-center gap-1 text-blue-400">
          <Loader2 size={10} className="animate-spin" />
          Loading...
        </span>
      );
    }
    if (worker.isReady) {
      return (
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle size={10} />
          Ready
        </span>
      );
    }
    if (worker.error) {
      return (
        <span className="flex items-center gap-1 text-red-400" title={worker.error}>
          <XCircle size={10} />
          Error
        </span>
      );
    }
    return (
      <span className="text-muted-foreground flex items-center gap-1">
        <PowerOff size={10} />
        Stopped
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between rounded-md p-2 hover:bg-white/5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{worker.label}</span>
          <span className="text-muted-foreground text-[10px]">{worker.vramEstimate}</span>
        </div>
        <div className="text-[10px]">{getStatusBadge()}</div>
      </div>

      <div className="flex items-center gap-1">
        {worker.isReady ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-amber-400 hover:bg-amber-500/10"
              onClick={onRestart}
              disabled={isLoading}
              title="Restart"
            >
              <RefreshCw size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-400 hover:bg-red-500/10"
              onClick={onStop}
              disabled={isLoading}
              title="Stop"
            >
              <PowerOff size={12} />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-emerald-400 hover:bg-emerald-500/10"
            onClick={onStart}
            disabled={isLoading || worker.isStarting}
            title="Start"
          >
            <Power size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}
