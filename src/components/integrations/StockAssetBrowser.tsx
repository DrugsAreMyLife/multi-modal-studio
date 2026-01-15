'use client';

import { useState, useCallback } from 'react';
import { StockProvider, StockAsset } from '@/lib/integrations/types';
import { UnsplashProvider, GiphyProvider } from '@/lib/integrations/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const providers: StockProvider[] = [
    new UnsplashProvider(),
    new GiphyProvider()
];

interface StockAssetBrowserProps {
    onSelect: (asset: StockAsset) => void;
    className?: string;
}

export function StockAssetBrowser({ onSelect, className }: StockAssetBrowserProps) {
    const [activeProvider, setActiveProvider] = useState<StockProvider>(providers[0]);
    const [assets, setAssets] = useState<StockAsset[]>([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        try {
            const results = await activeProvider.search(query);
            setAssets(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [query, activeProvider]);

    return (
        <div className={cn("flex flex-col h-full bg-background border rounded-lg overflow-hidden", className)}>
            {/* Header / Tabs */}
            <div className="flex border-b">
                {providers.map(p => (
                    <button
                        key={p.id}
                        onClick={() => { setActiveProvider(p); setAssets([]); }}
                        className={cn(
                            "flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors",
                            activeProvider.id === p.id ? "bg-muted/50 border-b-2 border-primary text-primary" : "text-muted-foreground"
                        )}
                    >
                        <span className="w-4 h-4">{p.icon}</span>
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search ${activeProvider.name}...`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-9 h-9"
                    />
                </div>
                <Button size="sm" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Search'}
                </Button>
            </div>

            {/* Results Grid */}
            <ScrollArea className="flex-1 p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                        {assets.map((asset, i) => (
                            <motion.div
                                key={asset.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                className="relative aspect-square rounded-md overflow-hidden bg-background group cursor-pointer border hover:border-primary transition-colors"
                                onClick={() => onSelect(asset)}
                            >
                                <img
                                    src={asset.thumbnailUrl}
                                    alt={asset.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <p className="text-[10px] text-white truncate w-full font-medium">{asset.title}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                {!isLoading && assets.length === 0 && (
                    <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                        Enter a term to search assets
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
