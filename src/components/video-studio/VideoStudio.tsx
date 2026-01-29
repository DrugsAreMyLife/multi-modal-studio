import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timeline } from './Timeline';
import { CameraControls } from './CameraControls';
import { KeyframeControls } from './KeyframeControls';
import { VideoGenerationSettings } from './VideoGenerationSettings';
import { VideoModelSelector } from './VideoModelSelector';
import { WebcamSection } from './WebcamSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Video, Clapperboard, Camera, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { useIntegrationStore } from '@/lib/integrations/store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { SlackNotifier } from '@/lib/integrations/providers';
import { Hash, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { GenerationSkeleton } from '@/components/ui/generation-skeleton';
import {
  DynamicParameterControls,
  ModelCapabilitiesBadges,
} from '@/components/shared/DynamicParameterControls';
import { getGenerationModelById } from '@/lib/models/generation-models';

import { VideoPlayer } from './VideoPlayer';
import { MotionCanvas } from './MotionCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MousePointer2 } from 'lucide-react';

export function VideoStudio() {
  const {
    selectedModelId,
    startFrame,
    endFrame,
    duration,
    camera,
    tunes,
    prompt,
    setPrompt,
    modelParams,
    setModelParam,
  } = useVideoStudioStore();
  const { getApiHeaders } = useIntegrationStore();
  const { addNotification } = useNotificationStore();
  const currentModel = getGenerationModelById(selectedModelId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [motionMask, setMotionMask] = useState<string | null>(null);
  const [motionVectors, setMotionVectors] = useState<any[]>([]);

  const handleRender = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate video');
      return;
    }

    setIsGenerating(true);
    setStatus('Initializing...');

    try {
      let provider:
        | 'runway'
        | 'luma'
        | 'replicate'
        | 'openai'
        | 'google'
        | 'kling'
        | 'pika'
        | 'haiper' = 'runway';
      if (selectedModelId.includes('luma')) provider = 'luma';
      if (selectedModelId.includes('replicate') || selectedModelId.includes('minimax'))
        provider = 'replicate';
      if (selectedModelId.includes('sora')) provider = 'openai';
      if (selectedModelId.includes('veo')) provider = 'google';
      if (selectedModelId.includes('kling')) provider = 'kling';
      if (selectedModelId.includes('pika')) provider = 'pika';
      if (selectedModelId.includes('haiper')) provider = 'haiper';

      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          prompt,
          provider,
          model: selectedModelId,
          imageUrl: startFrame || undefined,
          endImageUrl: endFrame || undefined,
          motionMask: motionMask || undefined,
          motionVectors: motionVectors.length > 0 ? motionVectors : undefined,
          duration,
          ...modelParams,
          camera,
          tunes,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to start video generation');

      setJobId(data.jobId);
      setStatus('Processing...');
      addNotification({
        title: 'Generation Started',
        description: `Video job ${data.jobId} is now in the queue.`,
        type: 'info',
      });
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setStatus(null);
      addNotification({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  // Polling for status
  useEffect(() => {
    if (!jobId || !isGenerating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/video/status?jobId=${jobId}`);
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          setIsGenerating(false);
          setJobId(null);
          setStatus(null);
          addNotification({
            title: 'Generation Complete',
            description: 'Your video is ready to view.',
            type: 'success',
          });
          if (data.result_url) setVideoUrl(data.result_url);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsGenerating(false);
          setJobId(null);
          setStatus('Failed');
          addNotification({
            title: 'Generation Failed',
            description: data.error || 'Video processing failed',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, isGenerating, addNotification]);

  const handleGenerateShareLink = async () => {
    if (!videoUrl) return;
    setIsGeneratingShare(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          content: { url: videoUrl },
          metadata: { modelId: selectedModelId },
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to generate share link');

      setShareUrl(data.url);
      navigator.clipboard.writeText(data.url);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to generate share link');
      console.error(err);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleShareToSlack = async () => {
    if (!videoUrl) return;
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
          message: `Check out my AI video generation!`,
          attachments: [videoUrl],
        }),
      });

      if (!response.ok) throw new Error('Failed to share to Slack');

      setIsShared(true);
      toast.success('Successfully shared to Slack!');
      setTimeout(() => setIsShared(false), 3000);
    } catch (err) {
      toast.error('Failed to share to Slack');
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  const slackConnected = !!useIntegrationStore.getState().connections['slack'];

  return (
    <ErrorBoundary name="Video Studio">
      <div className="flex h-full w-full flex-col">
        {/* Main Preview Area */}
        <div className="relative flex w-full flex-1">
          <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/50">
            <div className="w-full max-w-4xl px-8">
              <VideoPlayer
                url={videoUrl}
                status={status}
                isGenerating={isGenerating}
                className="shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>

          {/* Right Inspector */}
          <div className="border-border bg-background/60 z-20 flex h-full w-80 flex-col border-l backdrop-blur-xl">
            <ScrollArea className="flex-1">
              <div className="space-y-6 p-4">
                {/* Prompt Input - CRITICAL: Was missing! */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <Label className="text-xs font-semibold">Prompt</Label>
                  </div>
                  <Textarea
                    placeholder="Describe the video you want to generate..."
                    className="bg-background/50 focus-visible:ring-primary/30 min-h-[100px] resize-none border-white/5 text-sm"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </motion.div>

                <div className="bg-border h-px" />

                <VideoModelSelector />

                {/* Model Capabilities */}
                {currentModel && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-xs">Capabilities</span>
                    <ModelCapabilitiesBadges modelId={selectedModelId} />
                  </div>
                )}

                {/* Dynamic Parameters based on selected model */}
                {currentModel && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Model Settings</span>
                    </div>
                    <DynamicParameterControls
                      modelId={selectedModelId}
                      values={modelParams}
                      onChange={setModelParam}
                      excludeParams={['prompt']}
                    />
                  </motion.div>
                )}

                <div className="bg-border h-px" />

                <WebcamSection />

                <div className="bg-border h-px" />

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Clapperboard size={16} className="text-primary" />
                    <span className="text-sm font-semibold">Shot Settings</span>
                  </div>

                  <Tabs defaultValue="keyframes" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black/20">
                      <TabsTrigger value="keyframes" className="text-[10px] font-bold uppercase">
                        Keyframes
                      </TabsTrigger>
                      <TabsTrigger value="motion" className="gap-2 text-[10px] font-bold uppercase">
                        <MousePointer2 size={12} /> Brush
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="keyframes" className="pt-4">
                      <KeyframeControls />
                    </TabsContent>
                    <TabsContent value="motion" className="pt-4">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">
                            Regional Motion Guidance
                          </Label>
                          <p className="text-muted-foreground text-[10px] leading-relaxed">
                            Paint over areas where you want to <b>constrain or direct</b> primary
                            motion.
                          </p>
                        </div>
                        <MotionCanvas
                          backgroundImage={startFrame}
                          onUpdate={(mask, vectors) => {
                            setMotionMask(mask);
                            setMotionVectors(vectors);
                          }}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>

                <div className="bg-border h-px" />

                <div>
                  <span className="mb-4 block text-sm font-semibold">Camera Motion</span>
                  <CameraControls />
                </div>

                <div className="bg-border h-px" />

                <VideoGenerationSettings />

                {videoUrl && slackConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4"
                  >
                    <div className="mb-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                      <p className="mb-2 text-[10px] font-medium tracking-wider text-emerald-500/60 uppercase">
                        Distribution
                      </p>
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-[#4A154B]/20 text-[#4A154B] transition-colors hover:bg-[#4A154B] hover:text-white dark:border-[#E01E5A]/20 dark:text-[#E01E5A] dark:hover:bg-[#E01E5A]"
                        onClick={handleShareToSlack}
                        disabled={isSharing}
                      >
                        {isShared ? <Check size={14} /> : <Hash size={14} />}
                        {isSharing ? 'Sharing...' : isShared ? 'Shared!' : 'Post to Slack'}
                      </Button>

                      <Button
                        variant="ghost"
                        className="mt-2 h-8 w-full gap-2 text-[10px] opacity-60 hover:opacity-100"
                        onClick={handleGenerateShareLink}
                        disabled={isGeneratingShare}
                      >
                        <Share2 size={12} />
                        {isGeneratingShare
                          ? 'Generating...'
                          : shareUrl
                            ? 'Copy Link Again'
                            : 'Generate Share Link'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            <div className="border-border bg-background/50 border-t p-4">
              <Button
                className="shadow-primary/20 h-10 w-full gap-2 shadow-lg"
                onClick={handleRender}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video size={16} />}
                {isGenerating ? 'Rendering...' : 'Render Clip'}
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline (Fixed Height) */}
        <Timeline />
      </div>
    </ErrorBoundary>
  );
}
