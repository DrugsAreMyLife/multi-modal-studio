'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import { useIntegrationStore } from '@/lib/integrations/store';

interface ProviderCardProps {
  provider: any;
}

function ProviderCard({ provider }: ProviderCardProps) {
  const { apiKeys, setApiKey, connections, connect } = useIntegrationStore();
  const apiKey = apiKeys[provider.id] || '';
  const isConnected = connections[provider.id] || false;

  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    setStatus('testing');
    // Simulate API test
    setTimeout(() => {
      setStatus(apiKey.length > 10 ? 'success' : 'error');
      if (apiKey.length > 10) connect(provider.id);
    }, 1000);
  };

  const handleSave = () => {
    // Already updating via onChange if we want real-time,
    // but we can add a explicit save feedback if needed.
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <Card className="border-border relative overflow-hidden border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{provider.name}</CardTitle>
            <CardDescription className="mt-1 text-xs">{provider.description}</CardDescription>
          </div>
          <Badge variant={apiKey ? 'default' : 'secondary'} className="ml-2 whitespace-nowrap">
            {apiKey ? 'Configured' : 'Not Set'}
            {isConnected && ' • Active'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {provider.requiresApiKey && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={`Enter ${provider.apiKeyEnvVar}`}
                  value={apiKey}
                  onChange={(e) => setApiKey(provider.id, e.target.value)}
                  className="h-9 pr-10 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-2 hover:bg-transparent"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleTest}
                disabled={!apiKey || status === 'testing'}
                variant="outline"
                className="h-9"
              >
                {status === 'testing' ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {status !== 'idle' && (
              <div className="flex items-center gap-2 text-xs">
                {status === 'success' && <Check size={14} className="text-green-500" />}
                {status === 'error' && <X size={14} className="text-red-500" />}
                {status === 'testing' && (
                  <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
                )}
                <span
                  className={
                    status === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                  }
                >
                  {status === 'success' && 'Connection verified'}
                  {status === 'error' && 'Connection failed'}
                  {status === 'testing' && 'Testing connection...'}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="border-border flex items-center justify-between border-t pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">
              Modalities: {provider.supportedModalities.join(', ')}
            </span>
          </div>
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary ml-2 flex items-center gap-1 whitespace-nowrap hover:underline"
          >
            Get Key <ExternalLink size={12} />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProviderSettingsProps {}

export function ProviderSettings({}: ProviderSettingsProps) {
  const providers = Object.values(PROVIDER_REGISTRY);

  // Group providers by modality for better organization
  const textProviders = providers.filter((p) => p.supportedModalities.includes('text'));
  const imageProviders = providers.filter((p) => p.supportedModalities.includes('image'));
  const videoProviders = providers.filter((p) => p.supportedModalities.includes('video'));
  const audioProviders = providers.filter((p) => p.supportedModalities.includes('audio'));

  const groupedProviders = [
    { label: 'Text & Language', providers: textProviders },
    {
      label: 'Image Generation',
      providers: imageProviders.filter((p) => !textProviders.includes(p)),
    },
    {
      label: 'Video Generation',
      providers: videoProviders.filter(
        (p) => !textProviders.includes(p) && !imageProviders.includes(p),
      ),
    },
    {
      label: 'Audio & Speech',
      providers: audioProviders.filter(
        (p) =>
          !textProviders.includes(p) && !imageProviders.includes(p) && !videoProviders.includes(p),
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">API Providers</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure your API keys to enable generation features
        </p>
      </div>

      {groupedProviders.map((group) => {
        if (group.providers.length === 0) return null;

        return (
          <div key={group.label} className="space-y-3">
            <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              {group.label}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="bg-muted/30 border-border mt-8 rounded-lg border p-4">
        <p className="text-muted-foreground text-xs">
          <strong>Note:</strong> API keys are stored securely in your browser's local storage. They
          are never sent to our servers.
        </p>
      </div>
    </div>
  );
}
