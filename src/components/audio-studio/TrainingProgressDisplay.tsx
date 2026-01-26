'use client';

import { VoiceTrainingJob } from '@/lib/types/audio-studio';
import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Database,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainingProgressDisplayProps {
  job: VoiceTrainingJob;
}

export function TrainingProgressDisplay({ job }: TrainingProgressDisplayProps) {
  const { setActiveTrainingJob, addTrainedVoice } = useAudioStudioStore();

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isRunning = job.status === 'training' || job.status === 'uploading';

  const handleDismiss = () => {
    if (isCompleted && job.modelPath) {
      // Add the trained voice to available voices
      addTrainedVoice({
        id: `trained-${job.id}`,
        name: `Trained: ${job.name}`,
        provider: 'cloned',
        tags: ['Custom', 'LoRA', 'Trained'],
      });
    }
    setActiveTrainingJob(null);
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle size={20} className="text-emerald-400" />;
      case 'failed':
        return <XCircle size={20} className="text-red-400" />;
      case 'pending':
        return <Clock size={20} className="text-amber-400" />;
      default:
        return <Loader2 size={20} className="animate-spin text-blue-400" />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'completed':
        return 'Training Complete!';
      case 'failed':
        return 'Training Failed';
      case 'pending':
        return 'Waiting to start...';
      case 'uploading':
        return 'Uploading dataset...';
      case 'training':
        return 'Training in progress...';
      default:
        return job.status;
    }
  };

  // Estimate remaining time based on progress
  const estimateTime = () => {
    if (!isRunning || job.progress === 0) return null;
    const elapsed = Date.now() - job.createdAt;
    const total = (elapsed / job.progress) * 100;
    const remaining = total - elapsed;
    const minutes = Math.ceil(remaining / 60000);
    return minutes > 0 ? `~${minutes} min remaining` : 'Almost done...';
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isCompleted && 'border-emerald-500/30 bg-emerald-500/5',
        isFailed && 'border-red-500/30 bg-red-500/5',
        isRunning && 'border-blue-500/30 bg-blue-500/5',
        job.status === 'pending' && 'border-amber-500/30 bg-amber-500/5',
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-medium">{job.name}</h4>
            <p className="text-muted-foreground text-xs">{getStatusText()}</p>
          </div>
        </div>

        {(isCompleted || isFailed) && (
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            {isCompleted ? 'Use Voice' : 'Dismiss'}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {!isFailed && (
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(job.progress)}%</span>
          </div>
          <Progress value={job.progress} className="h-2" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded bg-white/5 p-2">
          <Database size={14} className="text-muted-foreground" />
          <div>
            <p className="text-muted-foreground text-[10px]">Dataset Size</p>
            <p className="text-xs font-medium">{job.datasetSize} samples</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded bg-white/5 p-2">
          <Clock size={14} className="text-muted-foreground" />
          <div>
            <p className="text-muted-foreground text-[10px]">
              {isCompleted ? 'Completed' : 'Est. Time'}
            </p>
            <p className="text-xs font-medium">
              {isCompleted
                ? new Date(job.completedAt!).toLocaleTimeString()
                : estimateTime() || 'Calculating...'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {isFailed && job.error && (
        <div className="mt-4 rounded bg-red-500/10 p-3">
          <p className="text-xs text-red-400">{job.error}</p>
        </div>
      )}

      {/* Success Message */}
      {isCompleted && (
        <div className="mt-4 flex items-center gap-2 rounded bg-emerald-500/10 p-3">
          <Sparkles size={14} className="text-emerald-400" />
          <p className="text-xs text-emerald-400">
            Your custom voice is ready! It will appear in the voice selector as "Trained: {job.name}
            "
          </p>
        </div>
      )}

      {/* Training Tips */}
      {isRunning && (
        <div className="mt-4 rounded bg-blue-500/10 p-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={14} className="text-blue-400" />
            <p className="text-xs text-blue-400">
              Training typically takes 10-30 minutes depending on dataset size
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
