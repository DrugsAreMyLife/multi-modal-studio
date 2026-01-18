'use client';

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceInput } from '@/lib/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  className?: string;
}

export function VoiceInput({ onTranscription, className }: VoiceInputProps) {
  const { isRecording, isTranscribing, toggleRecording } = useVoiceInput({
    onTranscription,
    onError: (error) => console.error('Voice input error:', error),
  });

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'ghost'}
      size="icon"
      className={cn('h-8 w-8 shrink-0', className)}
      onClick={toggleRecording}
      disabled={isTranscribing}
      title={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
