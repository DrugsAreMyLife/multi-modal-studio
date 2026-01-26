'use client';

import { useRef, useState, useCallback } from 'react';
import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, Play, Pause, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MIN_DURATION = 3; // seconds
const MAX_DURATION = 30; // seconds
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function ReferenceAudioUpload() {
  const { cloneRef, setCloneRef, xVectorOnlyMode } = useAudioStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast.error('Invalid file type', { description: 'Please upload an audio file' });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File too large', { description: 'Maximum file size is 25MB' });
        return;
      }

      // Create blob URL
      const audioUrl = URL.createObjectURL(file);

      // Get duration
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        const audioDuration = audio.duration;

        if (audioDuration < MIN_DURATION) {
          toast.error('Audio too short', {
            description: `Minimum duration is ${MIN_DURATION} seconds for quality cloning`,
          });
          URL.revokeObjectURL(audioUrl);
          return;
        }

        if (audioDuration > MAX_DURATION) {
          toast.warning('Audio trimmed', {
            description: `Only first ${MAX_DURATION} seconds will be used`,
          });
        }

        setDuration(audioDuration);
        setCloneRef({
          audioUrl,
          audioFile: file,
          transcript: cloneRef?.transcript || '',
          duration: audioDuration,
        });
      };

      audio.onerror = () => {
        toast.error('Invalid audio file', { description: 'Could not load audio' });
        URL.revokeObjectURL(audioUrl);
      };
    },
    [cloneRef, setCloneRef],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleTranscriptChange = (transcript: string) => {
    if (cloneRef) {
      setCloneRef({ ...cloneRef, transcript });
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const clearRef = () => {
    if (cloneRef?.audioUrl) {
      URL.revokeObjectURL(cloneRef.audioUrl);
    }
    setCloneRef(null);
    setDuration(null);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs">Reference Audio (3-30 seconds)</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={12} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-[11px]">
              Choosing a clip with the clearest voice and least background noise will give you the
              best results.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {!cloneRef?.audioUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 p-6 transition-colors hover:border-blue-500/50 hover:bg-blue-500/5"
        >
          <Upload size={24} className="text-muted-foreground mb-2" />
          <span className="text-muted-foreground text-sm">Drop audio file or click to upload</span>
          <span className="text-muted-foreground mt-1 text-[10px]">
            WAV, MP3, M4A, FLAC (max 25MB)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Audio Preview */}
          <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </Button>

            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium">
                  {cloneRef.audioFile?.name || 'Reference Audio'}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={clearRef}>
                  <X size={14} />
                </Button>
              </div>

              {/* Simple waveform placeholder */}
              <div className="flex h-6 items-end gap-px">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-blue-500/60"
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  />
                ))}
              </div>

              <div className="text-muted-foreground mt-1 flex items-center justify-between text-[10px]">
                <span>{duration?.toFixed(1)}s</span>
                <span
                  className={cn(
                    'flex items-center gap-1',
                    duration && duration >= MIN_DURATION ? 'text-emerald-400' : 'text-amber-400',
                  )}
                >
                  {duration && duration >= MIN_DURATION ? (
                    <>
                      <CheckCircle size={10} /> Good length
                    </>
                  ) : (
                    <>
                      <AlertCircle size={10} /> Too short
                    </>
                  )}
                </span>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={cloneRef.audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>

          {/* Transcript Input */}
          {!xVectorOnlyMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">Transcript</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs text-[11px]">
                        Include stumbles, "ums", and pauses exactly as they sound. This helps the AI
                        learn her natural rhythm.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-muted-foreground text-[10px]">Required for best quality</span>
              </div>
              <Textarea
                placeholder="Type the exact words spoken in the reference audio..."
                className="bg-background/50 min-h-[80px] resize-none text-sm"
                value={cloneRef.transcript}
                onChange={(e) => handleTranscriptChange(e.target.value)}
              />
              {cloneRef.transcript.length === 0 && (
                <p className="text-[10px] text-amber-400">
                  Adding a transcript significantly improves clone quality
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
