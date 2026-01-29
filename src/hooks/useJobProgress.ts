'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface JobProgressState {
  jobId: string;
  progress: number;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'connecting';
  message?: string;
  result?: unknown;
  error?: string;
}

export interface UseJobProgressOptions {
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export function useJobProgress(
  jobId: string | null,
  options: UseJobProgressOptions = {},
): JobProgressState & { reset: () => void } {
  const { autoReconnect = true, reconnectDelay = 2000, maxReconnectAttempts = 3 } = options;

  const [state, setState] = useState<JobProgressState>({
    jobId: jobId || '',
    progress: 0,
    status: 'pending',
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const connect = useCallback(() => {
    if (!jobId) return;

    cleanup();

    setState((prev) => ({ ...prev, status: 'connecting' }));

    const eventSource = new EventSource(`/api/jobs/${jobId}/events`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      reconnectAttemptsRef.current = 0;
      setState((prev) => ({ ...prev, status: 'processing' }));
    });

    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        progress: data.progress,
        message: data.message,
        status: 'processing',
      }));
    });

    eventSource.addEventListener('completed', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        progress: 100,
        status: 'completed',
        result: data,
      }));
      cleanup();
    });

    eventSource.addEventListener('failed', (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: data.error || 'Job failed',
      }));
      cleanup();
    });

    eventSource.addEventListener('error', (event: Event) => {
      const messageEvent = event as MessageEvent;
      const data = messageEvent.data ? JSON.parse(messageEvent.data) : {};
      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: data.message || 'Connection error',
      }));
    });

    eventSource.onerror = () => {
      eventSource.close();

      // Attempt reconnection
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
      } else {
        setState((prev) => ({
          ...prev,
          status: 'failed',
          error: 'Connection lost',
        }));
      }
    };
  }, [jobId, autoReconnect, reconnectDelay, maxReconnectAttempts, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    reconnectAttemptsRef.current = 0;
    setState({
      jobId: jobId || '',
      progress: 0,
      status: 'pending',
    });
  }, [jobId, cleanup]);

  useEffect(() => {
    if (jobId) {
      connect();
    }

    return cleanup;
  }, [jobId, connect, cleanup]);

  return { ...state, reset };
}

// Hook for tracking multiple jobs
export function useMultiJobProgress(jobIds: string[]) {
  const [jobs, setJobs] = useState<Map<string, JobProgressState>>(new Map());

  useEffect(() => {
    const eventSources: EventSource[] = [];

    jobIds.forEach((jobId) => {
      const eventSource = new EventSource(`/api/jobs/${jobId}/events`);
      eventSources.push(eventSource);

      const updateJob = (update: Partial<JobProgressState>) => {
        setJobs((prev) => {
          const newMap = new Map(prev);
          newMap.set(jobId, { ...prev.get(jobId)!, ...update, jobId });
          return newMap;
        });
      };

      eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        updateJob({ progress: data.progress, status: 'processing', message: data.message });
      });

      eventSource.addEventListener('completed', (e) => {
        const data = JSON.parse(e.data);
        updateJob({ progress: 100, status: 'completed', result: data });
      });

      eventSource.addEventListener('failed', (e) => {
        const data = JSON.parse(e.data);
        updateJob({ status: 'failed', error: data.error });
      });
    });

    return () => {
      eventSources.forEach((es) => es.close());
    };
  }, [jobIds.join(',')]);

  return jobs;
}
