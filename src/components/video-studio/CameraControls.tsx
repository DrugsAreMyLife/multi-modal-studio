'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export function CameraControls() {
  const { camera, updateCamera } = useVideoStudioStore();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between">
          <Label className="text-xs">Zoom</Label>
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
          <Label className="text-xs">Pan X</Label>
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
          <Label className="text-xs">Pan Y</Label>
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
