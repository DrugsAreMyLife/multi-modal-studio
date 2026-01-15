'use client';

import { useIconStudioStore } from '@/lib/store/icon-studio-store';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Tag, Trash2, Box } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ConceptInput() {
    const { concepts, addConcept, removeConcept } = useIconStudioStore();
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            addConcept(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div className="flex h-full gap-6 p-6">
            {/* Input Column */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Concept Ingestion</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Define semantics using advanced syntax: <br />
                        <code className="text-xs bg-black/30 p-1 rounded">concept | alias #tag</code>
                    </p>

                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="e.g., user + shield = secure_user #auth"
                            className="bg-black/20 font-mono text-sm"
                        />
                        <Button size="icon" type="submit">
                            <Plus size={16} />
                        </Button>
                    </form>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm">
                    <h4 className="font-semibold text-blue-400 mb-2">Supported Syntax</h4>
                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                        <li>Basic: <span className="text-white">calendar</span></li>
                        <li>Aliases: <span className="text-white">invoice | bill</span></li>
                        <li>Tags: <span className="text-white">warning #critical</span></li>
                        <li>Relationship: <span className="text-white">user + lock</span></li>
                    </ul>
                </div>
            </div>

            {/* List Column */}
            <div className="flex-1 bg-black/20 rounded-lg border border-white/5 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-white/5 bg-white/5 font-medium">
                    Queued Concepts ({concepts.length})
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                        {concepts.map(concept => (
                            <div key={concept.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 group hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded text-primary">
                                        <Box size={16} />
                                    </div>
                                    <div>
                                        <div className="font-mono font-bold text-sm">{concept.name}</div>
                                        <div className="text-xs text-muted-foreground">{concept.definition_string}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {concept.tags.map(tag => (
                                        <Badge variant="outline" key={tag} className="text-[10px] h-5"><Tag size={8} className="mr-1" />{tag}</Badge>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                                        onClick={() => removeConcept(concept.id)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {concepts.length === 0 && (
                            <div className="text-center text-muted-foreground py-10 opacity-50">
                                No concepts defined. Add one to start.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
