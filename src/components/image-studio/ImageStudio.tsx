import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModelRouter } from './ModelRouter';
import { GenerationSettings } from './GenerationSettings';
import { UnifiedCanvas } from './UnifiedCanvas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2, AlertCircle, Share2 } from 'lucide-react';
import { useImageStudioStore } from '@/lib/store/image-studio-store';
import { useIntegrationStore } from '@/lib/integrations/store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SlackNotifier } from '@/lib/integrations/providers';
import { Hash, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { GenerationSkeleton } from '@/components/ui/generation-skeleton';
import { CostOptimizerAlert } from '@/components/ui/CostOptimizerAlert';
import { useStyleDNAStore } from '@/lib/store/style-dna-store';
import { dnaToPrompt } from '@/lib/style/style-dna';
import { StyleDNABuilder } from '@/components/icon-studio/StyleDNABuilder';
import { useAnalyticsStore } from '@/lib/store/analytics-store';
import { calculateCost } from '@/lib/utils/cost-estimation';
import {
  DynamicParameterControls,
  ModelCapabilitiesBadges,
} from '@/components/shared/DynamicParameterControls';
import { getGenerationModelById } from '@/lib/models/generation-models';

export function ImageStudio() {
  const { selectedModelId, settings, modelParams, setModelParam } = useImageStudioStore();
  const { activeDNA } = useStyleDNAStore();
  const { getApiHeaders } = useIntegrationStore();
  const currentModel = getGenerationModelById(selectedModelId);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      // Find the provider for the selected model
      // For now, mapping simplified: sdxl-turbo -> stability, dall-e-3 -> openai, etc.
      let provider: 'openai' | 'stability' | 'replicate' = 'openai';
      if (selectedModelId.includes('sdxl') || selectedModelId.includes('stability'))
        provider = 'stability';
      if (selectedModelId.includes('replicate') || selectedModelId.includes('flux'))
        provider = 'replicate';

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          prompt: activeDNA ? `${prompt}, ${dnaToPrompt(activeDNA)}` : prompt,
          provider,
          model: selectedModelId,
          width: settings.width,
          height: settings.height,
          numImages: modelParams.n || 1,
          ...modelParams,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      // If jobId is returned, poll for completion
      if (data.jobId) {
        let status = data.status || 'pending';
        let imageUrl = null;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout

        while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;

          const statusRes = await fetch(`/api/generate/image/status?jobId=${data.jobId}`, {
            headers: getApiHeaders(),
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            status = statusData.status;
            if (status === 'completed') {
              imageUrl = statusData.result_url;
            } else if (status === 'failed') {
              throw new Error(statusData.error || 'Generation failed');
            }
          }
        }

        if (status === 'completed' && imageUrl) {
          setGeneratedImage(imageUrl);
          // Log usage to store for forecasting
          const costCents = calculateCost(selectedModelId, prompt.length, 500); // 500 as mock output length for image
          useAnalyticsStore.getState().trackUsage({
            provider: provider,
            model: selectedModelId,
            endpoint: '/api/generate/image',
            tokensIn: prompt.length,
            tokensOut: 500,
            costCents,
            success: true,
          });
        } else if (attempts >= maxAttempts) {
          throw new Error('Generation timed out');
        }
      } else if (data.images && data.images.length > 0) {
        setGeneratedImage(data.images[0].url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInpaint = async (image: string, mask: string) => {
    if (!prompt.trim()) {
      setError('Please provide a prompt for inpainting');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let provider: 'openai' | 'stability' = 'stability'; // Default to Stability for inpaint
      if (selectedModelId.includes('dall-e')) provider = 'openai';

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(),
        },
        body: JSON.stringify({
          prompt,
          provider,
          model: selectedModelId,
          image,
          mask,
          width: settings.width,
          height: settings.height,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Inpainting failed');

      if (data.images && data.images.length > 0) {
        setGeneratedImage(data.images[0].url);
        // Log usage to store
        const costCents = calculateCost(selectedModelId, prompt.length, 500);
        useAnalyticsStore.getState().trackUsage({
          provider: provider,
          model: selectedModelId,
          endpoint: '/api/generate/image',
          tokensIn: prompt.length,
          tokensOut: 500,
          costCents,
          success: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };
  const handleGenerateShareLink = async () => {
    if (!generatedImage) return;
    setIsGeneratingShare(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          content: { url: generatedImage },
          metadata: { prompt },
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
    if (!generatedImage) return;
    setIsSharing(true);
    try {
      const notifier = new SlackNotifier();
      // We pass headers explicitly since the helper in providers.ts uses fetch
      const headers = getApiHeaders();

      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          service: 'slack',
          message: `Generated with Multi-Modal Studio: "${prompt}"`,
          attachments: [generatedImage],
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
    <ErrorBoundary name="Image Studio">
      <div className="flex h-full w-full">
        {/* Main Canvas Area */}
        <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden bg-black/5 p-12">
          {isGenerating ? (
            <GenerationSkeleton type="image" className="w-full max-w-xl" />
          ) : (
            <UnifiedCanvas initialImage={generatedImage || undefined} onInpaint={handleInpaint} />
          )}
        </div>

        {/* Right Inspector */}
        <div className="border-border bg-background/60 z-20 flex h-full w-80 flex-col border-l backdrop-blur-xl">
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert
                      variant="destructive"
                      className="border-red-500/20 bg-red-500/10 text-red-500"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between gap-2 overflow-hidden text-xs">
                        <span className="truncate">{error}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] hover:bg-red-500/20"
                          onClick={handleGenerate}
                        >
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <Label>Prompt</Label>
                <Textarea
                  placeholder="Describe your image..."
                  className="bg-background/50 focus-visible:ring-primary/30 min-h-[120px] resize-none border-white/5"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </motion.div>

              <ModelRouter />

              {/* Model Capabilities */}
              {currentModel && (
                <div className="space-y-2">
                  <span className="text-muted-foreground text-xs">Capabilities</span>
                  <ModelCapabilitiesBadges modelId={selectedModelId} />
                </div>
              )}

              {/* Dynamic Parameters based on selected model */}
              {currentModel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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

              <GenerationSettings />
              <StyleDNABuilder />

              {generatedImage && slackConnected && (
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

          <div className="border-border bg-background/50 space-y-3 border-t p-4">
            <CostOptimizerAlert
              modelId={selectedModelId}
              onApply={(optimizedId) => {
                useImageStudioStore.getState().setModel(optimizedId);
                toast.success(`Optimized to ${optimizedId}!`);
              }}
            />
            <Button
              className="shadow-primary/20 h-10 w-full gap-2 shadow-lg"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              <Wand2 size={16} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
