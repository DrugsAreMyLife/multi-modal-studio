'use client';

import { useEffect, useState } from 'react';
import { useTrainingStore } from '@/lib/store/training-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { XCircle, CheckCircle, Clock, Zap, AlertCircle, TrendingDown, Images } from 'lucide-react';
import { LossGraph } from './LossGraph';
import { LossGraphControls } from './LossGraphControls';
import { LossGraphMetrics } from './LossGraphMetrics';
import { SampleImageGrid } from './SampleImageGrid';
import { SampleImageModal } from './SampleImageModal';
import { useLossGraph } from '@/lib/hooks/useLossGraph';
import { useSampleImages } from '@/lib/hooks/useSampleImages';
import type { SampleImage } from '@/lib/types/sample-images';

import type { TrainingJob as DbTrainingJob } from '@/lib/db/training';

interface TrainingJob extends Omit<
  DbTrainingJob,
  | 'user_id'
  | 'dataset_id'
  | 'base_model'
  | 'config'
  | 'trigger_words'
  | 'container_id'
  | 'error_message'
  | 'updated_at'
  | 'completed_at'
> {
  current_loss?: number;
}

/**
 * Format elapsed time from start timestamp
 */
function formatElapsedTime(startedAt: string | null): string {
  if (!startedAt) return '--:--:--';
  try {
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } catch {
    return '--:--:--';
  }
}

/**
 * Get status badge component with appropriate styling and icon
 */
function getStatusBadge(status: string): {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ComponentType<{ className?: string }>;
  text: string;
} {
  const variants: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'outline' | 'destructive';
      icon: React.ComponentType<{ className?: string }>;
      text: string;
    }
  > = {
    pending: { variant: 'secondary', icon: Clock, text: 'Pending' },
    queued: { variant: 'secondary', icon: Clock, text: 'Queued' },
    running: { variant: 'default', icon: Zap, text: 'Running' },
    completed: { variant: 'default', icon: CheckCircle, text: 'Completed' },
    failed: { variant: 'destructive', icon: AlertCircle, text: 'Failed' },
    cancelled: { variant: 'outline', icon: XCircle, text: 'Cancelled' },
  };

  return variants[status] || { variant: 'secondary', icon: Clock, text: 'Unknown' };
}

/**
 * Hook to update elapsed time every second
 */
function useElapsedTime(startedAt: string | null): string {
  const [elapsedTime, setElapsedTime] = useState<string>(formatElapsedTime(startedAt));

  useEffect(() => {
    if (!startedAt || new Date(startedAt).getTime() > Date.now()) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsedTime;
}

/**
 * Individual training job card component
 */
function JobCard({
  job,
  onCancel,
}: {
  job: TrainingJob;
  onCancel: (jobId: string) => Promise<void>;
}) {
  const elapsedTime = useElapsedTime(job.started_at ?? null);
  const statusBadge = getStatusBadge(job.status);
  const StatusIcon = statusBadge.icon;
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SampleImage | null>(null);

  // Loss graph hook
  const { lossHistory, metrics, addDataPoint, smoothingFactor, setSmoothingFactor } =
    useLossGraph(0.3);

  // Sample images hook
  const {
    images,
    isLoading: imagesLoading,
    error: imagesError,
    loadMore,
    hasMore,
    preloadImage,
  } = useSampleImages({
    trainingJobId: job.id,
    pageSize: 24,
    autoPreload: true,
  });

  // Loss graph config state
  const [graphConfig, setGraphConfig] = useState<{
    smoothingFactor: number;
    showMovingAverage: boolean;
    metricsToDisplay: string[];
    yAxisScale: 'linear' | 'log';
  }>({
    smoothingFactor: 0.3,
    showMovingAverage: true,
    metricsToDisplay: [],
    yAxisScale: 'linear',
  });

  // Sample image grid config state
  const [gridConfig] = useState({
    columns: 4,
    thumbnailSize: 'medium' as const,
    sortBy: 'step' as const,
    sortOrder: 'desc' as const,
    showStepBadges: true,
  });

  // Simulate real-time loss data updates for running jobs
  useEffect(() => {
    if (job.status === 'running' && job.current_loss !== undefined) {
      addDataPoint({
        epoch: Math.floor((job.current_step || 0) / 100),
        iteration: job.current_step || 0,
        loss: job.current_loss,
      });
    }
  }, [job.current_loss, job.current_step, job.status, addDataPoint]);

  const handleCancelJob = async () => {
    setIsCancelling(true);
    try {
      await onCancel(job.id);
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleImageDownload = async (image: SampleImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample_step_${image.step}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const isActive = ['pending', 'queued', 'running'].includes(job.status);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{job.name}</CardTitle>
            <p className="text-muted-foreground mt-1 text-xs">
              Created {new Date(job.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusBadge.text}
            </Badge>
            {isActive && (
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    disabled={isCancelling}
                    title="Cancel training job"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Training Job?</DialogTitle>
                    <DialogDescription>
                      This will stop the training process for "{job.name}". Progress will be saved
                      up to the last checkpoint.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCancelDialogOpen(false)}
                      disabled={isCancelling}
                    >
                      Keep Training
                    </Button>
                    <Button variant="destructive" onClick={handleCancelJob} disabled={isCancelling}>
                      {isCancelling ? 'Cancelling...' : 'Cancel Job'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="overview" className="gap-2">
              <Zap className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="loss-graph" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Loss Graph
            </TabsTrigger>
            <TabsTrigger value="samples" className="gap-2">
              <Images className="h-4 w-4" />
              Sample Images
              {images.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {images.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0 space-y-4 p-4">
            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(job.progress_percent ?? 0)}%</span>
              </div>
              <Progress value={Math.min(job.progress_percent ?? 0, 100)} className="h-2" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              {/* Elapsed Time */}
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Elapsed Time</p>
                <p className="font-mono text-sm font-medium">{elapsedTime}</p>
              </div>

              {/* Step Counter */}
              {job.current_step !== undefined && job.total_steps !== undefined && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Steps</p>
                  <p className="font-mono text-sm font-medium">
                    {job.current_step.toLocaleString()} / {job.total_steps.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Current Loss */}
              {job.current_loss !== undefined && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Loss</p>
                  <p className="font-mono text-sm font-medium">{job.current_loss.toFixed(4)}</p>
                </div>
              )}
            </div>

            {/* Empty state for metrics if none available */}
            {job.current_step === undefined && job.current_loss === undefined && (
              <div className="text-muted-foreground py-2 text-center text-xs">
                Waiting for metrics...
              </div>
            )}
          </TabsContent>

          {/* Loss Graph Tab */}
          <TabsContent value="loss-graph" className="m-0 space-y-4 p-4">
            {/* Loss Metrics */}
            <LossGraphMetrics metrics={metrics} />

            {/* Loss Graph */}
            <LossGraph data={lossHistory} config={graphConfig} />

            {/* Graph Controls */}
            <LossGraphControls
              config={graphConfig}
              onConfigChange={(updates) => setGraphConfig((prev) => ({ ...prev, ...updates }))}
            />
          </TabsContent>

          {/* Sample Images Tab */}
          <TabsContent value="samples" className="m-0 p-4">
            <SampleImageGrid
              images={images}
              config={gridConfig}
              onImageClick={setSelectedImage}
              onImageDownload={handleImageDownload}
              onLoadMore={loadMore}
              hasMore={hasMore}
            />

            {/* Sample Image Modal */}
            <SampleImageModal
              image={selectedImage}
              isOpen={!!selectedImage}
              onClose={() => setSelectedImage(null)}
              onNext={() => {
                if (selectedImage) {
                  const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
                  const nextImage = images[currentIndex + 1];
                  if (nextImage) setSelectedImage(nextImage);
                }
              }}
              onPrevious={() => {
                if (selectedImage) {
                  const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
                  const prevImage = images[currentIndex - 1];
                  if (prevImage) setSelectedImage(prevImage);
                }
              }}
              onDownload={handleImageDownload}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * TrainingMonitor Component
 * Displays all active training jobs with real-time progress updates
 */
export function TrainingMonitor() {
  const { activeJobs, fetchActiveJobs, cancelJob, pollJobStatus } = useTrainingStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial fetch and set up auto-refresh
  useEffect(() => {
    fetchActiveJobs();
    setIsInitialized(true);

    const interval = setInterval(() => {
      fetchActiveJobs();
    }, 5000);

    return () => {
      clearInterval(interval);
      // Stop all store polling when the monitor unmounts to prevent memory leaks
      useTrainingStore.getState().stopAllPolling();
    };
  }, [fetchActiveJobs]);

  // Poll individual job statuses
  useEffect(() => {
    if (!isInitialized) return;

    activeJobs.forEach((job) => {
      if (['pending', 'queued', 'running'].includes(job.status)) {
        pollJobStatus(job.id);
      }
    });
  }, [activeJobs, pollJobStatus, isInitialized]);

  if (!isInitialized) {
    return null;
  }

  // Empty state
  if (activeJobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="text-muted-foreground mb-4 h-12 w-12" />
          <p className="text-lg font-medium">No Active Training Jobs</p>
          <p className="text-muted-foreground text-sm">
            Start a new training job to see progress here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-4 text-lg font-semibold">Active Training Jobs</h2>
        <div className="grid gap-4">
          {activeJobs.map((job) => (
            <JobCard key={job.id} job={job as TrainingJob} onCancel={cancelJob} />
          ))}
        </div>
      </div>
    </div>
  );
}
