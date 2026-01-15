'use client';

import { useState } from 'react';

import { useAudioStudioStore } from '@/lib/store/audio-studio-store';
import { WaveformCanvas } from './WaveformCanvas';
import { VoiceSelector } from './VoiceSelector';
import { AudioControls } from './AudioControls';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Composer } from './daw/Composer';
import { Play, Mic, Download, Music as MusicIcon, AudioLines, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AudioStudio() {
    const {
        mode,
        prompt,
        setPrompt,
        isPlaying,
        setIsPlaying,
        addClip,
        clips
    } = useAudioStudioStore();

    const [viewMode, setViewMode] = useState<'generate' | 'compose'>('generate');

    const handleGenerate = () => {
        setIsPlaying(true);
        setTimeout(() => {
            setIsPlaying(false);
            // Add mock clip
            addClip({
                url: 'mock_url',
                waveform: [],
                duration: 5,
                prompt: prompt || 'Untitled Audio',
                mode: mode,
                settings: {}
            });
        }, 3000);
    };

    const activeClips = Object.values(clips).sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="flex flex-col h-full w-full">
            {/* Top Toggle Bar */}
            <div className="h-10 border-b border-border bg-background/50 flex items-center justify-center gap-2 p-1">
                <div className="bg-black/20 p-1 rounded-lg flex gap-1">
                    <Button
                        variant={viewMode === 'generate' ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-xs gap-2"
                        onClick={() => setViewMode('generate')}
                    >
                        <MusicIcon size={12} /> Generator
                    </Button>
                    <Button
                        variant={viewMode === 'compose' ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-xs gap-2"
                        onClick={() => setViewMode('compose')}
                    >
                        <LayoutList size={12} /> Composer
                    </Button>
                </div>
            </div>

            {/* Main Workspace (Split View) */}
            <div className="flex-1 flex min-h-0 relative">
                {viewMode === 'compose' ? (
                    <div className="absolute inset-0 p-4">
                        <Composer />
                    </div>
                ) : (
                    <div className="flex-1 flex min-h-0">
                        {/* Center visualizer & history */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Top: Visualizer */}
                            <div className="h-64 bg-black/40 border-b border-white/5 relative flex items-center justify-center p-8 overflow-hidden">
                                <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-background to-background" />
                                <WaveformCanvas isPlaying={isPlaying} />

                                {/* Overlay Controls */}
                                {!isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Button size="lg" className="rounded-full w-16 h-16 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform" onClick={() => setIsPlaying(true)}>
                                            <Play size={24} className="ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Bottom: Clip Grid */}
                            <div className="flex-1 bg-background/20 p-6 overflow-hidden flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <AudioLines size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium">Generation History</span>
                                </div>

                                <div className="overflow-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activeClips.length === 0 && (
                                        <div className="col-span-full h-32 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-lg">
                                            <MusicIcon size={24} className="mb-2 opacity-50" />
                                            <span className="text-xs">No audio generated yet</span>
                                        </div>
                                    )}

                                    {activeClips.map((clip) => (
                                        <div key={clip.id} className="bg-background/40 border border-white/5 rounded-lg p-3 hover:border-primary/30 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-medium line-clamp-1">{clip.prompt}</span>
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white/5 px-1 rounded">{clip.mode}</span>
                                            </div>
                                            <div className="h-12 bg-black/20 rounded mb-2 relative overflow-hidden">
                                                {/* Mini waveform mock */}
                                                <div className="absolute inset-x-0 bottom-0 h-full flex items-end justify-between px-1 pb-1 gap-px opacity-50">
                                                    {Array.from({ length: 20 }).map((_, i) => (
                                                        <div key={i} className="flex-1 bg-primary" style={{ height: `${Math.random() * 80 + 20}%` }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-muted-foreground">{new Date(clip.createdAt).toLocaleTimeString()}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Play size={10} /></Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Download size={10} /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Inspector */}
                        <div className="w-80 border-l border-border bg-background/60 backdrop-blur-xl flex flex-col z-20">
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-6">
                                    <VoiceSelector />

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium px-1">Prompt</label>
                                        <Textarea
                                            placeholder={mode === 'music' ? "Lo-fi hip hop beat..." : "Enter text to speak..."}
                                            className="min-h-[100px] resize-none bg-background/50 text-sm"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                        />
                                    </div>

                                    <div className="h-px bg-border my-2" />

                                    <AudioControls />
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-border bg-background/50">
                                <Button
                                    className="w-full gap-2 h-10 shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0"
                                    onClick={handleGenerate}
                                    disabled={isPlaying}
                                >
                                    {isPlaying ? (
                                        <>Running...</>
                                    ) : (
                                        <>
                                            <Mic size={16} />
                                            Generate Audio
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
