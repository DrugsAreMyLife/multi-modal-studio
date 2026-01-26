'use client';

import { useRef, useState, useCallback } from 'react';
import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { Upload, FileAudio, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MIN_DURATION = 5; // seconds
const MAX_DURATION = 60; // seconds
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total
const ACCEPTED_TYPES = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/m4a',
  'audio/flac',
  'audio/x-m4a',
];

export function DragDropZone() {
  const { addTrainingSample, trainingSamples } = useAudioStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File): Promise<boolean> => {
      // Validate file type
      if (!file.type.startsWith('audio/') && !ACCEPTED_TYPES.some((t) => file.type.includes(t))) {
        toast.error(`Invalid file: ${file.name}`, { description: 'Only audio files are accepted' });
        return false;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large: ${file.name}`, { description: 'Maximum file size is 50MB' });
        return false;
      }

      // Create blob URL and get duration
      const audioUrl = URL.createObjectURL(file);

      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);

        audio.onloadedmetadata = () => {
          const duration = audio.duration;

          if (duration < MIN_DURATION) {
            toast.error(`Audio too short: ${file.name}`, {
              description: `Minimum duration is ${MIN_DURATION} seconds`,
            });
            URL.revokeObjectURL(audioUrl);
            resolve(false);
            return;
          }

          if (duration > MAX_DURATION) {
            toast.warning(`Audio trimmed: ${file.name}`, {
              description: `Only first ${MAX_DURATION} seconds will be used`,
            });
          }

          addTrainingSample({
            audioFile: file,
            audioUrl,
            transcript: '',
            duration: Math.min(duration, MAX_DURATION),
            validated: false,
          });

          resolve(true);
        };

        audio.onerror = () => {
          toast.error(`Failed to load: ${file.name}`);
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };
      });
    },
    [addTrainingSample],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsProcessing(true);

      const fileArray = Array.from(files);

      // Check total size
      const totalSize = fileArray.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        toast.error('Total size too large', {
          description: 'Maximum total dataset size is 500MB',
        });
        setIsProcessing(false);
        return;
      }

      let successCount = 0;
      for (const file of fileArray) {
        const success = await processFile(file);
        if (success) successCount++;
      }

      if (successCount > 0) {
        toast.success(`Added ${successCount} sample${successCount > 1 ? 's' : ''}`, {
          description: 'Add transcripts for each sample to enable training',
        });
      }

      setIsProcessing(false);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all',
        isDragging
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-white/20 bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/5',
        isProcessing && 'pointer-events-none opacity-50',
      )}
    >
      {isProcessing ? (
        <div className="flex flex-col items-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-muted-foreground text-sm">Processing files...</span>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <FileAudio size={24} className="text-amber-400" />
            <Upload size={20} className="text-muted-foreground" />
          </div>

          <span className="text-sm font-medium">Drop training audio files here</span>
          <span className="text-muted-foreground mt-1 text-xs">or click to browse</span>

          <div className="text-muted-foreground mt-4 flex flex-wrap justify-center gap-2 text-[10px]">
            <span className="rounded bg-white/10 px-2 py-0.5">WAV</span>
            <span className="rounded bg-white/10 px-2 py-0.5">MP3</span>
            <span className="rounded bg-white/10 px-2 py-0.5">M4A</span>
            <span className="rounded bg-white/10 px-2 py-0.5">FLAC</span>
          </div>

          <div className="text-muted-foreground mt-3 flex items-center gap-1 text-[10px]">
            <AlertCircle size={10} />
            <span>5-60 sec each, minimum 5 samples, max 500MB total</span>
          </div>

          {trainingSamples.length > 0 && (
            <div className="mt-3 rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-400">
              {trainingSamples.length} sample{trainingSamples.length !== 1 ? 's' : ''} uploaded
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />
    </div>
  );
}
