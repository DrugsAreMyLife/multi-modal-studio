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
    <div className="bg-background animate-in slide-in-from-right absolute top-0 right-0 bottom-0 z-30 flex h-full w-[400px] flex-col border-l shadow-xl duration-300">
      {/* Header */}
      <div className="bg-muted/30 flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          {currentArtifact.type === 'code' && <Code size={16} className="text-blue-500" />}
          {currentArtifact.type === 'markdown' && (
            <FileText size={16} className="text-orange-500" />
          )}
          {currentArtifact.type === 'html' && <Globe size={16} className="text-green-500" />}

          <span className="truncate font-semibold">
            {currentArtifact.title || 'Untitled Artifact'}
          </span>
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
      <div className="relative flex-1 overflow-hidden">
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
            <div className="prose prose-invert max-w-none p-6">
              {/* In a real app we'd render Markdown or HTML safe frame */}
              <pre className="font-sans text-sm whitespace-pre-wrap">{currentArtifact.content}</pre>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer / Status */}
      <div className="bg-muted/50 text-muted-foreground flex h-8 items-center justify-between border-t px-4 text-xs">
        <span>{currentArtifact.language || 'Text'}</span>
        <span>{currentArtifact.content.length} chars</span>
      </div>
    </div>
  );
}
