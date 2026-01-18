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
import { Video, Clapperboard, Camera, Loader2, AlertCircle } from 'lucide-react';
import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { useIntegrationStore } from '@/lib/integrations/store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { SlackNotifier } from '@/lib/integrations/providers';
import { Hash, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { GenerationSkeleton } from '@/components/ui/generation-skeleton';

export function VideoStudio() {
  const { selectedModelId, startFrame, duration, camera, tunes } = useVideoStudioStore();
  const { getApiHeaders } = useIntegrationStore();
  const { addNotification } = useNotificationStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  const handleRender = async () => {
    setIsGenerating(true);
    setStatus('Initializing...');

    try {
      let provider: 'runway' | 'luma' | 'replicate' = 'runway';
      if (selectedModelId.includes('luma')) provider = 'luma';
      if (selectedModelId.includes('replicate') || selectedModelId.includes('minimax'))
        provider = 'replicate';

      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          prompt: 'Advanced cinematic shot', // Fallback if no prompt found in store
          provider,
          imageUrl: startFrame || undefined,
          duration,
          // camera and tunes would be passed here if supported by the provider adapter
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
          <div className="flex flex-1 items-center justify-center bg-black/50">
            {isGenerating ? (
              <div className="w-[80%] max-w-3xl">
                <GenerationSkeleton type="video" />
              </div>
            ) : (
              <div className="relative flex aspect-video w-[80%] max-w-3xl items-center justify-center rounded-lg border border-white/10 bg-black shadow-2xl">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Video size={24} />
                  {status ? `Status: ${status}` : 'Preview Player'}
                </span>
              </div>
            )}
          </div>

          {/* Right Inspector */}
          <div className="border-border bg-background/60 z-20 flex h-full w-80 flex-col border-l backdrop-blur-xl">
            <ScrollArea className="flex-1">
              <div className="space-y-8 p-4">
                <WebcamSection />

                <div className="bg-border h-px" />

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <VideoModelSelector />
                  <div className="mb-4 flex items-center gap-2">
                    <Clapperboard size={16} className="text-primary" />
                    <span className="text-sm font-semibold">Shot Settings</span>
                  </div>
                  <KeyframeControls />
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
                disabled={isGenerating}
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
