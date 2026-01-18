'use client';

import { useImageStudioStore, AVAILABLE_MODELS } from '@/lib/store/image-studio-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop } from 'lucide-react';

export function ModelRouter() {
  const { selectedModelId, setModel } = useImageStudioStore();

  const activeModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
    <div className="w-full">
      <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">Active Model</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-input bg-background/50 h-12 w-full justify-between px-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-md p-1.5 ${activeModel.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}
              >
                {activeModel.provider === 'local' ? <Laptop size={16} /> : <Cloud size={16} />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold">{activeModel.name}</span>
                <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                  {activeModel.provider}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className="opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[280px]" align="start">
          {AVAILABLE_MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => setModel(model.id)}
              className="cursor-pointer gap-3 py-3"
            >
              <div
                className={`rounded-md p-1.5 ${model.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}
              >
                {model.provider === 'local' ? <Laptop size={14} /> : <Cloud size={14} />}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {model.provider === 'local' ? 'Running on Local GPU' : 'Cloud Service'}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
