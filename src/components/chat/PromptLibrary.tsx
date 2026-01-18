'use client';

import { useState } from 'react';
import { usePromptLibraryStore, SavedPrompt } from '@/lib/store/prompt-library-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Library, Star, Plus, Search, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptLibraryProps {
  onSelectPrompt: (content: string) => void;
}

export function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
  });

  const {
    prompts,
    categories,
    addPrompt,
    deletePrompt,
    toggleFavorite,
    incrementUsage,
    searchPrompts,
  } = usePromptLibraryStore();

  const filteredPrompts = searchQuery
    ? searchPrompts(searchQuery)
    : selectedCategory === 'all'
      ? prompts
      : selectedCategory === 'favorites'
        ? prompts.filter((p) => p.isFavorite)
        : prompts.filter((p) => p.category === selectedCategory);

  const handleSelectPrompt = (prompt: SavedPrompt) => {
    incrementUsage(prompt.id);
    onSelectPrompt(prompt.content);
    setIsOpen(false);
  };

  const handleAddPrompt = () => {
    if (!newPrompt.title || !newPrompt.content) return;
    addPrompt({
      title: newPrompt.title,
      content: newPrompt.content,
      category: newPrompt.category,
      tags: newPrompt.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isFavorite: false,
    });
    setNewPrompt({ title: '', content: '', category: 'General', tags: '' });
    setIsAddingNew(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Prompt Library">
          <Library size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library size={18} /> Prompt Library
          </DialogTitle>
        </DialogHeader>

        {/* Search and filters */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="favorites">⭐ Favorites</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setIsAddingNew(true)}>
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </div>

        {/* Add new prompt form */}
        {isAddingNew && (
          <div className="bg-muted/30 mb-4 rounded-lg border p-4">
            <Input
              placeholder="Title"
              value={newPrompt.title}
              onChange={(e) => setNewPrompt((p) => ({ ...p, title: e.target.value }))}
              className="mb-2"
            />
            <Textarea
              placeholder="Prompt content..."
              value={newPrompt.content}
              onChange={(e) => setNewPrompt((p) => ({ ...p, content: e.target.value }))}
              className="mb-2 min-h-[100px]"
            />
            <div className="flex gap-2">
              <Select
                value={newPrompt.category}
                onValueChange={(v) => setNewPrompt((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Tags (comma separated)"
                value={newPrompt.tags}
                onChange={(e) => setNewPrompt((p) => ({ ...p, tags: e.target.value }))}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddPrompt}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingNew(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Prompts list */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredPrompts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No prompts found. Add some to get started!
              </p>
            ) : (
              filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="hover:bg-muted/50 group cursor-pointer rounded-lg border p-3"
                  onClick={() => handleSelectPrompt(prompt)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{prompt.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {prompt.category}
                        </Badge>
                        {prompt.isFavorite && (
                          <Star size={12} className="fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {prompt.content}
                      </p>
                      {prompt.tags.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {prompt.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(prompt.id);
                        }}
                      >
                        <Star
                          size={14}
                          className={cn(prompt.isFavorite && 'fill-yellow-500 text-yellow-500')}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(prompt.content);
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:text-destructive h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePrompt(prompt.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
