'use client';

import { Sparkles, Info, Mic, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface VoiceProTipsProps {
  mode: 'clone' | 'train' | 'design';
  className?: string;
}

export function VoiceProTips({ mode, className }: VoiceProTipsProps) {
  const tips = {
    clone: [
      {
        icon: Mic,
        title: 'Choose the Clearest Clip',
        description: 'Pick audio with minimal background noise or static for best results.',
      },
      {
        icon: MessageSquare,
        title: 'Include the "Um"s',
        description:
          'Transcribing exactly what is said (including stumbles) helps the AI learn her natural rhythm.',
      },
      {
        icon: Sparkles,
        title: 'Sweet Spot',
        description: 'A 15-20 second clip often works better than a very long or very short one.',
      },
    ],
    train: [
      {
        icon: Mic,
        title: 'Variety Matters',
        description:
          'Upload clips with different emotions or speeds to capture the full range of her voice.',
      },
      {
        icon: MessageSquare,
        title: 'Transcript Accuracy',
        description: 'Accurate transcripts for every clip are the #1 way to improve quality.',
      },
      {
        icon: Info,
        title: 'Patience Pays Off',
        description:
          'Full training takes 10-30 minutes but creates a much more permanent and accurate clone.',
      },
    ],
    design: [
      {
        icon: MessageSquare,
        title: 'Descriptive is Better',
        description:
          'Include age, accent, gender, and even emotional state (e.g., "gentle grandmother").',
      },
    ],
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={14} className="text-amber-400" />
        <span className="text-xs font-semibold tracking-wider text-amber-400/80 uppercase">
          Pro Tips
        </span>
      </div>

      {tips[mode].map((tip, i) => (
        <Alert key={i} className="border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <tip.icon className="h-3.5 w-3.5 text-amber-400" />
          <AlertTitle className="text-[11px] font-semibold text-amber-200">{tip.title}</AlertTitle>
          <AlertDescription className="text-[10px] leading-relaxed text-amber-100/70 shadow-sm">
            {tip.description}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
