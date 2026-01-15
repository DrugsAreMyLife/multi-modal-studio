'use client';

import { useVideoStudioStore, AVAILABLE_VIDEO_MODELS } from '@/lib/store/video-studio-store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Cloud, Laptop, Film } from 'lucide-react';

export function VideoModelSelector() {
    const selectedModelId = useVideoStudioStore(state => state.selectedModelId);
    const setSelectedModel = useVideoStudioStore(state => state.setSelectedModel);
    const activeModel = AVAILABLE_VIDEO_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_VIDEO_MODELS[0];

    return (
        <div className="w-full mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Generation Model</div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-12 px-3 border-input bg-background/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${activeModel.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                {activeModel.provider === 'local' ? <Laptop size={16} /> : <Film size={16} />}
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-sm font-semibold">{activeModel.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{activeModel.tier} • {activeModel.provider}</span>
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
                            className="gap-3 py-3 cursor-pointer"
                        >
                            <div className={`p-1.5 rounded-md ${model.provider === 'local' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                {model.provider === 'local' ? <Laptop size={14} /> : <Film size={14} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-[10px] text-muted-foreground">
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
