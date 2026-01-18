'use client';

import { useState } from 'react';
import { useIntegrationStore } from '@/lib/integrations/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import {
  UnsplashProvider,
  SlackNotifier,
  YouTubePublisher,
  GiphyProvider,
} from '@/lib/integrations/providers';
import { PrototypeBadge } from '@/components/shared/PrototypeBadge';

const allIntegrations = [
  new UnsplashProvider(),
  new GiphyProvider(),
  new YouTubePublisher(),
  new SlackNotifier(),
];

export function IntegrationSettings() {
  const { apiKeys, setApiKey, connect, disconnect, connections } = useIntegrationStore();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Integration Settings">
          <Settings size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connected Services</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {allIntegrations.map((integration) => {
            const isConnected = connections[integration.id];
            return (
              <div key={integration.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="mt-1">{integration.icon}</div>
                <div className="flex-1">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    {integration.name}
                    {integration.isPrototype && <PrototypeBadge />}
                    {isConnected && (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-500">
                        Connected
                      </span>
                    )}
                  </h4>
                  <p className="text-muted-foreground mb-2 text-xs">{integration.description}</p>

                  {!isConnected ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="API Key / Token"
                        className="h-8 text-xs"
                        type="password"
                        value={apiKeys[integration.id] || ''}
                        onChange={(e) => setApiKey(integration.id, e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => connect(integration.id)}
                        disabled={integration.isPrototype || !apiKeys[integration.id]}
                        className={`h-8 ${integration.isPrototype ? 'opacity-50' : ''}`}
                      >
                        Connect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => disconnect(integration.id)}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
