'use client';

import { Timeline } from './Timeline';
import { CameraControls } from './CameraControls';
import { KeyframeControls } from './KeyframeControls';
import { VideoGenerationSettings } from './VideoGenerationSettings';
import { VideoModelSelector } from './VideoModelSelector';
import { WebcamSection } from './WebcamSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Video, Clapperboard, Camera } from 'lucide-react';

export function VideoStudio() {
    return (
        <div className="flex flex-col h-full w-full">
            {/* Main Preview Area */}
            <div className="flex-1 flex w-full relative">
                <div className="flex-1 bg-black/50 flex items-center justify-center">
                    <div className="aspect-video w-[80%] max-w-3xl bg-black border border-white/10 shadow-2xl rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground flex gap-2 items-center">
                            <Video size={24} />
                            Preview Player
                        </span>
                    </div>
                </div>

                {/* Right Inspector */}
                <div className="w-80 border-l border-border bg-background/60 backdrop-blur-xl flex flex-col h-full z-20">
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-8">
                            <WebcamSection />

                            <div className="h-px bg-border" />

                            <div>
                                <VideoModelSelector />
                                <div className="flex items-center gap-2 mb-4">
                                    <Clapperboard size={16} className="text-primary" />
                                    <span className="font-semibold text-sm">Shot Settings</span>
                                </div>
                                <KeyframeControls />
                            </div>

                            <div className="h-px bg-border" />

                            <div>
                                <span className="font-semibold text-sm mb-4 block">Camera Motion</span>
                                <CameraControls />
                            </div>

                            <div className="h-px bg-border" />

                            <VideoGenerationSettings />
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-border bg-background/50">
                        <Button className="w-full gap-2 h-10 shadow-lg shadow-primary/20">
                            <Video size={16} />
                            Render Clip
                        </Button>
                    </div>
                </div>
            </div>

            {/* Timeline (Fixed Height) */}
            <Timeline />
        </div>
    );
}
