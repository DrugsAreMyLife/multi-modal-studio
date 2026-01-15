'use client';

import { useAudioStudioStore, MOCK_VOICES } from '@/lib/store/audio-studio-store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop, Mic } from 'lucide-react';

export function VoiceSelector() {
    const { selectedVoiceId, setVoice } = useAudioStudioStore();

    const activeVoice = MOCK_VOICES.find(v => v.id === selectedVoiceId) || MOCK_VOICES[0];

    return (
        <div className="w-full">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Voice Model</div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-12 px-3 border-input bg-background/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${activeVoice.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {activeVoice.provider === 'local' ? <Laptop size={16} /> : <Cloud size={16} />}
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-sm font-semibold">{activeVoice.name}</span>
                                <span className="text-[10px] text-muted-foreground flex gap-1">
                                    {activeVoice.tags.map(t => <span key={t}>{t}</span>)}
                                </span>
                            </div>
                        </div>
                        <ChevronDown size={14} className="opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[280px]" align="start">
                    {MOCK_VOICES.map((voice) => (
                        <DropdownMenuItem
                            key={voice.id}
                            onClick={() => setVoice(voice.id)}
                            className="gap-3 py-3 cursor-pointer"
                        >
                            <div className={`p-1.5 rounded-md ${voice.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {voice.provider === 'local' ? <Laptop size={14} /> : <Cloud size={14} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{voice.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                    {voice.provider} • {voice.tags.join(', ')}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
