'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, MessageSquare, Play, CheckCircle, XCircle } from 'lucide-react';

interface ComfyUIWorkflowBuilderProps {
  onExecute?: (workflow: unknown) => void;
}

export function ComfyUIWorkflowBuilder({ onExecute }: ComfyUIWorkflowBuilderProps) {
  const [mode, setMode] = useState<'autonomous' | 'assisted'>('autonomous');
  const [prompt, setPrompt] = useState('');
  const [workflow, setWorkflow] = useState<unknown>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/comfyui/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      });

      if (!response.ok) throw new Error('Failed to generate workflow');

      const data = await response.json();
      setWorkflow(data.workflow);
    } catch (error) {
      console.error('Failed to generate workflow:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!workflow) return;

    try {
      await onExecute?.(workflow);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">ComfyUI Status</CardTitle>
            <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
              {isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Builder */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Workflow Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'autonomous' | 'assisted')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="autonomous" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Quick Generate
              </TabsTrigger>
              <TabsTrigger value="assisted" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Build Step-by-Step
              </TabsTrigger>
            </TabsList>

            <TabsContent value="autonomous" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe what you want to create:</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Create a photorealistic portrait of a cyberpunk character with neon lighting..."
                  className="min-h-[120px]"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating Workflow...' : 'Generate Workflow'}
              </Button>
            </TabsContent>

            <TabsContent value="assisted" className="space-y-4">
              <div className="bg-muted/50 min-h-[200px] rounded-lg border p-4">
                <p className="text-muted-foreground text-center text-sm">
                  Assisted workflow builder coming soon...
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Workflow Preview */}
      {workflow && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Generated Workflow</CardTitle>
              <Button onClick={handleExecute} size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Execute
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-[300px] overflow-auto rounded-lg p-4 text-xs">
              {JSON.stringify(workflow, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
