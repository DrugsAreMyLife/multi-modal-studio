'use client';

import { useIconStudioStore } from '@/lib/store/icon-studio-store';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function GenerationPipeline() {
    const { pipelineSteps, isGenerating, runGeneration, resetPipeline } = useIconStudioStore();

    const activeStepIndex = pipelineSteps.findIndex(s => s.status === 'running');
    const completedSteps = pipelineSteps.filter(s => s.status === 'completed').length;
    const progressTotal = (completedSteps / pipelineSteps.length) * 100;

    return (
        <div className="p-8 max-w-4xl mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold">Generation Pipeline</h2>
                    <p className="text-muted-foreground">8-Pass System Engineering Simulation</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetPipeline} disabled={isGenerating}>
                        <RotateCcw size={16} className="mr-2" /> Reset
                    </Button>
                    <Button onClick={runGeneration} disabled={isGenerating} className="min-w-[140px]">
                        {isGenerating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Play size={16} className="mr-2" />}
                        {isGenerating ? 'Processing...' : 'Run Pipeline'}
                    </Button>
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-8 flex-1 flex flex-col gap-6 relative overflow-hidden">
                {/* Global Progress */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressTotal}%` }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 flex-1">
                    {pipelineSteps.map((step, idx) => {
                        const isActive = step.status === 'running';
                        const isDone = step.status === 'completed';
                        const isPending = step.status === 'pending';

                        return (
                            <div key={step.id} className={cn("relative pl-8 transition-opacity duration-500", isPending && "opacity-40")}>
                                {/* Connector Line */}
                                {idx < pipelineSteps.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-[-32px] w-px bg-white/10 md:block hidden" />
                                )}

                                {/* Status Icon */}
                                <div className={cn(
                                    "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 bg-background",
                                    isActive ? "border-primary text-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" :
                                        isDone ? "border-emerald-500 bg-emerald-500/20 text-emerald-500" : "border-white/20 text-muted-foreground"
                                )}>
                                    {isActive ? <Loader2 size={12} className="animate-spin" /> :
                                        isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className={cn("font-medium", isActive && "text-primary")}>{step.name}</h4>
                                        <span className="text-xs font-mono opacity-70">{step.progress}%</span>
                                    </div>
                                    <Progress value={step.progress} className="h-1.5" />
                                    <div className="h-6 text-xs font-mono text-muted-foreground truncate">
                                        {isActive ? 'Processing logic nodes...' : isDone ? 'Pass successful.' : 'Waiting...'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
