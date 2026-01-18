'use client';

import { useVideoStudioStore, AVAILABLE_VIDEO_MODELS } from '@/lib/store/video-studio-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop, Film } from 'lucide-react';

export function VideoModelSelector() {
  const selectedModelId = useVideoStudioStore((state) => state.selectedModelId);
  const setSelectedModel = useVideoStudioStore((state) => state.setSelectedModel);
  const activeModel =
    AVAILABLE_VIDEO_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_VIDEO_MODELS[0];

  return (
    <div className="mb-6 w-full">
      <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">Generation Model</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-input bg-background/50 h-12 w-full justify-between px-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-md p-1.5 ${activeModel.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'}`}
              >
                {activeModel.provider === 'local' ? <Laptop size={16} /> : <Film size={16} />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold">{activeModel.name}</span>
                <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                  {activeModel.tier} • {activeModel.provider}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px]" align="start">
          {AVAILABLE_VIDEO_MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className="cursor-pointer gap-3 py-3"
            >
              <div
                className={`rounded-md p-1.5 ${model.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'}`}
              >
                {model.provider === 'local' ? <Laptop size={14} /> : <Film size={14} />}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {model.tier.toUpperCase()} • {model.capabilities.max_duration}s Max
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
