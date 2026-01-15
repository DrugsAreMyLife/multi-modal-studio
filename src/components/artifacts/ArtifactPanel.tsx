'use client';

import { useArtifactStore } from '@/lib/store/artifact-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, Code, FileText, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function ArtifactPanel() {
    const { isOpen, currentArtifact, closeArtifact } = useArtifactStore();

    if (!isOpen || !currentArtifact) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentArtifact.content);
    };

    return (
        <div className="h-full w-[400px] border-l bg-background flex flex-col shadow-xl absolute right-0 top-0 bottom-0 z-30 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30">
                <div className="flex items-center gap-2 overflow-hidden">
                    {currentArtifact.type === 'code' && <Code size={16} className="text-blue-500" />}
                    {currentArtifact.type === 'markdown' && <FileText size={16} className="text-orange-500" />}
                    {currentArtifact.type === 'html' && <Globe size={16} className="text-green-500" />}

                    <span className="font-semibold truncate">{currentArtifact.title || 'Untitled Artifact'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy Content">
                        <Copy size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={closeArtifact}>
                        <X size={18} />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full w-full">
                    {currentArtifact.type === 'code' ? (
                        <div className="text-sm">
                            <SyntaxHighlighter
                                language={currentArtifact.language || 'typescript'}
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, borderRadius: 0, minHeight: '100%' }}
                                showLineNumbers
                            >
                                {currentArtifact.content}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <div className="p-6 prose prose-invert max-w-none">
                            {/* In a real app we'd render Markdown or HTML safe frame */}
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                                {currentArtifact.content}
                            </pre>
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Footer / Status */}
            <div className="h-8 border-t bg-muted/50 flex items-center px-4 text-xs text-muted-foreground justify-between">
                <span>{currentArtifact.language || 'Text'}</span>
                <span>{currentArtifact.content.length} chars</span>
            </div>
        </div>
    );
}
