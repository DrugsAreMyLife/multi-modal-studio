'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, SortAsc, SortDesc, X, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortField = 'created' | 'updated' | 'name' | 'type';
export type SortDirection = 'asc' | 'desc';
export type ItemType = 'image' | 'video' | 'audio' | 'text' | 'all';

interface WorkbenchFiltersProps {
  onSearchChange: (query: string) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onTypeFilterChange: (types: ItemType[]) => void;
  onTagFilterChange: (tags: string[]) => void;
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  availableTags: string[];
  activeFiltersCount: number;
}

export function WorkbenchFilters({
  onSearchChange,
  onSortChange,
  onTypeFilterChange,
  onTagFilterChange,
  onDateRangeChange,
  availableTags,
  activeFiltersCount,
}: WorkbenchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTypes, setSelectedTypes] = useState<ItemType[]>(['all']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleSortChange = (field: SortField) => {
    const newDirection = field === sortField && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    onSortChange(field, newDirection);
  };

  const handleTypeToggle = (type: ItemType) => {
    let newTypes: ItemType[];
    if (type === 'all') {
      newTypes = ['all'];
    } else {
      newTypes = selectedTypes.filter((t) => t !== 'all');
      if (newTypes.includes(type)) {
        newTypes = newTypes.filter((t) => t !== type);
      } else {
        newTypes = [...newTypes, type];
      }
      if (newTypes.length === 0) newTypes = ['all'];
    }
    setSelectedTypes(newTypes);
    onTypeFilterChange(newTypes);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onTagFilterChange(newTags);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTypes(['all']);
    setSelectedTags([]);
    setSortField('updated');
    setSortDirection('desc');
    onSearchChange('');
    onTypeFilterChange(['all']);
    onTagFilterChange([]);
    onSortChange('updated', 'desc');
  };

  const SortIcon = sortDirection === 'asc' ? SortAsc : SortDesc;

  return (
    <div className="bg-card flex flex-col gap-3 border-b p-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="text-muted-foreground hover:text-foreground h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <Select value={sortField} onValueChange={(v) => handleSortChange(v as SortField)}>
          <SelectTrigger className="w-[140px]">
            <SortIcon size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={14} />
              Filters
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 flex h-5 w-5 items-center justify-center p-0"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              {/* Type filter */}
              <div>
                <h4 className="mb-2 text-sm font-medium">Type</h4>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'image', 'video', 'audio', 'text'] as ItemType[]).map((type) => (
                    <Badge
                      key={type}
                      variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => handleTypeToggle(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tag filter */}
              {availableTags.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Tag size={12} /> Tags
                  </h4>
                  <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear all */}
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter badges */}
      {(selectedTypes.length > 0 && !selectedTypes.includes('all')) || selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedTypes
            .filter((t) => t !== 'all')
            .map((type) => (
              <Badge key={type} variant="secondary" className="gap-1 capitalize">
                {type}
                <X
                  size={12}
                  className="hover:text-destructive cursor-pointer"
                  onClick={() => handleTypeToggle(type)}
                />
              </Badge>
            ))}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Tag size={10} /> {tag}
              <X
                size={12}
                className="hover:text-destructive cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Hook for managing filter state
export function useWorkbenchFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [typeFilters, setTypeFilters] = useState<ItemType[]>(['all']);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const activeFiltersCount =
    (typeFilters.length > 0 && !typeFilters.includes('all') ? 1 : 0) +
    (tagFilters.length > 0 ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0);

  return {
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    typeFilters,
    setTypeFilters,
    tagFilters,
    setTagFilters,
    dateRange,
    setDateRange,
    activeFiltersCount,
  };
}
