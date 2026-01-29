'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Power, PowerOff, RefreshCw, HardDrive } from 'lucide-react';

interface WorkerStatus {
  workerId: string;
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'starting';
  vramUsed: number;
  vramTotal: number;
  modelsLoaded: string[];
  uptime: number;
}

interface WorkerStatusBarProps {
  className?: string;
  compact?: boolean;
  showControls?: boolean;
}

const WORKER_NAMES: Record<string, string> = {
  sam2: 'SAM2 Segmentation',
  'hunyuan-video': 'Hunyuan Video',
  'hunyuan-image': 'Hunyuan Image',
  'qwen-image': 'Qwen Image',
  'qwen-geo': 'Qwen Geometry',
  'svg-turbo': 'SVG Turbo',
};

export function WorkerStatusBar({
  className = '',
  compact = false,
  showControls = true,
}: WorkerStatusBarProps) {
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVram, setTotalVram] = useState({ used: 0, total: 0 });

  const fetchWorkerStatus = async () => {
    try {
      // In production, this would call the actual API
      // For now, simulate worker status
      const mockWorkers: WorkerStatus[] = [
        {
          workerId: 'sam2',
          name: 'SAM2 Segmentation',
          status: 'online',
          vramUsed: 6144,
          vramTotal: 24576,
          modelsLoaded: ['sam2_hiera_large'],
          uptime: 3600,
        },
        {
          workerId: 'svg-turbo',
          name: 'SVG Turbo',
          status: 'online',
          vramUsed: 0,
          vramTotal: 0,
          modelsLoaded: ['potrace'],
          uptime: 3600,
        },
        {
          workerId: 'hunyuan-video',
          name: 'Hunyuan Video',
          status: 'offline',
          vramUsed: 0,
          vramTotal: 24576,
          modelsLoaded: [],
          uptime: 0,
        },
      ];

      setWorkers(mockWorkers);

      // Calculate total VRAM
      const used = mockWorkers.reduce((sum, w) => sum + w.vramUsed, 0);
      const total = Math.max(...mockWorkers.map((w) => w.vramTotal), 24576);
      setTotalVram({ used, total });
    } catch (error) {
      console.error('Failed to fetch worker status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerStatus();
    const interval = setInterval(fetchWorkerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartWorker = async (workerId: string) => {
    console.log(`Starting worker: ${workerId}`);
    // In production: call API to start worker
  };

  const handleStopWorker = async (workerId: string) => {
    console.log(`Stopping worker: ${workerId}`);
    // In production: call API to stop worker
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'starting':
        return 'bg-blue-500';
      default:
        return 'bg-zinc-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-emerald-500/20 text-emerald-400">Online</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Degraded</Badge>;
      case 'starting':
        return <Badge className="bg-blue-500/20 text-blue-400">Starting</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400">Offline</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {workers.slice(0, 3).map((worker) => (
            <div
              key={worker.workerId}
              className={`h-2 w-2 rounded-full ${getStatusColor(worker.status)}`}
              title={`${worker.name}: ${worker.status}`}
            />
          ))}
        </div>
        <span className="text-xs text-zinc-500">
          {workers.filter((w) => w.status === 'online').length}/{workers.length} workers
        </span>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <HardDrive size={10} />
          <span>
            {Math.round(totalVram.used / 1024)}GB/{Math.round(totalVram.total / 1024)}GB
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-white/10 bg-black/40 p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          <span className="font-medium">Worker Status</span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchWorkerStatus} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* VRAM Usage Bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>GPU VRAM</span>
          <span>
            {Math.round(totalVram.used / 1024)}GB / {Math.round(totalVram.total / 1024)}GB
          </span>
        </div>
        <Progress value={(totalVram.used / totalVram.total) * 100} className="h-2" />
      </div>

      {/* Worker List */}
      <div className="space-y-2">
        {workers.map((worker) => (
          <div
            key={worker.workerId}
            className="flex items-center justify-between rounded bg-white/5 p-2"
          >
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${getStatusColor(worker.status)}`} />
              <div>
                <div className="text-sm font-medium">{worker.name}</div>
                <div className="text-xs text-zinc-500">
                  {worker.status === 'online' && worker.uptime > 0 && (
                    <span>Up {formatUptime(worker.uptime)}</span>
                  )}
                  {worker.modelsLoaded.length > 0 && (
                    <span className="ml-2">{worker.modelsLoaded.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(worker.status)}

              {showControls &&
                (worker.status === 'online' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStopWorker(worker.workerId)}
                  >
                    <PowerOff size={14} className="text-red-400" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartWorker(worker.workerId)}
                  >
                    <Power size={14} className="text-emerald-400" />
                  </Button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
