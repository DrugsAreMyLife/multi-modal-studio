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
        <Card className="bg-muted/20 border-border/50 group relative flex aspect-video flex-col items-center justify-center p-2">
          {startFrame ? (
            <>
              <img src={startFrame} alt="Start" className="h-full w-full rounded-md object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => setStartFrame(null)}
              >
                <X size={12} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-full w-full gap-2"
            >
              <ImagePlus size={16} />
              Upload
            </Button>
          )}
        </Card>
      </div>

      {/* End Frame */}
      <div className="space-y-2">
        <div className="text-xs font-medium">End Frame (Optional)</div>
        <Card className="bg-muted/20 border-border/50 group relative flex aspect-video flex-col items-center justify-center p-2">
          {endFrame ? (
            <>
              <img src={endFrame} alt="End" className="h-full w-full rounded-md object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => setEndFrame(null)}
              >
                <X size={12} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-full w-full gap-2"
            >
              <ImagePlus size={16} />
              Upload
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
