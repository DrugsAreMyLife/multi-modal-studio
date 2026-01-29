'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  BookOpen,
  Sparkles,
  Stethoscope,
  FlaskConical,
  PenTool,
  Mic2,
  RefreshCcw,
  CheckCircle2,
  FileText,
  Clock,
  Zap,
  GraduationCap,
  MessageCircle,
  Dna,
  Share2,
  ListRestart,
  Info,
  Activity,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SemanticConstraint } from '@/lib/orchestration/SemanticProcessor';
import { PreprocessingRepo } from '@/lib/orchestration/PreprocessingRepo';
import { getSemanticLLMProvider } from '@/lib/llm/semantic-llm-provider';

interface GenerateScriptRequest {
  tone: number;
  complexity: number;
}

interface SemanticAnalyzeResponse {
  constraints: SemanticConstraint[];
  intent?: {
    domain: string;
    operation: string;
    confidence: number;
  };
}

export function LexiconStudio() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tone, setTone] = useState(70);
  const [complexity, setComplexity] = useState(40);
  const [script, setScript] = useState('');
  const [generationProgress, setGenerationProgress] = useState('');

  const generateScriptWithLLM = async (
    toneValue: number,
    complexityValue: number,
  ): Promise<string> => {
    // Map slider values to descriptive parameters
    const toneDescription =
      toneValue < 33
        ? 'academic and technical'
        : toneValue < 66
          ? 'professional and clear'
          : 'engaging and patient-friendly';
    const complexityDescription =
      complexityValue < 33
        ? 'high-level overview'
        : complexityValue < 66
          ? 'moderate detail with biochemical explanation'
          : 'deep biochemical and molecular explanation';

    const prompt = `Generate a medical educational script about compounding pharmacy and personalized hormone therapy.

Requirements:
- Tone: ${toneDescription} (slider: ${toneValue}/100)
- Medical Complexity: ${complexityDescription} (slider: ${complexityValue}/100)
- Format: Include [SCENE], character name (NICK), and dialogue
- Length: 200-400 words
- Topic: Hormone Replacement Therapy (HRT) and custom compounding
- Include specific medical/pharmaceutical details

Start with a title and scene description, then the dialogue.`;

    try {
      setGenerationProgress('Generating medical script with generative AI...');
      const response = await fetch('/api/semantic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          systemPrompt:
            'You are a professional pharmacological content creator and medical educator. Generate high-fidelity educational scripts.',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setGenerationProgress('Refining script based on parameters...');

      return data.content || 'Generation failed. Please try again.';
    } catch (error) {
      console.error('Script generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate script');
    }
  };

  const generateTemplateScript = (toneVal: number, complexityVal: number): string => {
    const isFriendly = toneVal >= 66;
    const isComplex = complexityVal >= 66;

    let title = '**TITLE: Compounding Pharmacy & Personalized Hormone Therapy**';
    let scene = '[SCENE: Nick in white lab coat, professional backdrop]';
    let dialogue: string;

    if (isFriendly && isComplex) {
      dialogue = `NICK: "Welcome back! Let me share something really important about your health. Most people take their hormones like everyone else — but here's the thing: your body is unique. That's where compounding comes in.

When you walk into a typical pharmacy, they hand you a pill that's identical to what thousands of others are taking. But your hormonal needs? They're like a fingerprint — totally individual. We can actually customize your hormone doses down to the exact milligram.

Here's the biochemistry: estrogen and progesterone don't just work in isolation. They have receptor sites throughout your body, and the ratio between them affects everything from your bone density to your mood. When we compound bio-identical hormones, we're not just matching a standard dose. We're adjusting the molecular structure and the carrier medium based on what YOUR skin actually absorbs best.

We use transdermal delivery with permeation enhancers like limonene that increase the flux rate across the stratum corneum — that's your skin's outer barrier. This means better bioavailability and more predictable therapeutic outcomes."`;
    } else if (isFriendly && !isComplex) {
      dialogue = `NICK: "Welcome back! Today we're talking about something that really matters for your health: customized hormone therapy.

Here's the big picture: regular pharmacies give everyone the same strength pills. But your body is different from everyone else's. That's where compounding comes in.

Think of it like tailoring clothes — instead of off-the-rack, we're making hormones that fit you perfectly. We can adjust the exact dose your body needs, and we use creams and other delivery methods that work best for how your skin absorbs things.

Bio-identical hormones work with your body's natural chemistry, not against it. We're matching what your own body would make, just in the right amounts for where you are in your life. It's personalized medicine, actually working for you."`;
    } else if (!isFriendly && isComplex) {
      dialogue = `NICK: "Compounding represents a pharmacologically sophisticated approach to hormone replacement therapy. The fundamental principle involves customization of bio-identical hormone formulations to achieve optimal receptor pharmacodynamics and pharmacokinetics.

Standard pharmaceutical delivery involves fixed-dose matrices that approximate population means. Conversely, compounded preparations allow for dose titration based on individual serum hormone profiles and tissue-specific receptor sensitivity. The permeation kinetics of transdermal delivery can be modulated through strategic selection of penetration enhancers and lipophilic carrier systems.

Estradiol and progesterone demonstrate differential bioavailability dependent on delivery vehicle and route of administration. Transepidermal flux is governed by Fick's law of diffusion, where flux rate correlates with concentration gradient and membrane permeability coefficient. The stratum corneum functions as the rate-limiting barrier; incorporating enhancers like limonene increases flux approximately 3-5 fold.

Receptor affinity varies across tissue types, necessitating therapeutic drug monitoring and dose adjustment. This pharmacogenomic approach optimizes the therapeutic window while minimizing adverse effects."`;
    } else {
      dialogue = `NICK: "In pharmaceutical practice, hormone replacement therapy requires careful consideration of individual patient parameters. Compounding allows us to formulate bio-identical hormones at precise dosages.

Standard formulations may not meet every patient's unique requirements. Through compounding, we can adjust strength and delivery method based on absorption characteristics and clinical need.

Bio-identical hormones mirror the molecular structure of endogenous hormones, providing physiologically aligned replacement. Transdermal administration offers controlled delivery and consistent serum levels. The formulation base is selected to optimize absorption while minimizing systemic burden.

This evidence-based approach supports better clinical outcomes through personalized pharmaceutical intervention."`;
    }

    return `${title}\n\n${scene}\n\n${dialogue}`;
  };

  const analyzeScriptConstraints = async (scriptText: string): Promise<SemanticConstraint[]> => {
    try {
      setIsAnalyzing(true);
      setGenerationProgress('Analyzing semantic constraints with LLM...');

      // Use the now-async parseScript through the API or directly if client-side is allowed
      // In this project, we call /api/semantic/analyze which uses LLM
      const response = await fetch('/api/semantic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          domain: 'creative',
        }),
      });

      if (!response.ok) {
        throw new Error(`Constraint analysis failed: ${response.status}`);
      }

      const data: SemanticAnalyzeResponse = await response.json();
      return data.constraints || [];
    } catch (error) {
      console.error('Constraint analysis error:', error);
      toast.error('Failed to analyze script constraints', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateScript = async () => {
    setIsGenerating(true);
    setGenerationProgress('');

    try {
      toast.info('Synthesizing medical script...');
      setGenerationProgress('Generating script based on tone and complexity...');

      // Generate script with LLM
      const newScript = await generateScriptWithLLM(tone, complexity);
      setScript(newScript);

      setGenerationProgress('Analyzing script semantics...');
      // Analyze the generated script for constraints
      const constraints = await analyzeScriptConstraints(newScript);

      if (constraints.length > 0) {
        const assetId = `lex_${Date.now()}`;
        PreprocessingRepo.registerAsset({
          id: assetId,
          originalId: 'current_session',
          version: 1,
          status: 'raw',
          fileUrn: 'internal://script',
          semanticData: {
            id: `artifact_${Date.now()}`,
            source: 'lexicon',
            tags: ['medical', 'hrt', `tone_${tone}`, `complexity_${complexity}`],
            constraints,
            timestamp: Date.now(),
          },
        });

        toast.success('Script generated and analyzed', {
          description: `Extracted ${constraints.length} semantic constraints. Registered with Dimension & Forge nodes.`,
        });
      } else {
        toast.success('Script generated successfully', {
          description: 'No constraints extracted, but script is ready for production.',
        });
      }

      setGenerationProgress('');
    } catch (error) {
      console.error('Script generation error:', error);
      setGenerationProgress('');
      toast.error('Script generation failed', {
        description: error instanceof Error ? error.message : 'An error occurred during generation',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      <TooltipProvider>
        {/* Left Panel: Content Architect */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold italic">
                <BookOpen className="text-primary" /> Lexicon Content Engine
              </h1>
              <p className="text-muted-foreground text-sm">
                Educational medical scripting & presentation logic
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateScript}
                disabled={isGenerating}
                className="shadow-primary/20 bg-primary hover:bg-primary/90 gap-2 shadow-lg"
              >
                <Zap size={14} /> Draft Script
              </Button>
            </div>
          </div>

          <Card className="relative flex flex-1 flex-col overflow-hidden border-white/5 bg-black/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-3 px-6">
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="h-6 border-emerald-500/20 bg-emerald-500/5 text-[10px] font-bold text-emerald-500 uppercase"
                >
                  Medically Grounded
                </Badge>
                <Badge
                  variant="outline"
                  className="h-6 border-white/10 bg-white/5 text-[10px] font-bold tracking-tighter text-zinc-500 uppercase"
                >
                  Topic: Compounding
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-40 hover:opacity-100"
                    >
                      <Share2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send to Director Studio</TooltipContent>
                </Tooltip>
                <div className="h-4 w-px bg-white/10" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-2 text-[10px] font-bold uppercase"
                >
                  <ListRestart size={12} /> Version History
                </Button>
              </div>
            </div>

            <div className="flex-1 p-8">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Drafting your educational presentation script here..."
                className="h-full w-full resize-none border-none bg-transparent font-serif text-lg leading-relaxed focus-visible:ring-0"
              />
            </div>

            {isGenerating && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Dna className="text-primary h-12 w-12 animate-spin" />
                <p className="mt-4 animate-pulse text-sm font-bold tracking-widest uppercase">
                  {generationProgress || 'Processing...'}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel: Logic & Controls */}
        <div className="flex w-80 flex-col gap-6">
          <Card className="flex flex-col gap-6 border-white/5 bg-black/40 p-6">
            <div className="flex items-center gap-2">
              <FlaskConical size={18} className="text-primary" />
              <h3 className="font-bold">Content Logic</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black tracking-widest uppercase opacity-60">
                    Narrative Tone
                  </label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={12} className="opacity-40" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Academic (Low) vs. Patient-Friendly/Engaging (High). Affects script vocabulary
                      and explanation depth.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap size={14} className="opacity-40" />
                  <Slider
                    value={[tone]}
                    onValueChange={([v]) => setTone(v)}
                    max={100}
                    className="flex-1"
                  />
                  <MessageCircle size={14} className="text-primary" />
                </div>
                <p className="text-center text-[9px] opacity-50">{tone}/100</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black tracking-widest uppercase opacity-60">
                    Medical Complexity
                  </label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={12} className="opacity-40" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Controls the amount of biochemical detail. Low = overview, High = molecular
                      mechanisms and pharmacokinetics.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <Heartbeat size={14} className="opacity-40" />
                  <Slider
                    value={[complexity]}
                    onValueChange={([v]) => setComplexity(v)}
                    max={100}
                    className="flex-1"
                  />
                  <Stethoscope size={14} className="text-emerald-500" />
                </div>
                <p className="text-center text-[9px] opacity-50">{complexity}/100</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <PenTool size={14} className="text-amber-500" />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Active Focus
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-white/10 text-[9px] uppercase"
                >
                  Hormones
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-white/10 text-[9px] uppercase"
                >
                  Dermatology
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-white/10 text-[9px] uppercase"
                >
                  Autoimmune
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/20 bg-primary/5 text-primary h-7 text-[9px]"
                >
                  Custom
                </Button>
              </div>
            </div>
          </Card>

          <Card className="flex-1 border-white/5 bg-black/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Mic2 size={18} className="text-emerald-500" />
              <h3 className="text-xs font-bold tracking-wider uppercase">Production Flow</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="bg-primary/20 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <span className="text-[10px] font-bold">01</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold">Voice Synthesis</p>
                  <p className="text-[9px] opacity-40">Connecting to "AI-Nick" voice clone...</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="bg-primary/20 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <span className="text-[10px] font-bold">02</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold">Visual Generation</p>
                  <p className="text-[9px] opacity-40">Injecting LoRA: NICK_PROFESSIONAL</p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary mt-8 w-full gap-2 font-black italic"
            >
              <Sparkles size={14} /> Batch Producer Ready
            </Button>
          </Card>
        </div>
      </TooltipProvider>
    </div>
  );
}

function Heartbeat({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
