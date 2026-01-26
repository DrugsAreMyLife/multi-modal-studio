'use client';

import { useState, useRef } from 'react';
import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { TrainingSample } from '@/lib/types/audio-studio';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  Trash2,
  Edit2,
  Check,
  X,
  FileAudio,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainingSampleListProps {
  samples: TrainingSample[];
}

export function TrainingSampleList({ samples }: TrainingSampleListProps) {
  const { removeTrainingSample, updateTrainingSample, clearTrainingSamples } =
    useAudioStudioStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = (sample: TrainingSample) => {
    if (playingId === sample.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sample.audioUrl;
        audioRef.current.play();
        setPlayingId(sample.id);
      }
    }
  };

  const handleEdit = (sample: TrainingSample) => {
    setEditingId(sample.id);
    setEditText(sample.transcript);
  };

  const handleSave = (id: string) => {
    updateTrainingSample(id, {
      transcript: editText,
      validated: editText.trim().length > 0,
    });
    setEditingId(null);
    setEditText('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const validCount = samples.filter((s) => s.validated).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileAudio size={14} className="text-amber-400" />
          <span className="text-xs font-medium">Training Samples ({samples.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[10px]',
              validCount === samples.length ? 'text-emerald-400' : 'text-amber-400',
            )}
          >
            {validCount}/{samples.length} transcribed
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300"
            onClick={clearTrainingSamples}
          >
            Clear all
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-2 pr-4">
          {samples.map((sample) => (
            <div
              key={sample.id}
              className={cn(
                'rounded-lg border p-3 transition-colors',
                sample.validated
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/10 bg-white/5',
              )}
            >
              {editingId === sample.id ? (
                // Edit mode
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Enter transcript for this audio..."
                    className="bg-background/50 min-h-[60px] resize-none text-xs"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="h-6 px-2" onClick={handleCancel}>
                      <X size={12} className="mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" className="h-6 px-2" onClick={() => handleSave(sample.id)}>
                      <Check size={12} className="mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-start gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 rounded-full bg-white/10"
                    onClick={() => handlePlay(sample)}
                  >
                    {playingId === sample.id ? (
                      <Pause size={12} />
                    ) : (
                      <Play size={12} className="ml-0.5" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium">{sample.audioFile.name}</span>
                      <span className="text-muted-foreground shrink-0 text-[10px]">
                        {sample.duration.toFixed(1)}s
                      </span>
                    </div>

                    {sample.transcript ? (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-[10px]">
                        "{sample.transcript}"
                      </p>
                    ) : (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                        <AlertCircle size={10} />
                        No transcript - click edit to add
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {sample.validated && <CheckCircle size={14} className="text-emerald-400" />}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleEdit(sample)}
                    >
                      <Edit2 size={12} />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-400 hover:text-red-300"
                      onClick={() => {
                        URL.revokeObjectURL(sample.audioUrl);
                        removeTrainingSample(sample.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
    </div>
  );
}
