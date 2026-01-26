'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ConversationContext, ConversationMessage } from '@/lib/comfyui/state-machine-types';
import {
  initializeConversation,
  processMessage,
  getProgressSummary,
} from '@/lib/comfyui/conversation-state-machine';

interface AssistedWorkflowChatProps {
  onWorkflowGenerated?: (context: ConversationContext) => void;
  onCancel?: () => void;
}

/**
 * Conversational chat interface for assisted workflow building
 * Uses finite state machine to guide users through workflow creation
 */
export function AssistedWorkflowChat({ onWorkflowGenerated, onCancel }: AssistedWorkflowChatProps) {
  const [context, setContext] = useState<ConversationContext>(initializeConversation());
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [context.messageHistory]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      const result = await processMessage(context, userMessage);

      setContext(result.context);

      // Add assistant response to message history
      const updatedContext = {
        ...result.context,
        messageHistory: [
          ...result.context.messageHistory,
          {
            role: 'assistant' as const,
            content: result.assistantMessage,
            timestamp: Date.now(),
          },
        ],
      };

      setContext(updatedContext);

      // Check if workflow generation is complete
      if (result.isComplete && onWorkflowGenerated) {
        onWorkflowGenerated(updatedContext);
      }
    } catch (error) {
      console.error('Error processing message:', error);

      // Add error message
      setContext((prev) => ({
        ...prev,
        messageHistory: [
          ...prev.messageHistory,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: Date.now(),
          },
        ],
      }));
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleReset = () => {
    setContext(initializeConversation());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const progress = getProgressSummary(context);

  return (
    <Card className="flex h-[600px] flex-col">
      {/* Header with progress */}
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Workflow Assistant</h3>
            <Badge variant="outline">{progress.state}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleReset} title="Start over">
              <RotateCcw className="h-4 w-4" />
            </Button>
            {onCancel && (
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Completion</span>
            <span>{progress.completion.toFixed(0)}%</span>
          </div>
          <Progress value={progress.completion} />
        </div>

        {/* Confidence indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Confidence:</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < progress.confidence * 5 ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-muted-foreground">{(progress.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {/* Initial greeting */}
        {context.messageHistory.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-muted max-w-[80%] rounded-lg p-3">
              <p className="text-sm">
                Hi! I'll help you create a ComfyUI workflow. What would you like to generate?
              </p>
            </div>
          </div>
        )}

        {/* Message history */}
        {context.messageHistory.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="mt-1 text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isProcessing || context.currentState === 'complete'}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing || context.currentState === 'complete'}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Collected parameters summary */}
        {progress.collectedParameters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {progress.collectedParameters.map((param) => (
              <Badge key={param} variant="secondary" className="text-xs">
                {param}: {String(context.parameters[param]).substring(0, 20)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
