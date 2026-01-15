import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AnalysisState, AnalysisRecord, AnalysisPromptTemplate } from '@/lib/types/analysis-studio';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_TEMPLATES: AnalysisPromptTemplate[] = [
    {
        id: 'software-nuance',
        name: 'Software Nuance Extraction',
        description: 'Extracts deep details on layout, flow, and exact functionality.',
        systemPrompt: "You are a Senior Product Architect with autism and hyper-focus on detail. Analyze this video frame-by-frame. Your goal is to document EVERY SPECIFIC DETAIL of the software shown. Ignore fluff. Focus on: exact field names, menu hierarchy, visible options in dropdowns, color codes (if mentioned), exact user workflow steps (click by click), and edge cases mentioned. Output in a structured 'Blueprint' format."
    },
    {
        id: 'clone-architecture',
        name: 'Clone & Replicate Architecture',
        description: 'Reverse engineer the tech stack and data schema.',
        systemPrompt: "You are a Lead Systems Engineer. Analyze this video to reverse-engineer the application shown. Deduce the likely database schema (tables, fields, relationships), API endpoints (implied), and frontend component structure. Generate a robust technical specification for reproducing this exact software. detailed Mermaid Class Diagrams are required."
    },
    {
        id: 'ux-flow-audit',
        name: 'UX Workflow Audit',
        description: 'Map out the user journey and interaction patterns.',
        systemPrompt: "You are a UX Researcher. Map the complete user journey shown in this video. Identify every interaction point, state change, and feedback mechanism. Create a User Flow diagram (Mermaid) and list every friction point or clever UX pattern used."
    },
    {
        id: 'edge-case-detective',
        name: 'Edge Case Detective',
        description: 'Find what they didn\'t show or what might break.',
        systemPrompt: "You are a QA Lead. Watch this demo critically. Identify what is NOT shown. What happens if the user clicks X? What about error states? List all potential gaps, missing validations, and edge cases that the presenter glossed over."
    },
    {
        id: 'design-system-spec',
        name: 'Design System Spec',
        description: 'Extract typography, spacing, and component rules.',
        systemPrompt: "You are a UI Designer. Analyze the video to extract the design system. Document: Typography (guessed sizes/weights), Color Palette (primary, secondary, semantic), Spacing rules, and Corner radii. Create a 'Style Guide' markdown based on the visual evidence."
    },
    {
        id: 'feature-gap-analysis',
        name: 'Feature Gap Analysis',
        description: 'Compare shown features against standard industry expectations.',
        systemPrompt: "You are a Competitive Analyst. Compare the software shown against industry standards (e.g. Linear, Salesforce, Slack). What features are missing? What features are unique? Provide a strict 'Gap Analysis' matrix."
    },
    {
        id: 'db-schema-reverse',
        name: 'Database Schema Reverse Engineer',
        description: 'Deduce the SQL/NoSQL structure.',
        systemPrompt: "Focus solely on data. Infer the underlying data model. List the Entities, Attributes, and Relationships. Output a Mermaid ER Diagram representing the likely backend schema."
    },
    {
        id: 'api-contract-spec',
        name: 'API Contract Generator',
        description: 'Generate a likely Swagger/OpenAPI spec.',
        systemPrompt: "Focus on the data exchange. When the user performs actions, what would the JSON payload look like? Write a hypothetical OpenAPI (Swagger) path definition for the key features shown."
    },
    {
        id: 'copywriting-tone',
        name: 'Copywriting & Microcopy',
        description: 'Extract all text and analyze tone of voice.',
        systemPrompt: "Transcribe all visible UI text, buttons, and help text. Analyze the tone (Friendly? Professional? terse?). List the exact copy used for success messages, error states, and empty states."
    },
    {
        id: 'accessibility-audit',
        name: 'Accessibility (a11y) Check',
        description: 'Check for contrast, target size, and focus states.',
        systemPrompt: "Analyze the UI for accessibility compliance. Are focus states visible? Is contrast sufficient? Are buttons large enough? Report on potential WCAG violations observed."
    },
    {
        id: 'tech-stack-detective',
        name: 'Tech Stack Detective',
        description: 'Guess the libraries and frameworks used.',
        systemPrompt: "Look for clues about the tech stack. Default loaders? Material UI ripple effects? Tailwind classes? React hydration flicker? Make an educated guess on the Framework (React/Vue), UI Library, and Backend."
    },
    {
        id: 'security-compliance',
        name: 'Security & Compliance Review',
        description: 'Look for PII leakage or security flaws.',
        systemPrompt: "Audit the video for security. Is PII visible? Are API keys exposed? Is 2FA shown? Analyze the auth flow for security best practices."
    },
    {
        id: 'mobile-responsive',
        name: 'Mobile Responsiveness Inferral',
        description: 'Predict how this scales to mobile.',
        systemPrompt: "Based on the desktop layout shown, predict the mobile layout. Write a 'Responsive Behavior' spec describing how columns should stack and navigation should collapse."
    },
    {
        id: 'performance-audit',
        name: 'Performance & Latency Audit',
        description: 'Analyze loading states and perceived speed.',
        systemPrompt: "Watch the loading times. Are there skeletons? Spinners? Optimistic UI? intricate breakdown of the perceived performance and latency strategies used."
    },
    {
        id: 'saas-pricing-model',
        name: 'SaaS Pricing & Gating Model',
        description: 'Deduce the monetization strategy.',
        systemPrompt: "If pricing or plans are mentioned or implied (e.g. 'Pro feature'), document the feature gating strategy. What is free? What is paid? How is it tiered?"
    },
    {
        id: 'onboarding-flow',
        name: 'Onboarding & Activation Flow',
        description: 'Analyze the new user experience.',
        systemPrompt: "Focus on the 'First Run' experience. How is the user guided? Tooltips? Wizards? Empty states? dissect the onboarding psychology."
    },
    {
        id: 'admin-dashboard-spec',
        name: 'Admin & Analytics Spec',
        description: 'Analyze charts, tables, and admin tools.',
        systemPrompt: "Focus on the dashboard views. What metrics are shown? How are tables filtered? Detail the Admin capabilities and Data Visualization choices."
    },
    {
        id: 'integration-ecosystem',
        name: 'Integrations & Ecosystem',
        description: 'List connected tools and webhooks.',
        systemPrompt: "What third-party tools are mentioned? Slack? GitHub? Zapier? Map out the 'Integration Ecosystem' shown or implied."
    },
    {
        id: 'automation-workflow',
        name: 'Automation Logic',
        description: 'Reverse engineer the "If This Then That" logic.',
        systemPrompt: "If automation is shown, map the Trigger -> Condition -> Action logic. Create a logic flow diagram."
    },
    {
        id: 'competitor-differentiator',
        name: 'Key Differentiator Extraction',
        description: 'What makes this specific software unique?',
        systemPrompt: "Ignore standard features. Isolate the 'Unfair Advantage' or unique selling point features. What does this do that no other tool does?"
    }
];

interface AnalysisStudioStore extends AnalysisState {
    addAnalysis: (url: string, templateId: string, customGoal?: string, modelConfig?: { providerId: string, modelId: string }) => Promise<void>;
    removeAnalysis: (id: string) => void;
    setActiveAnalysis: (id: string | null) => void;
    updateAnalysisResult: (id: string, result: any) => void;
}

export const useAnalysisStudioStore = create<AnalysisStudioStore>()(
    persist(
        (set, get) => ({
            history: [],
            activeAnalysisId: null,
            templates: DEFAULT_TEMPLATES,

            addAnalysis: async (url, templateId, customGoal, modelConfig) => {
                const id = uuidv4();
                // Mock thumbnail generation (in reality would call backend)
                const mockThumb = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

                const newRecord: AnalysisRecord = {
                    id,
                    url,
                    timestamp: Date.now(),
                    status: 'pending',
                    templateId,
                    customGoal,
                    thumbnailUrl: mockThumb,
                    videoTitle: url // Placeholder
                };

                set(state => ({
                    history: [newRecord, ...state.history],
                    activeAnalysisId: id
                }));

                // Real API Call
                try {
                    const response = await fetch('/api/analysis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url,
                            templateId,
                            customGoal,
                            providerId: modelConfig?.providerId,
                            modelId: modelConfig?.modelId,
                            templatePrompt: get().templates.find(t => t.id === templateId)?.systemPrompt
                        })
                    });

                    if (!response.ok) throw new Error('Analysis failed');

                    // Handle Streaming Response
                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();
                    let fullText = '';
                    let tempResult = {
                        summary: '',
                        nuances: [] as string[],
                        diagrams: [] as string[]
                    };

                    set(state => ({
                        history: state.history.map(h =>
                            h.id === id ? { ...h, status: 'processing' } : h
                        )
                    }));

                    while (true) {
                        const { done, value } = await reader!.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        // Simple parser for vercel AI stream chunks
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('0:')) {
                                try {
                                    const textInfo = line.slice(2).replace(/^"(.*)"$/, '$1');
                                    const cleanText = JSON.parse(`"${textInfo}"`);
                                    fullText += cleanText;
                                } catch (e) { /* ignore parse error */ }
                            }
                        }

                        // Real-time parsing
                        const mermaidMatch = fullText.match(/```mermaid([\s\S]*?)```/);
                        if (mermaidMatch) {
                            tempResult.diagrams = [mermaidMatch[1].trim()];
                        }

                        const nuances = fullText.split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.replace('- ', '').trim());
                        if (nuances.length > 0) tempResult.nuances = nuances.slice(0, 10);

                        tempResult.summary = fullText.split('```')[0].slice(0, 300) + '...';

                        set(state => ({
                            history: state.history.map(h =>
                                h.id === id ? { ...h, result: tempResult, status: 'processing' } : h
                            )
                        }));
                    }

                    set(state => ({
                        history: state.history.map(h =>
                            h.id === id ? { ...h, status: 'completed' } : h
                        )
                    }));

                } catch (e) {
                    console.error("Analysis failed", e);
                    set(state => ({
                        history: state.history.map(h =>
                            h.id === id ? { ...h, status: 'failed' } : h
                        )
                    }));
                }
            },

            removeAnalysis: (id) => set(state => ({
                history: state.history.filter(h => h.id !== id),
                activeAnalysisId: state.activeAnalysisId === id ? null : state.activeAnalysisId
            })),

            setActiveAnalysis: (id) => set({ activeAnalysisId: id }),

            updateAnalysisResult: (id, result) => set(state => ({
                history: state.history.map(h => h.id === id ? { ...h, result } : h)
            }))
        }),
        {
            name: 'analysis-studio-storage'
        }
    )
);
