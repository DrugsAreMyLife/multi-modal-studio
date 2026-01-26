'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import type { LossGraphConfig } from '@/lib/types/training-studio';

interface LossGraphControlsProps {
  config: LossGraphConfig;
  onConfigChange: (config: Partial<LossGraphConfig>) => void;
}

/**
 * Controls for customizing loss graph display
 * Manages smoothing factor, moving average toggle, and Y-axis scale
 */
export function LossGraphControls({ config, onConfigChange }: LossGraphControlsProps) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Graph Settings</h3>
      </div>

      {/* Moving Average Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="show-ma" className="text-sm">
          Show Moving Average
        </Label>
        <Switch
          id="show-ma"
          checked={config.showMovingAverage}
          onCheckedChange={(checked) => onConfigChange({ showMovingAverage: checked })}
        />
      </div>

      {/* Smoothing Factor Slider */}
      {config.showMovingAverage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="smoothing" className="text-sm">
              Smoothing Factor
            </Label>
            <span className="text-muted-foreground text-sm">
              {config.smoothingFactor.toFixed(2)}
            </span>
          </div>
          <Slider
            id="smoothing"
            min={0.01}
            max={1}
            step={0.01}
            value={[config.smoothingFactor]}
            onValueChange={([value]) => onConfigChange({ smoothingFactor: value })}
            className="w-full"
          />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>Less smooth</span>
            <span>More smooth</span>
          </div>
        </div>
      )}

      {/* Y-Axis Scale */}
      <div className="space-y-2">
        <Label className="text-sm">Y-Axis Scale</Label>
        <RadioGroup
          value={config.yAxisScale}
          onValueChange={(value) => onConfigChange({ yAxisScale: value as 'linear' | 'log' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="linear" id="linear" />
            <Label htmlFor="linear" className="cursor-pointer text-sm font-normal">
              Linear
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="log" id="log" />
            <Label htmlFor="log" className="cursor-pointer text-sm font-normal">
              Logarithmic
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Metrics Selection (placeholder for future implementation) */}
      <div className="space-y-2">
        <Label className="text-sm">Additional Metrics</Label>
        <div className="text-muted-foreground text-xs">
          {config.metricsToDisplay.length > 0
            ? `Displaying: ${config.metricsToDisplay.join(', ')}`
            : 'No additional metrics selected'}
        </div>
      </div>
    </Card>
  );
}
