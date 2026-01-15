'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cloud, Check, Loader2, Folder, FileIcon } from 'lucide-react';
import { CloudStorageProvider, CloudFile } from '@/lib/cloud/types';
import { GoogleDriveProvider, DropboxProvider, AzureProvider } from '@/lib/cloud/providers';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const providers = [
    new GoogleDriveProvider(),
    new DropboxProvider(),
    new AzureProvider()
];

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
            <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="flex h-full">
                    {/* Sidebar Providers */}
                    <div className="w-64 border-r bg-muted/30 p-4 flex flex-col gap-2">
                        <h3 className="font-semibold text-sm mb-2 px-2 text-muted-foreground uppercase tracking-wider">Providers</h3>
                        {providers.map(p => (
                            <Button
                                key={p.id}
                                variant={activeProvider?.id === p.id ? 'secondary' : 'ghost'}
                                className="justify-start gap-3 h-12"
                                onClick={() => handleConnect(p)}
                            >
                                <div className="w-5 h-5 flex items-center justify-center">
                                    {p.icon}
                                </div>
                                <span className="flex-1 text-left">{p.name}</span>
                                {p.isConnected() && <Check size={14} className="text-emerald-500" />}
                            </Button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-background">
                        <div className="h-16 border-b flex items-center px-6 justify-between">
                            <h2 className="font-medium text-lg">
                                {activeProvider ? activeProvider.name : 'Select a Provider'}
                            </h2>
                            {activeProvider && isConnected && (
                                <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive hover:bg-destructive/10">
                                    Disconnect
                                </Button>
                            )}
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-3">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p>Connecting to Cloud Storage...</p>
                                </div>
                            ) : !activeProvider ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-3 opacity-50">
                                    <Cloud size={48} />
                                    <p>Select a cloud provider to browse files</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {files.map(file => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={file.id}
                                            className="group relative border rounded-lg p-4 bg-background hover:bg-muted/50 cursor-pointer transition-colors flex flex-col items-center text-center gap-3"
                                            onClick={async () => {
                                                if (file.type === 'file') {
                                                    // Emulate download
                                                    const url = await activeProvider.uploadFile({} as File); // Mock
                                                    onSelect(file, url);
                                                }
                                            }}
                                        >
                                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center mb-1 group-hover:scale-105 transition-transform text-muted-foreground">
                                                {file.type === 'folder' ? <Folder size={32} className="fill-blue-500/20 text-blue-500" /> : <FileIcon size={32} />}
                                            </div>
                                            <div className="w-full">
                                                <p className="text-sm font-medium truncate w-full" title={file.name}>{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Folder'}</p>
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
