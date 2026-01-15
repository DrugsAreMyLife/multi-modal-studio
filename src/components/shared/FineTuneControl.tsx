"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface FineTuneControlProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    leftLabel: string;
    rightLabel: string;
    className?: string;
    gradient?: boolean; // If true, applies blue-orange gradient (mostly for warmth)
}

export function FineTuneControl({
    label,
    value,
    onChange,
    leftLabel,
    rightLabel,
    className,
    gradient = false
}: FineTuneControlProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className="text-xs font-mono opacity-50">{value > 0 ? `+${value}` : value}</span>
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-medium tracking-wider px-0.5">
                <span className={gradient ? "text-blue-400" : ""}>{leftLabel}</span>
                <span className={gradient ? "text-orange-400" : ""}>{rightLabel}</span>
            </div>

            <Slider
                min={-5}
                max={5}
                step={1}
                value={[value]}
                onValueChange={([v]) => onChange(v)}
                className={cn(
                    "py-1",
                    gradient && "[&_.bg-primary]:bg-gradient-to-r from-blue-500 to-orange-500",
                    !gradient && "[&_.bg-primary]:bg-foreground/80"
                )}
            />
        </div>
    );
}
