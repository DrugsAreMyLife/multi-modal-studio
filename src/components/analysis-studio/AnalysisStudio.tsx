'use client';

import { useState } from 'react';
import { useAnalysisStudioStore } from '@/lib/store/analysis-studio-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import { SUPPORTED_MODELS } from '@/lib/models/supported-models';

const Mermaid = dynamic(() => import('@/components/shared/Mermaid').then((mod) => mod.Mermaid), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-white/5" />,
});
import { Play, FileText, Activity, Trash2, ExternalLink, Share2, Hash, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import { useIntegrationStore } from '@/lib/integrations/store';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { GenerationSkeleton } from '@/components/ui/generation-skeleton';

export function AnalysisStudio() {
  const { history, activeAnalysisId, templates, addAnalysis, setActiveAnalysis, removeAnalysis } =
    useAnalysisStudioStore();
  const { getApiHeaders } = useIntegrationStore();
  const [url, setUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [selectedModelIdx, setSelectedModelIdx] = useState('2'); // Default to Gemini (Index 2 in list)
  const [customGoal, setCustomGoal] = useState('');

  const activeRecord = history.find((h) => h.id === activeAnalysisId);

  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return;
    const modelConfig = SUPPORTED_MODELS[parseInt(selectedModelIdx)];
    await addAnalysis(url, selectedTemplate, customGoal, {
      providerId: modelConfig.providerId,
      modelId: modelConfig.modelId,
    });
    setUrl('');
    setCustomGoal('');
  };

  const handleShareToSlack = async () => {
    if (!activeRecord?.result) return;
    setIsSharing(true);
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          service: 'slack',
          message: `Technical Analysis for ${activeRecord.videoTitle || activeRecord.url}`,
          attachments: [],
        }),
      });
      if (!response.ok) throw new Error('Failed to share to Slack');
      setIsShared(true);
      toast.success('Analysis shared to Slack!');
      setTimeout(() => setIsShared(false), 3000);
    } catch (err) {
      toast.error('Failed to share to Slack');
    } finally {
      setIsSharing(false);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!activeRecord?.result) return;
    setIsGeneratingShare(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analysis',
          content: activeRecord.result,
          metadata: { videoTitle: activeRecord.videoTitle, url: activeRecord.url },
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to generate share link');
      setShareUrl(data.url);
      navigator.clipboard.writeText(data.url);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to generate share link');
    } finally {
      setIsGeneratingShare(false);
    }
  };

  return (
    <ErrorBoundary name="Analysis Studio">
      <div className="bg-background text-foreground flex h-full">
        {/* Sidebar / History */}
        <div className="border-border flex w-80 flex-col border-r">
          <div className="p-4">
            <h2 className="mb-4 text-sm font-semibold tracking-tight">Technical Link History</h2>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-2">
                {history.length === 0 && (
                  <div className="text-muted-foreground/50 py-10 text-center text-xs italic">
                    No videos analyzed yet.
                  </div>
                )}
                {history.map((record) => (
                  <div
                    key={record.id}
                    className={cn(
                      'group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all duration-300',
                      activeAnalysisId === record.id
                        ? 'border-primary/50 bg-primary/10 shadow-primary/5 shadow-lg'
                        : 'border-white/5 hover:border-white/20 hover:bg-white/5',
                    )}
                    onClick={() => setActiveAnalysis(record.id)}
                  >
                    <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-white/5 bg-black/40">
                      {record.thumbnailUrl ? (
                        <Image
                          src={record.thumbnailUrl}
                          alt={record.videoTitle || 'Thumbnail'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Play size={16} className="text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-semibold tracking-tight text-white/90">
                        {record.videoTitle || record.url}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[10px] font-medium tracking-widest uppercase opacity-60">
                        {record.templateId.split('-').join(' ')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAnalysis(record.id);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-red-500/0 p-1.5 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex flex-1 flex-col">
          {/* Top Bar (URL Entry) */}
          <div className="border-border flex h-16 items-center border-b px-6 shadow-sm shadow-black/20">
            <div className="flex flex-1 items-center gap-4">
              <Input
                placeholder="Paste technical video URL (YouTube, Vimeo, etc.)"
                className="bg-background h-10 flex-1 border-white/10 !ring-0"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-[180px] border-white/10">
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedModelIdx} onValueChange={setSelectedModelIdx}>
                <SelectTrigger className="w-[160px] border-white/10">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_MODELS.map((m, i) => (
                    <SelectItem key={m.modelId} value={i.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="shadow-primary/20 h-10 px-6 font-bold shadow-lg"
                onClick={handleAnalyze}
              >
                Start Technical Audit
              </Button>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-auto bg-[#0a0a0a]">
            {activeRecord ? (
              <div className="mx-auto max-w-5xl p-8">
                {/* Custom Goal Input */}
                <div className="mb-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        {activeRecord.videoTitle || 'Analysis Workspace'}
                      </h2>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Analyzing video for{' '}
                        <span className="text-primary">{activeRecord.templateId}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1">
                      <Activity size={12} className="animate-pulse text-emerald-500" />
                      <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                        Live Agent Active
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask the system to extract specific software nuances (e.g. 'Extract only the landing page animations')"
                      className="bg-background/40 min-h-[60px] border-white/5"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAnalyze())
                      }
                    />
                  </div>
                </div>

                {activeRecord.result ? (
                  <div className="animate-in slide-in-from-bottom-5 space-y-6 duration-500">
                    <div className="flex gap-4">
                      <Card className="flex-1 border-white/10 bg-white/5">
                        <CardContent className="space-y-2 p-4">
                          <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <FileText size={16} className="text-blue-400" />
                            Technical Analysis & PRD
                          </h3>
                          <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {activeRecord.result.summary}
                          </div>

                          <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-2 border-white/10"
                              onClick={handleGenerateShareLink}
                              disabled={isGeneratingShare}
                            >
                              <Share2 size={12} />
                              {shareUrl ? 'Link Copied' : 'Share Link'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-2 border-white/10"
                              onClick={handleShareToSlack}
                              disabled={isSharing}
                            >
                              {isShared ? <Check size={12} /> : <Hash size={12} />}
                              {isSharing ? 'Sharing...' : 'Slack'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Diagrams */}
                    {activeRecord.result.diagrams?.map((diag, i) => (
                      <div key={i} className="space-y-2">
                        <h4 className="text-muted-foreground px-1 text-sm font-medium tracking-wider uppercase opacity-50">
                          Flow Diagram {i + 1}
                        </h4>
                        <div className="rounded-xl border border-white/5 bg-black/20 p-6">
                          <Mermaid chart={diag} />
                        </div>
                      </div>
                    ))}

                    {/* Nuances List */}
                    {activeRecord.result.nuances && activeRecord.result.nuances.length > 0 && (
                      <div className="space-y-3 pb-10">
                        <h4 className="text-muted-foreground px-1 text-xs font-medium tracking-wider uppercase opacity-50">
                          Extracted Architecture Nuances
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {activeRecord.result.nuances.map((nuance, i) => (
                            <div
                              key={i}
                              className="border-primary/20 hover:border-primary/40 group flex items-start gap-4 rounded-xl border bg-black/40 p-4 transition-all duration-300"
                            >
                              <span className="text-primary/40 group-hover:text-primary/60 pt-1 font-mono text-xs leading-none font-bold">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="text-sm leading-snug text-zinc-300">{nuance}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center py-20 text-center">
                    <GenerationSkeleton type="text" className="w-full" />
                    <p className="text-muted-foreground mt-8 animate-pulse font-mono text-[10px] tracking-widest uppercase opacity-60">
                      Deconstructing technical architecture...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/5 bg-white/5">
                    <Activity size={32} className="text-zinc-700" />
                  </div>
                  <h3 className="font-semibold tracking-tight text-zinc-500">Ready for analysis</h3>
                  <p className="max-w-[240px] text-xs leading-relaxed text-zinc-700">
                    Paste a link to a software demo or technical video to start extracting PRD-ready
                    nuances.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
