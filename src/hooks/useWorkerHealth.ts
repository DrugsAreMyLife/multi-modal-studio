import { useState, useEffect } from 'react';

// Define type locally to avoid importing server-only code from local-worker-manager
export interface WorkerStatus {
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

export function useWorkerHealth() {
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/workers/status');
      const data = await response.json();
      if (data.success) {
        setWorkers(data.workers);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Failed to fetch worker status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const overallStatus = workers.every((w) => !w.isRunning || w.isReady)
    ? workers.some((w) => w.isRunning)
      ? 'healthy'
      : 'idle'
    : 'degraded';

  return {
    workers,
    isLoading,
    lastUpdated,
    overallStatus,
    refresh: fetchStatus,
  };
}
