'use client';

import { useState } from 'react';
import { useAnalysisStudioStore } from '@/lib/store/analysis-studio-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Mermaid } from '@/components/shared/Mermaid';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';
import { Play, FileText, Activity, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function AnalysisStudio() {
    const { history, activeAnalysisId, templates, addAnalysis, setActiveAnalysis, removeAnalysis } = useAnalysisStudioStore();
    const [url, setUrl] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
    const [selectedModelIdx, setSelectedModelIdx] = useState('2'); // Default to Gemini (Index 2 in list)
    const [customGoal, setCustomGoal] = useState('');

    const activeRecord = history.find(h => h.id === activeAnalysisId);

    const handleAnalyze = async () => {
        if (!url) return;
        const modelConfig = SUPPORTED_MODELS[parseInt(selectedModelIdx)];
        await addAnalysis(url, selectedTemplate, customGoal, {
            providerId: modelConfig.providerId,
            modelId: modelConfig.modelId
        });
        setUrl('');
        setCustomGoal('');
    };

    return (
        <div className="flex h-full bg-background text-foreground">
            {/* Sidebar / History */}
            <div className="w-80 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Activity className="text-primary" />
                        Analysis History
                    </h2>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                        {history.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-10">
                                No analyses yet.
                            </div>
                        )}
                        {history.map(record => (
                            <div
                                key={record.id}
                                onClick={() => setActiveAnalysis(record.id)}
                                className={cn(
                                    "group cursor-pointer rounded-lg border border-transparent p-3 transition-all hover:bg-muted/50",
                                    activeAnalysisId === record.id ? "bg-muted border-border" : ""
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className="w-16 h-12 bg-black/40 rounded flex flex-col items-center justify-center shrink-0 overflow-hidden relative">
                                        {/* Thumbnail or Icon */}
                                        {record.thumbnailUrl && !record.thumbnailUrl.includes('google') ? (
                                            <Image
                                                src={record.thumbnailUrl}
                                                alt="Thumb"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <Play size={16} className="text-muted-foreground/50" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{record.videoTitle || record.url}</div>
                                        <div className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                record.status === 'completed' ? "bg-green-500" :
                                                    record.status === 'processing' ? "bg-yellow-500 animate-pulse" : "bg-gray-500"
                                            )} />
                                            {record.status}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeAnalysis(record.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-muted-foreground transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Input Area */}
                <div className="p-6 border-b border-border bg-card/20 backdrop-blur-sm z-10">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Paste video URL (YouTube, Loom, etc.)"
                                className="flex-1"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                            <Select value={selectedModelIdx} onValueChange={setSelectedModelIdx}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUPPORTED_MODELS.map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                            <span className="flex items-center gap-2">
                                                <span className="font-semibold capitalize">{m.providerId}</span>
                                                <span className="text-muted-foreground text-xs">{m.name}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button onClick={handleAnalyze} size="default" className="bg-primary text-primary-foreground font-semibold px-6 shadow-glow">
                                Analyze Video
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Analysis Template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <span className="font-medium">{t.name}</span>
                                            <span className="ml-2 text-muted-foreground text-xs opacity-50 truncate max-w-[200px]">
                                                - {t.description}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Custom Goal (e.g. 'Focus on the login modal animation')"
                                value={customGoal}
                                onChange={(e) => setCustomGoal(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Analysis View */}
                <div className="flex-1 overflow-hidden relative">
                    {activeRecord ? (
                        <div className="h-full flex flex-col md:flex-row">
                            {/* Left: Video & Summary */}
                            <ScrollArea className="flex-1 p-6">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Video Placeholder */}
                                    <div className="aspect-video bg-black rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                        <iframe
                                            src={activeRecord.url.replace('watch?v=', 'embed/')}
                                            className="w-full h-full opacity-50 group-hover:opacity-100 transition-opacity"
                                            title="Video Preview"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            {!activeRecord.result && (
                                                <div className="bg-black/80 px-4 py-2 rounded-full text-xs font-mono text-primary animate-pulse border border-primary/20">
                                                    Analyzing Frames...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Result */}
                                    {activeRecord.result ? (
                                        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                                            <div className="flex gap-4">
                                                <Card className="flex-1 bg-white/5 border-white/10">
                                                    <CardContent className="p-4 space-y-2">
                                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                                            <FileText size={16} className="text-blue-400" />
                                                            Executive Summary
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {activeRecord.result.summary}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Diagrams */}
                                            {activeRecord.result.diagrams?.map((diag, i) => (
                                                <div key={i} className="space-y-2">
                                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Flow Diagram {i + 1}</h4>
                                                    <Mermaid chart={diag} />
                                                </div>
                                            ))}

                                            {/* Nuances List */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Extracted Details (Black & White Specificity)</h4>
                                                <ul className="grid grid-cols-1 gap-2">
                                                    {activeRecord.result.nuances.map((nuance, i) => (
                                                        <li key={i} className="bg-black/20 px-3 py-2 rounded border-l-2 border-primary text-sm flex gap-3 items-start">
                                                            <span className="text-primary/50 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                                            {nuance}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 text-muted-foreground/50">
                                            Thinking about software nuances...
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Select a video from history or start a new analysis.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
