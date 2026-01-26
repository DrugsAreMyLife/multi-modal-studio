'use client';

import { useMemo } from 'react';
import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop, Sparkles } from 'lucide-react';

export function VoiceSelector() {
  const { voices, selectedVoiceId, setVoice } = useAudioStudioStore();

  const activeVoice = useMemo(
    () => voices.find((v) => v.id === selectedVoiceId) || voices[0],
    [voices, selectedVoiceId],
  );

  // Group voices by provider type
  const groupedVoices = useMemo(() => {
    const qwenVoices = voices.filter((v) => v.id.startsWith('qwen-'));
    const cloudVoices = voices.filter((v) => v.provider === 'cloud' && !v.id.startsWith('qwen-'));
    const localVoices = voices.filter((v) => v.provider === 'local' && !v.id.startsWith('qwen-'));
    return { qwenVoices, cloudVoices, localVoices };
  }, [voices]);

  const isQwenVoice = activeVoice?.id.startsWith('qwen-');

  return (
    <div className="w-full">
      <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">Voice Model</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-input bg-background/50 h-12 w-full justify-between px-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-md p-1.5 ${
                  isQwenVoice
                    ? 'bg-purple-500/10 text-purple-500'
                    : activeVoice?.provider === 'local'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-blue-500/10 text-blue-500'
                }`}
              >
                {isQwenVoice ? (
                  <Sparkles size={16} />
                ) : activeVoice?.provider === 'local' ? (
                  <Laptop size={16} />
                ) : (
                  <Cloud size={16} />
                )}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold">{activeVoice?.name}</span>
                <span className="text-muted-foreground flex gap-1 text-[10px]">
                  {activeVoice?.tags.slice(0, 3).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[400px] w-[300px] overflow-y-auto" align="start">
          {/* Qwen3-TTS Voices */}
          {groupedVoices.qwenVoices.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-purple-400">
                <Sparkles size={12} />
                Qwen3-TTS (Local)
              </DropdownMenuLabel>
              {groupedVoices.qwenVoices.map((voice) => (
                <DropdownMenuItem
                  key={voice.id}
                  onClick={() => setVoice(voice.id)}
                  className="cursor-pointer gap-3 py-2"
                >
                  <div className="rounded-md bg-purple-500/10 p-1.5 text-purple-500">
                    <Sparkles size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{voice.name.replace('Qwen3: ', '')}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {voice.tags.join(' • ')}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Cloud Voices */}
          {groupedVoices.cloudVoices.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-blue-400">
                <Cloud size={12} />
                Cloud Providers
              </DropdownMenuLabel>
              {groupedVoices.cloudVoices.map((voice) => (
                <DropdownMenuItem
                  key={voice.id}
                  onClick={() => setVoice(voice.id)}
                  className="cursor-pointer gap-3 py-2"
                >
                  <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
                    <Cloud size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{voice.name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {voice.tags.join(' • ')}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Other Local Voices */}
          {groupedVoices.localVoices.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-emerald-400">
                <Laptop size={12} />
                Other Local
              </DropdownMenuLabel>
              {groupedVoices.localVoices.map((voice) => (
                <DropdownMenuItem
                  key={voice.id}
                  onClick={() => setVoice(voice.id)}
                  className="cursor-pointer gap-3 py-2"
                >
                  <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-500">
                    <Laptop size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{voice.name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {voice.tags.join(' • ')}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
