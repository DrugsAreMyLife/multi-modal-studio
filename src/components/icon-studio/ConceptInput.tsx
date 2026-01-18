'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Wand2, X, Plus, Sparkles, Tag } from 'lucide-react';

interface IconConcept {
  name: string;
  description: string;
  keywords: string[];
  category: string;
  metaphors: string[];
}

const CATEGORY_SUGGESTIONS = [
  'Business',
  'Technology',
  'Social',
  'Finance',
  'Health',
  'Education',
  'Entertainment',
  'Travel',
  'Food',
  'Nature',
];

const METAPHOR_SUGGESTIONS = [
  'Growth',
  'Speed',
  'Security',
  'Connection',
  'Innovation',
  'Trust',
  'Energy',
  'Balance',
  'Progress',
  'Simplicity',
];

interface ConceptInputProps {
  onConceptChange?: (concept: IconConcept) => void;
  onGenerate?: (concept: IconConcept) => void;
  isGenerating?: boolean;
}

export function ConceptInput({ onConceptChange, onGenerate, isGenerating }: ConceptInputProps) {
  const [concept, setConcept] = useState<IconConcept>({
    name: '',
    description: '',
    keywords: [],
    category: '',
    metaphors: [],
  });
  const [newKeyword, setNewKeyword] = useState('');

  const updateConcept = useCallback(
    (updates: Partial<IconConcept>) => {
      const newConcept = { ...concept, ...updates };
      setConcept(newConcept);
      onConceptChange?.(newConcept);
    },
    [concept, onConceptChange],
  );

  const addKeyword = () => {
    if (newKeyword.trim() && !concept.keywords.includes(newKeyword.trim())) {
      updateConcept({ keywords: [...concept.keywords, newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    updateConcept({ keywords: concept.keywords.filter((k) => k !== keyword) });
  };

  const toggleMetaphor = (metaphor: string) => {
    if (concept.metaphors.includes(metaphor)) {
      updateConcept({ metaphors: concept.metaphors.filter((m) => m !== metaphor) });
    } else {
      updateConcept({ metaphors: [...concept.metaphors, metaphor] });
    }
  };

  const handleGenerate = () => {
    if (concept.name.trim()) {
      onGenerate?.(concept);
    }
  };

  const isValid = concept.name.trim().length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb size={16} className="text-primary" />
          Icon Concept
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name Input */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Icon Name / Subject</Label>
          <Input
            placeholder="e.g., 'Rocket', 'Shopping Cart', 'User Profile'"
            value={concept.name}
            onChange={(e) => updateConcept({ name: e.target.value })}
            className="text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Description (optional)</Label>
          <Textarea
            placeholder="Describe the icon's purpose or context..."
            value={concept.description}
            onChange={(e) => updateConcept({ description: e.target.value })}
            className="h-20 resize-none text-sm"
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Category</Label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_SUGGESTIONS.map((cat) => (
              <Badge
                key={cat}
                variant={concept.category === cat ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => updateConcept({ category: cat })}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-xs font-medium">
            <Tag size={12} />
            Keywords
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add keyword..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              className="flex-1 text-sm"
            />
            <Button size="sm" variant="outline" onClick={addKeyword}>
              <Plus size={14} />
            </Button>
          </div>
          {concept.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {concept.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1 text-xs">
                  {keyword}
                  <X
                    size={12}
                    className="hover:text-destructive cursor-pointer"
                    onClick={() => removeKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Metaphors */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-xs font-medium">
            <Sparkles size={12} />
            Visual Metaphors
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {METAPHOR_SUGGESTIONS.map((metaphor) => (
              <Badge
                key={metaphor}
                variant={concept.metaphors.includes(metaphor) ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleMetaphor(metaphor)}
              >
                {metaphor}
              </Badge>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button className="w-full" onClick={handleGenerate} disabled={!isValid || isGenerating}>
          <Wand2 size={16} className="mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Icon Variants'}
        </Button>
      </CardContent>
    </Card>
  );
}
