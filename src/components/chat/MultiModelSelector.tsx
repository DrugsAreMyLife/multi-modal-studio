'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Check, ChevronRight, Play, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MODEL_PROVIDERS, AIProvider, AIModel } from '@/lib/models';
import { ModelCardTooltip } from './ModelCardTooltip';
import { cn } from '@/lib/utils';

interface MultiModelSelectorProps {
    onStartComparison: (selectedModels: AIModel[]) => void;
    onCancel: () => void;
}

export function MultiModelSelector({ onStartComparison, onCancel }: MultiModelSelectorProps) {
    // We can have up to 4 slots.
    // Each slot holds a selected model (or null if empty).
    // We start with 1 slot.
    const [slots, setSlots] = useState<(AIModel | null)[]>([null]);

    // Which slot are we currently editing?
    const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

    // Selection state for the active slot
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

    // Helper to get already selected models (to strike them out)
    const getSelectedModelIds = () => {
        return slots.filter(s => s !== null).map(s => s!.id);
    };

    const handleProviderSelect = (providerId: string) => {
        setSelectedProviderId(providerId);
    };

    const handleModelSelect = (model: AIModel) => {
        const newSlots = [...slots];
        newSlots[activeSlotIndex] = model;
        setSlots(newSlots);

        // Reset selection view for next time
        setSelectedProviderId(null);

        // If we just filled the last slot and we have room for more (max 4), maybe auto-add next slot?
        // Or users manually click "+". The prompt says "beneath this there should be a +".
        // So we just close the editing view for this slot?
        // Actually, if we just selected a model, we are "done" with this slot.
        // The requirement implies a persistent list of selected models.
    };

    const addSlot = () => {
        if (slots.length < 4) {
            setSlots([...slots, null]);
            setActiveSlotIndex(slots.length); // Activate the new slot
            setSelectedProviderId(null);
        }
    };

    const removeSlot = (index: number) => {
        const newSlots = slots.filter((_, i) => i !== index);
        if (newSlots.length === 0) newSlots.push(null); // Always at least one
        setSlots(newSlots);
        setActiveSlotIndex(0); // Reset active to first?
        setSelectedProviderId(null);
    };

    const canProcess = slots.filter(s => s !== null).length > 0;

    // The Active Slot View (Provider/Model selection)
    const renderActiveSlotSelection = () => {
        const activeProvider = MODEL_PROVIDERS.find(p => p.id === selectedProviderId);
        const alreadySelectedIds = getSelectedModelIds();

        return (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold tracking-tight">Select a Model</h3>
                    <p className="text-sm text-muted-foreground">Choose a provider to explore their garden.</p>
                </div>

                {/* Provider Grid */}
                {!activeProvider && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {MODEL_PROVIDERS.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => handleProviderSelect(provider.id)}
                                className="flex flex-col items-center justify-center p-6 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/50 transition-all group scale-100 hover:scale-105"
                            >
                                <div
                                    className="p-4 rounded-full mb-3 transition-colors"
                                    style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                                >
                                    <provider.icon size={32} strokeWidth={1.5} />
                                </div>
                                <span className="font-semibold">{provider.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Model List (Specific Provider) */}
                {activeProvider && (
                    <div className="flex flex-col items-center flex-1 min-h-0">
                        {/* Selected Provider Header (Centered) */}
                        <button
                            onClick={() => setSelectedProviderId(null)}
                            className="flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                        >
                            <div
                                className="p-2 rounded-full"
                                style={{ backgroundColor: `${activeProvider.color}10`, color: activeProvider.color }}
                            >
                                <activeProvider.icon size={20} />
                            </div>
                            <span className="font-bold text-lg text-foreground">{activeProvider.name}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">(Change)</span>
                        </button>

                        {/* Scrollable Model List with Blurry Edges */}
                        <div className="relative w-full max-w-sm flex-1 min-h-0">
                            {/* Gradients for blur effect */}
                            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

                            <ScrollArea className="h-[300px] w-full pr-4">
                                <div className="space-y-1 py-12"> {/* Padding to allow scrolling behind blurring masks */}
                                    {activeProvider.models.map((model) => {
                                        const isSelected = alreadySelectedIds.includes(model.id);
                                        return (
                                            <ModelCardTooltip model={model}>
                                                <button
                                                    key={model.id}
                                                    disabled={isSelected}
                                                    onClick={() => handleModelSelect(model)}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between",
                                                        isSelected
                                                            ? "opacity-50 line-through cursor-not-allowed text-muted-foreground"
                                                            : "hover:bg-accent hover:text-accent-foreground"
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{model.name}</span>
                                                        {model.description && (
                                                            <span className="text-xs text-muted-foreground">{model.description}</span>
                                                        )}
                                                    </div>
                                                    {model.pricing && (
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            ${model.pricing.inputPerMillion}/${model.pricing.outputPerMillion}
                                                        </span>
                                                    )}
                                                </button>
                                            </ModelCardTooltip>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Model Garden</h2>
                        <p className="text-muted-foreground">Compare results across multiple intelligent agents.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X size={20} />
                    </Button>
                </div>

                {/* Main Content Area */}
                <div className="p-6 flex-1 overflow-y-auto min-h-[400px]">

                    {/* List of Slots */}
                    <div className="flex flex-col gap-4 mb-8">
                        {slots.map((slot, idx) => (
                            <div key={idx} className={cn(
                                "relative border rounded-xl overflow-hidden transition-all",
                                activeSlotIndex === idx ? "ring-2 ring-primary border-primary bg-accent/10" : "bg-card hover:bg-accent/5",
                                slot === null && activeSlotIndex !== idx ? "opacity-50" : ""
                            )}>
                                {/* If this slot is active and empty, show the selection UI Inline? 
                      No, the instruction says "When you click [add], it loads an identical selection display".
                      So maybe we just show the selection UI *below* the list of completed slots?
                      Or we replace the content area. 
                  */}

                                {slot ? (
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                {/* Find icon */}
                                                {(() => {
                                                    const p = MODEL_PROVIDERS.find(p => p.id === slot.providerId);
                                                    const Icon = p?.icon || Bot;
                                                    return <Icon size={20} />;
                                                })()}
                                            </div>
                                            <div>
                                                <div className="font-bold">{slot.name}</div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">{MODEL_PROVIDERS.find(p => p.id === slot.providerId)?.name}</div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeSlot(idx)}>Remove</Button>
                                    </div>
                                ) : (
                                    // Empty Slot Placeholder
                                    <div
                                        className={cn("p-8 flex flex-col items-center justify-center text-muted-foreground dashed border-2 border-dashed border-border/50 rounded-xl",
                                            activeSlotIndex === idx ? "hidden" : "cursor-pointer hover:bg-accent/10")}
                                        onClick={() => setActiveSlotIndex(idx)}
                                    >
                                        {activeSlotIndex !== idx && <span>Click to configure Model {idx + 1}</span>}
                                    </div>
                                )}

                                {/* If this is the active slot, render the selection UI here? 
                      Or should the selection UI be the *entire* modal content?
                      Let's make the selection UI occupy the main space, and the list of slots be a summary on top or side.
                  */}
                            </div>
                        ))}

                        {/* Add Button */}
                        {slots.length < 4 && slots.every(s => s !== null) && (
                            <Button
                                variant="outline"
                                className="w-full h-16 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50 text-lg gap-2"
                                onClick={addSlot}
                            >
                                <Plus size={24} /> Add Comparison Model
                            </Button>
                        )}
                    </div>

                    {/* Active Slot Selection Area */}
                    {activeSlotIndex !== null && slots[activeSlotIndex] === null && (
                        <div className="border-t pt-6 mt-6">
                            {renderActiveSlotSelection()}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 transition-all">
                    {canProcess && (
                        <Button
                            size="lg"
                            className="w-full md:w-auto text-lg px-8 gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                            onClick={() => onStartComparison(slots.filter(s => s !== null) as AIModel[])}
                        >
                            <Play fill="currentColor" size={16} /> Process Comparison
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
