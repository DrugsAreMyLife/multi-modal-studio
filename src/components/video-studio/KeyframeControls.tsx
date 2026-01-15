'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImagePlus, X } from 'lucide-react';
import Image from 'next/image';

export function KeyframeControls() {
    const { startFrame, endFrame, setStartFrame, setEndFrame } = useVideoStudioStore();

    return (
        <div className="space-y-4">
            {/* Start Frame */}
            <div className="space-y-2">
                <div className="text-xs font-medium">Start Frame</div>
                <Card className="aspect-video relative bg-muted/20 border-border/50 flex flex-col items-center justify-center p-2 group">
                    {startFrame ? (
                        <>
                            <img src={startFrame} alt="Start" className="w-full h-full object-cover rounded-md" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setStartFrame(null)}
                            >
                                <X size={12} />
                            </Button>
                        </>
                    ) : (
                        <Button variant="ghost" className="h-full w-full gap-2 text-muted-foreground hover:text-foreground">
                            <ImagePlus size={16} />
                            Upload
                        </Button>
                    )}
                </Card>
            </div>

            {/* End Frame */}
            <div className="space-y-2">
                <div className="text-xs font-medium">End Frame (Optional)</div>
                <Card className="aspect-video relative bg-muted/20 border-border/50 flex flex-col items-center justify-center p-2 group">
                    {endFrame ? (
                        <>
                            <img src={endFrame} alt="End" className="w-full h-full object-cover rounded-md" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setEndFrame(null)}
                            >
                                <X size={12} />
                            </Button>
                        </>
                    ) : (
                        <Button variant="ghost" className="h-full w-full gap-2 text-muted-foreground hover:text-foreground">
                            <ImagePlus size={16} />
                            Upload
                        </Button>
                    )}
                </Card>
            </div>
        </div>
    );
}
