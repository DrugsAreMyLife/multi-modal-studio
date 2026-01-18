'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface VideoJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  error?: string;
  progress?: number;
  provider?: string;
}

interface GenerationOptions {
  imageUrl?: string;
  duration?: number;
  webhookUrl?: string;
}

/**
 * Hook for managing async video generation with polling
 *
 * Usage:
 * const { jobs, startGeneration, getJob } = useVideoGeneration();
 *
 * // Start generation
 * const jobId = await startGeneration('A cat dancing', 'luma');
 *
 * // Check status
 * const job = getJob(jobId);
 * console.log(job?.status, job?.progress);
 */
export function useVideoGeneration() {
  const [jobs, setJobs] = useState<Map<string, VideoJob>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const retryAttempts = useRef<Map<string, number>>(new Map());

  /**
   * Start video generation with specified provider
   */
  const startGeneration = useCallback(
    async (
      prompt: string,
      provider: 'runway' | 'luma' | 'replicate',
      options?: GenerationOptions,
    ): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            provider,
            imageUrl: options?.imageUrl,
            duration: options?.duration,
            webhookUrl: options?.webhookUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to start video generation: ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (!data.success || !data.jobId) {
          throw new Error(data.error || 'Failed to start video generation');
        }

        const jobId = data.jobId;

        // Add to local state
        setJobs((prev) => {
          const newJobs = new Map(prev);
          newJobs.set(jobId, {
            jobId,
            status: 'pending',
            provider,
            progress: 0,
          });
          return newJobs;
        });

        // Initialize retry counter
        retryAttempts.current.set(jobId, 0);

        // Start polling for status - define inline to avoid dependency issues
        const pollInterval = 2000;
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/generate/video/status?jobId=${jobId}`);

            if (!statusRes.ok) {
              if (statusRes.status === 404) {
                return; // Job not found yet
              }
              throw new Error(`Status check failed: ${statusRes.statusText}`);
            }

            const jobStatus = await statusRes.json();

            // Update job in local state
            setJobs((prev) => {
              const newJobs = new Map(prev);
              const existingJob = newJobs.get(jobId);

              newJobs.set(jobId, {
                ...existingJob,
                ...jobStatus,
                jobId,
              });

              return newJobs;
            });

            // Stop polling if job is completed or failed
            if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
              clearInterval(interval);
              pollingIntervals.current.delete(jobId);

              if (jobStatus.status === 'completed') {
                console.log(`[useVideoGeneration] Job ${jobId} completed successfully`);
              } else {
                console.error(`[useVideoGeneration] Job ${jobId} failed:`, jobStatus.error);
              }
            }

            // Reset retry counter on successful status check
            retryAttempts.current.set(jobId, 0);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);

            // Track retry attempts
            const attempts = (retryAttempts.current.get(jobId) || 0) + 1;
            retryAttempts.current.set(jobId, attempts);

            // Stop after too many retries
            if (attempts > 30) {
              clearInterval(interval);
              pollingIntervals.current.delete(jobId);

              setJobs((prev) => {
                const newJobs = new Map(prev);
                const job = newJobs.get(jobId);
                if (job) {
                  newJobs.set(jobId, {
                    ...job,
                    status: 'failed',
                    error: `Polling timeout: ${message}`,
                  });
                }
                return newJobs;
              });

              console.error(
                `[useVideoGeneration] Job ${jobId} polling timeout after ${attempts} attempts`,
              );
            }
          }
        }, pollInterval);

        pollingIntervals.current.set(jobId, interval);

        console.log(`[useVideoGeneration] Started job ${jobId} with ${provider}`);

        return jobId;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error('[useVideoGeneration] Error starting generation:', message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Cancel polling for a specific job
   */
  const cancelPolling = useCallback((jobId: string) => {
    const interval = pollingIntervals.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      pollingIntervals.current.delete(jobId);
    }
  }, []);

  /**
   * Get a specific job by ID
   */
  const getJob = useCallback(
    (jobId: string): VideoJob | undefined => {
      return jobs.get(jobId);
    },
    [jobs],
  );

  /**
   * Get all jobs matching a status
   */
  const getJobsByStatus = useCallback(
    (status: VideoJob['status']): VideoJob[] => {
      return Array.from(jobs.values()).filter((job) => job.status === status);
    },
    [jobs],
  );

  /**
   * Clear a job from state
   */
  const clearJob = useCallback(
    (jobId: string) => {
      cancelPolling(jobId);
      setJobs((prev) => {
        const newJobs = new Map(prev);
        newJobs.delete(jobId);
        return newJobs;
      });
      retryAttempts.current.delete(jobId);
    },
    [cancelPolling],
  );

  /**
   * Clear all completed jobs
   */
  const clearCompletedJobs = useCallback(() => {
    setJobs((prev) => {
      const newJobs = new Map(prev);
      Array.from(newJobs.entries()).forEach(([jobId, job]) => {
        if (job.status === 'completed' || job.status === 'failed') {
          cancelPolling(jobId);
          newJobs.delete(jobId);
          retryAttempts.current.delete(jobId);
        }
      });
      return newJobs;
    });
  }, [cancelPolling]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const intervals = pollingIntervals.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const attempts = retryAttempts.current;

      intervals.forEach((interval) => clearInterval(interval));
      intervals.clear();
      attempts.clear();
    };
  }, []);

  return {
    // State
    jobs,
    isLoading,
    error,
    jobCount: jobs.size,

    // Methods
    startGeneration,
    getJob,
    getJobsByStatus,
    cancelPolling,
    clearJob,
    clearCompletedJobs,

    // Selectors
    completedJobs: Array.from(jobs.values()).filter((j) => j.status === 'completed'),
    failedJobs: Array.from(jobs.values()).filter((j) => j.status === 'failed'),
    pendingJobs: Array.from(jobs.values()).filter(
      (j) => j.status === 'pending' || j.status === 'processing',
    ),
  };
}
