import { useState } from 'react';
import { ModelRouter } from './ModelRouter';
import { GenerationSettings } from './GenerationSettings';
import { UnifiedCanvas } from './UnifiedCanvas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2 } from 'lucide-react';

export function ImageStudio() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        // Simulate generation
        setTimeout(() => {
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <div className="flex h-full w-full">
            {/* Main Canvas Area */}
            <div className="flex-1 relative z-10">
                <UnifiedCanvas />
            </div>

            {/* Right Inspector */}
            <div className="w-80 border-l border-border bg-background/60 backdrop-blur-xl flex flex-col h-full z-20">
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <div className="space-y-2">
                            <Label>Prompt</Label>
                            <Textarea
                                placeholder="Describe your image..."
                                className="min-h-[120px] resize-none bg-background/50"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>

                        <ModelRouter />
                        <GenerationSettings />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-border bg-background/50">
                    <Button
                        className="w-full gap-2 h-10 shadow-lg shadow-primary/20"
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                    >
                        <Wand2 size={16} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
