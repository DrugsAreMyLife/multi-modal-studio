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
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          className="bg-card w-80 border p-0 shadow-xl"
          sideOffset={8}
        >
          <div className="space-y-3 p-4">
            {/* Header */}
            <div>
              <div className="text-base font-bold">{model.name}</div>
              {model.description && (
                <p className="text-muted-foreground mt-1 text-xs">{model.description}</p>
              )}
              {model.releaseDate && (
                <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  <Calendar size={10} />
                  Released: {model.releaseDate}
                </div>
              )}
            </div>

            {/* Pricing */}
            {model.pricing && (
              <div className="bg-muted/50 space-y-1 rounded-lg p-2">
                <div className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                  <DollarSign size={12} />
                  Pricing (per 1M tokens)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Input: </span>
                    <span className="font-mono font-medium">
                      ${model.pricing.inputPerMillion.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output: </span>
                    <span className="font-mono font-medium">
                      ${model.pricing.outputPerMillion.toFixed(2)}
                    </span>
                  </div>
                  {model.pricing.cachedInputPerMillion && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Cached: </span>
                      <span className="font-mono font-medium text-green-500">
                        ${model.pricing.cachedInputPerMillion.toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specs */}
            {model.specs && (
              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                  <Zap size={12} />
                  Specifications
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <FileText size={10} />
                    {formatContext(model.specs.contextWindow)} context
                  </Badge>
                  {model.specs.maxOutput && (
                    <Badge variant="outline" className="text-[10px]">
                      {formatContext(model.specs.maxOutput)} max output
                    </Badge>
                  )}
                  {model.specs.supportsVision && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Eye size={10} /> Vision
                    </Badge>
                  )}
                  {model.specs.supportsFunctionCalling && (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
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
                <div className="text-muted-foreground mb-1 flex items-center gap-1 font-semibold">
                  <Clock size={12} />
                  Rate Limits {model.rateLimits.tier && `(${model.rateLimits.tier})`}
                </div>
                <div className="text-muted-foreground flex gap-3">
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
                  <Badge
                    key={i}
                    className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px]"
                  >
                    {use}
                  </Badge>
                ))}
              </div>
            )}

            {/* Notes */}
            {model.notes && (
              <div className="text-muted-foreground flex items-start gap-1 border-t pt-2 text-xs">
                <Info size={12} className="mt-0.5 shrink-0" />
                <span>{model.notes}</span>
              </div>
            )}

            {/* Local Badge */}
            {model.isLocal && (
              <Badge variant="outline" className="border-green-500 text-[10px] text-green-500">
                🖥️ Runs Locally - No API Costs
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
