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

const providers: StockProvider[] = [new UnsplashProvider(), new GiphyProvider()];

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
    <div
      className={cn(
        'bg-background flex h-full flex-col overflow-hidden rounded-lg border',
        className,
      )}
    >
      {/* Header / Tabs */}
      <div className="flex border-b">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setActiveProvider(p);
              setAssets([]);
            }}
            className={cn(
              'hover:bg-muted/50 flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeProvider.id === p.id
                ? 'bg-muted/50 border-primary text-primary border-b-2'
                : 'text-muted-foreground',
            )}
          >
            <span className="h-4 w-4">{p.icon}</span>
            {p.name}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 border-b p-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder={`Search ${activeProvider.name}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-9 pl-9"
          />
        </div>
        <Button size="sm" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {/* Results Grid */}
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {assets.map((asset, i) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="bg-background group hover:border-primary relative aspect-square cursor-pointer overflow-hidden rounded-md border transition-colors"
                onClick={() => onSelect(asset)}
              >
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-end bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="w-full truncate text-[10px] font-medium text-white">
                    {asset.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {!isLoading && assets.length === 0 && (
          <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
            Enter a term to search assets
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
