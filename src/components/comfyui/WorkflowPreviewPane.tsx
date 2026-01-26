'use client';

import { useState } from 'react';
import { Copy, Check, Download, Code, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ComfyUIWorkflow } from '@/lib/comfyui/types';

interface WorkflowPreviewPaneProps {
  workflow: ComfyUIWorkflow | null;
  confidence?: number;
  explanation?: string;
  templateUsed?: string;
  onUseWorkflow?: (workflow: ComfyUIWorkflow) => void;
  onDownload?: () => void;
}

/**
 * Preview pane for displaying generated ComfyUI workflows
 * Shows JSON view, visual node graph, and workflow metadata
 */
export function WorkflowPreviewPane({
  workflow,
  confidence,
  explanation,
  templateUsed,
  onUseWorkflow,
  onDownload,
}: WorkflowPreviewPaneProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!workflow) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy workflow:', error);
    }
  };

  if (!workflow) {
    return (
      <Card className="flex h-full w-full items-center justify-center p-8">
        <div className="text-muted-foreground space-y-2 text-center">
          <Eye className="mx-auto h-12 w-12 opacity-50" />
          <div className="text-lg font-medium">No workflow yet</div>
          <div className="text-sm">Generated workflows will appear here for preview</div>
        </div>
      </Card>
    );
  }

  const nodeCount = Object.keys(workflow).length;

  return (
    <Card className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Workflow Preview</h3>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>{nodeCount} nodes</span>
              {templateUsed && (
                <>
                  <span>•</span>
                  <span>Template: {templateUsed}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confidence !== undefined && (
              <Badge variant={confidence > 0.7 ? 'default' : 'secondary'} className="text-xs">
                {(confidence * 100).toFixed(0)}% confident
              </Badge>
            )}
          </div>
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm">{explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy JSON
              </>
            )}
          </Button>

          {onDownload && (
            <Button size="sm" variant="outline" onClick={onDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}

          {onUseWorkflow && (
            <Button size="sm" onClick={() => onUseWorkflow(workflow)} className="gap-2">
              <Code className="h-4 w-4" />
              Use This Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="json" className="flex h-full flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="m-0 flex-1 overflow-auto p-4">
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 font-mono text-xs">
              {JSON.stringify(workflow, null, 2)}
            </pre>
          </TabsContent>

          <TabsContent value="nodes" className="m-0 flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {Object.entries(workflow).map(([nodeId, node]) => (
                <Card key={nodeId} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Node {nodeId}</Badge>
                        <span className="text-sm font-semibold">{node.class_type}</span>
                      </div>
                    </div>

                    {node.inputs && Object.keys(node.inputs).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Inputs:</p>
                        <div className="space-y-1 pl-3">
                          {Object.entries(node.inputs).map(([key, value]) => (
                            <div key={key} className="font-mono text-xs">
                              <span className="text-muted-foreground">{key}:</span>{' '}
                              <span>
                                {Array.isArray(value)
                                  ? `[${value.join(', ')}]`
                                  : typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
