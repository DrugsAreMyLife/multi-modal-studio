'use client';

import { useMemo } from 'react';
import { useWorkbenchStore } from '@/lib/store/workbench-store';
import { RunCard } from './RunCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  WorkbenchFilters,
  useWorkbenchFilters,
  SortField,
  SortDirection,
  ItemType,
} from './WorkbenchFilters';

export function WorkbenchGrid() {
  const { runs, togglePin, addRun } = useWorkbenchStore();
  const filters = useWorkbenchFilters();

  const runList = useMemo(() => {
    let list = Object.values(runs);

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      list = list.filter(
        (run) =>
          run.prompt?.toLowerCase().includes(query) || run.modelId?.toLowerCase().includes(query),
      );
    }

    // Apply type filter
    if (filters.typeFilters.length > 0 && !filters.typeFilters.includes('all')) {
      list = list.filter((run) =>
        run.assets?.some((asset) => filters.typeFilters.includes(asset.type as ItemType)),
      );
    }

    // Apply sorting
    list.sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      switch (filters.sortField) {
        case 'created':
        case 'updated':
          return direction * (b.timestamp - a.timestamp);
        case 'name':
          return direction * (a.prompt || '').localeCompare(b.prompt || '');
        case 'type':
          const typeA = a.assets?.[0]?.type || '';
          const typeB = b.assets?.[0]?.type || '';
          return direction * typeA.localeCompare(typeB);
        default:
          return 0;
      }
    });

    return list;
  }, [runs, filters.searchQuery, filters.typeFilters, filters.sortField, filters.sortDirection]);

  // Mock Data Seeder
  const seedData = () => {
    addRun({
      prompt: 'Cyberpunk street city at night, neon rain',
      modelId: 'SDXL Turbo',
      assets: [
        {
          id: '1',
          type: 'image',
          url: 'https://picsum.photos/seed/cyber/400/400',
          createdAt: Date.now(),
        },
      ],
    });
    addRun({
      prompt: 'A beautiful portrait of a cat in space suit',
      modelId: 'DALL-E 3',
      assets: [
        {
          id: '2',
          type: 'image',
          url: 'https://picsum.photos/seed/cat/400/400',
          createdAt: Date.now(),
        },
      ],
    });
  };

  const allRuns = Object.values(runs);
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allRuns.forEach((run) => {
      run.assets?.forEach((asset) => {
        if (asset.type) tags.add(asset.type);
      });
    });
    return Array.from(tags);
  }, [allRuns]);

  return (
    <div className="flex h-full w-full flex-col">
      <WorkbenchFilters
        onSearchChange={filters.setSearchQuery}
        onSortChange={(field: SortField, direction: SortDirection) => {
          filters.setSortField(field);
          filters.setSortDirection(direction);
        }}
        onTypeFilterChange={filters.setTypeFilters}
        onTagFilterChange={filters.setTagFilters}
        onDateRangeChange={filters.setDateRange}
        availableTags={availableTags}
        activeFiltersCount={filters.activeFiltersCount}
      />

      <div className="flex-1 overflow-auto p-4">
        {runList.length === 0 ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4">
            <p>{allRuns.length > 0 ? 'No matching results.' : 'No runs yet.'}</p>
            {allRuns.length === 0 && (
              <Button onClick={seedData} variant="outline" className="gap-2">
                <Plus size={16} /> Seed Mock Data
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {runList.map((run) => (
              <RunCard key={run.id} run={run} onPin={togglePin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
