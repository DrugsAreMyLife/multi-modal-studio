import { useState, useEffect } from 'react';
import { WorkerStatus, getAllWorkerStatuses } from '@/lib/workers/local-worker-manager';

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
