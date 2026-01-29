'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImagePlus, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRef } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

export function KeyframeControls() {
  const { startFrame, endFrame, setStartFrame, setEndFrame } = useVideoStudioStore();
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'start' | 'end',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Mock upload - in a real app, this would upload to Cloudinary/S3
    // For now, we'll use a local object URL to show it in the UI
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'start') setStartFrame(result);
      else setEndFrame(result);
      toast.success(`${type === 'start' ? 'Start' : 'End'} frame uploaded`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Start Frame */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="text-xs font-medium">Start Frame</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={12} className="text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-[11px]">
                The first frame of your video. The model will start the motion from this image.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Card className="bg-muted/20 border-border/50 group relative flex aspect-video flex-col items-center justify-center p-2">
          <input
            type="file"
            ref={startInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'start')}
          />
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
              onClick={() => startInputRef.current?.click()}
            >
              <ImagePlus size={16} />
              Upload
            </Button>
          )}
        </Card>
      </div>

      {/* End Frame */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="text-xs font-medium">End Frame (Optional)</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={12} className="text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-[11px]">
                Provide an end frame to "lock" the final composition. The model will transition from
                the start frame to this image.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Card className="bg-muted/20 border-border/50 group relative flex aspect-video flex-col items-center justify-center p-2">
          <input
            type="file"
            ref={endInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'end')}
          />
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
              onClick={() => endInputRef.current?.click()}
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
