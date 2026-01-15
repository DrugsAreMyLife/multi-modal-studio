'use client';

import { AIModel } from '@/lib/models';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Clock, Zap, FileText, Eye, Wrench, Calendar, Info } from 'lucide-react';

interface ModelCardTooltipProps {
    model: AIModel;
    children: React.ReactNode;
}

export function ModelCardTooltip({ model, children }: ModelCardTooltipProps) {
    const formatPrice = (price: number) => {
        if (price < 0.01) return `$${(price * 1000).toFixed(2)}/1K`;
        return `$${price.toFixed(2)}/1M`;
    };

    const formatContext = (tokens: number) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
        return tokens.toString();
    };

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    side="right"
                    align="start"
                    className="w-80 p-0 bg-card border shadow-xl"
                    sideOffset={8}
                >
                    <div className="p-4 space-y-3">
                        {/* Header */}
                        <div>
                            <div className="font-bold text-base">{model.name}</div>
                            {model.description && (
                                <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                            )}
                            {model.releaseDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Calendar size={10} />
                                    Released: {model.releaseDate}
                                </div>
                            )}
                        </div>

                        {/* Pricing */}
                        {model.pricing && (
                            <div className="bg-muted/50 rounded-lg p-2 space-y-1">
                                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                    <DollarSign size={12} />
                                    Pricing (per 1M tokens)
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-muted-foreground">Input: </span>
                                        <span className="font-mono font-medium">${model.pricing.inputPerMillion.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Output: </span>
                                        <span className="font-mono font-medium">${model.pricing.outputPerMillion.toFixed(2)}</span>
                                    </div>
                                    {model.pricing.cachedInputPerMillion && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Cached: </span>
                                            <span className="font-mono font-medium text-green-500">${model.pricing.cachedInputPerMillion.toFixed(3)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Specs */}
                        {model.specs && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                    <Zap size={12} />
                                    Specifications
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge variant="outline" className="text-[10px] gap-1">
                                        <FileText size={10} />
                                        {formatContext(model.specs.contextWindow)} context
                                    </Badge>
                                    {model.specs.maxOutput && (
                                        <Badge variant="outline" className="text-[10px]">
                                            {formatContext(model.specs.maxOutput)} max output
                                        </Badge>
                                    )}
                                    {model.specs.supportsVision && (
                                        <Badge variant="secondary" className="text-[10px] gap-1">
                                            <Eye size={10} /> Vision
                                        </Badge>
                                    )}
                                    {model.specs.supportsFunctionCalling && (
                                        <Badge variant="secondary" className="text-[10px] gap-1">
                                            <Wrench size={10} /> Tools
                                        </Badge>
                                    )}
                                    {model.specs.modalities && model.specs.modalities.length > 1 && (
                                        <Badge variant="secondary" className="text-[10px]">
                                            Multimodal ({model.specs.modalities.join(', ')})
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rate Limits */}
                        {model.rateLimits && (
                            <div className="text-xs">
                                <div className="flex items-center gap-1 font-semibold text-muted-foreground mb-1">
                                    <Clock size={12} />
                                    Rate Limits {model.rateLimits.tier && `(${model.rateLimits.tier})`}
                                </div>
                                <div className="flex gap-3 text-muted-foreground">
                                    {model.rateLimits.rpm && <span>{model.rateLimits.rpm} RPM</span>}
                                    {model.rateLimits.tpm && <span>{formatContext(model.rateLimits.tpm)} TPM</span>}
                                    {model.rateLimits.rpd && <span>{model.rateLimits.rpd} RPD</span>}
                                </div>
                            </div>
                        )}

                        {/* Best For */}
                        {model.bestFor && model.bestFor.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {model.bestFor.map((use, i) => (
                                    <Badge key={i} className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20">
                                        {use}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Notes */}
                        {model.notes && (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground border-t pt-2">
                                <Info size={12} className="shrink-0 mt-0.5" />
                                <span>{model.notes}</span>
                            </div>
                        )}

                        {/* Local Badge */}
                        {model.isLocal && (
                            <Badge variant="outline" className="text-[10px] border-green-500 text-green-500">
                                🖥️ Runs Locally - No API Costs
                            </Badge>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
