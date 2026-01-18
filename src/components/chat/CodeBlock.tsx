'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = 'typescript', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group border-border relative my-4 overflow-hidden rounded-xl border bg-[#282c34] shadow-2xl transition-all hover:bg-[#2c313a]">
      {/* Header */}
      <div className="bg-muted/30 border-border flex items-center justify-between border-b px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
            <div className="h-3 w-3 rounded-full bg-green-500/50" />
          </div>
          <div className="mx-1 h-4 w-px bg-white/10" />
          {filename && <span className="font-mono text-xs text-zinc-400">{filename}</span>}
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            {language}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 rounded-lg bg-white/5 opacity-40 transition-all hover:bg-white/10 hover:opacity-100"
          onClick={handleCopy}
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} className="text-zinc-300" />
          )}
        </Button>
      </div>

      {/* Code */}
      <div className="relative max-h-[500px] overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            background: 'transparent',
          }}
          showLineNumbers
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1.25em',
            color: 'rgba(255, 255, 255, 0.2)',
            userSelect: 'none',
            textAlign: 'right',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
