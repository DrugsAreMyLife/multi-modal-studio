'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cloud, Check, Loader2, Folder, FileIcon } from 'lucide-react';
import { CloudStorageProvider, CloudFile } from '@/lib/cloud/types';
import { GoogleDriveProvider, DropboxProvider, AzureProvider } from '@/lib/cloud/providers';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const providers = [new GoogleDriveProvider(), new DropboxProvider(), new AzureProvider()];

interface UnifiedAssetPickerProps {
  onSelect: (file: CloudFile, url: string) => void;
  trigger?: React.ReactNode;
}

export function UnifiedAssetPicker({ onSelect, trigger }: UnifiedAssetPickerProps) {
  const [activeProvider, setActiveProvider] = useState<CloudStorageProvider | null>(null);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async (provider: CloudStorageProvider) => {
    setIsLoading(true);
    setActiveProvider(provider);
    try {
      await provider.connect();
      setIsConnected(true);
      const list = await provider.listFiles();
      setFiles(list);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeProvider) return;
    await activeProvider.disconnect();
    setActiveProvider(null);
    setIsConnected(false);
    setFiles([]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Cloud size={16} />
            Import from Cloud
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex h-[600px] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <div className="flex h-full">
          {/* Sidebar Providers */}
          <div className="bg-muted/30 flex w-64 flex-col gap-2 border-r p-4">
            <h3 className="text-muted-foreground mb-2 px-2 text-sm font-semibold tracking-wider uppercase">
              Providers
            </h3>
            {providers.map((p) => (
              <Button
                key={p.id}
                variant={activeProvider?.id === p.id ? 'secondary' : 'ghost'}
                className="h-12 justify-start gap-3"
                onClick={() => handleConnect(p)}
              >
                <div className="flex h-5 w-5 items-center justify-center">{p.icon}</div>
                <span className="flex-1 text-left">{p.name}</span>
                {p.isConnected() && <Check size={14} className="text-emerald-500" />}
              </Button>
            ))}
          </div>

          {/* Main Content */}
          <div className="bg-background flex flex-1 flex-col">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <h2 className="text-lg font-medium">
                {activeProvider ? activeProvider.name : 'Select a Provider'}
              </h2>
              {activeProvider && isConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Disconnect
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 p-6">
              {isLoading ? (
                <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin" size={32} />
                  <p>Connecting to Cloud Storage...</p>
                </div>
              ) : !activeProvider ? (
                <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 opacity-50">
                  <Cloud size={48} />
                  <p>Select a cloud provider to browse files</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {files.map((file) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={file.id}
                      className="group bg-background hover:bg-muted/50 relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border p-4 text-center transition-colors"
                      onClick={async () => {
                        if (file.type === 'file') {
                          // Emulate download
                          const url = await activeProvider.uploadFile({} as File); // Mock
                          onSelect(file, url);
                        }
                      }}
                    >
                      <div className="bg-muted text-muted-foreground mb-1 flex h-16 w-16 items-center justify-center rounded-md transition-transform group-hover:scale-105">
                        {file.type === 'folder' ? (
                          <Folder size={32} className="fill-blue-500/20 text-blue-500" />
                        ) : (
                          <FileIcon size={32} />
                        )}
                      </div>
                      <div className="w-full">
                        <p className="w-full truncate text-sm font-medium" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Folder'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
