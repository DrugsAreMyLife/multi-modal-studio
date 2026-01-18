import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MessageContentProps {
  content: string;
}

export const MessageContent = React.memo(function MessageContent({ content }: MessageContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';
          const code = String(children).replace(/\n$/, '');

          if (!inline && code.includes('\n')) {
            return <CodeBlock code={code} language={language} />;
          }

          return (
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <>{children}</>;
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="mb-2 list-disc pl-4">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="mb-2 list-decimal pl-4">{children}</ol>;
        },
        li({ children }) {
          return <li className="mb-1">{children}</li>;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-primary text-muted-foreground my-2 border-l-2 pl-3 italic">
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="my-2 overflow-x-auto">
              <table className="border-border min-w-full rounded border">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="bg-muted border-b px-3 py-2 text-left text-sm font-medium">
              {children}
            </th>
          );
        },
        td({ children }) {
          return <td className="border-border border-b px-3 py-2 text-sm">{children}</td>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
