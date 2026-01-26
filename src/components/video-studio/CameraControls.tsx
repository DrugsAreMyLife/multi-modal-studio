'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export function CameraControls() {
  const { camera, updateCamera } = useVideoStudioStore();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Zoom</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[11px]">
                  Positive values zoom in, negative values zoom out. Recreating camera travel along
                  the Z-axis.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-muted-foreground text-xs">{camera.zoom.toFixed(1)}</span>
        </div>
        <Slider
          value={[camera.zoom]}
          min={-1}
          max={1}
          step={0.1}
          onValueChange={([val]) => updateCamera({ zoom: val })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Pan X</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[11px]">
                  Pans the camera horizontally (left and right).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-muted-foreground text-xs">{camera.pan.x.toFixed(1)}</span>
        </div>
        <Slider
          value={[camera.pan.x]}
          min={-1}
          max={1}
          step={0.1}
          onValueChange={([val]) => updateCamera({ pan: { ...camera.pan, x: val } })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs">Pan Y</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={12} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-[11px]">
                  Pans the camera vertically (up and down).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-muted-foreground text-xs">{camera.pan.y.toFixed(1)}</span>
        </div>
        <Slider
          value={[camera.pan.y]}
          min={-1}
          max={1}
          step={0.1}
          onValueChange={([val]) => updateCamera({ pan: { ...camera.pan, y: val } })}
        />
      </div>
    </div>
  );
}
