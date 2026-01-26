'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { LossDataPoint, LossGraphConfig } from '@/lib/types/training-studio';
import { exponentialMovingAverage } from '@/lib/utils/loss-metrics';
import { Card } from '@/components/ui/card';

interface LossGraphProps {
  data: LossDataPoint[];
  config: LossGraphConfig;
  onDataPointClick?: (point: LossDataPoint) => void;
}

/**
 * Interactive loss graph visualization using Recharts
 * Displays training loss over time with optional smoothing and metrics
 */
export function LossGraph({ data, config, onDataPointClick }: LossGraphProps) {
  // Calculate smoothed data if enabled
  const smoothedData = useMemo(() => {
    const EPSILON = 1e-6;
    const processedData = data.map((d) => ({
      ...d,
      loss: config.yAxisScale === 'log' ? Math.max(EPSILON, d.loss) : d.loss,
    }));

    if (!config.showMovingAverage || data.length === 0) {
      return processedData;
    }

    const emaValues = exponentialMovingAverage(processedData, config.smoothingFactor);
    return processedData.map((point, i) => ({
      ...point,
      smoothedLoss: emaValues[i],
    }));
  }, [data, config.showMovingAverage, config.smoothingFactor, config.yAxisScale]);

  // Use smoothed data if available, otherwise raw data
  const chartData = smoothedData.length > 0 ? smoothedData : data;

  // Calculate min loss for reference line
  const minLoss = useMemo(() => {
    if (data.length === 0) return 0;
    const EPSILON = 1e-6;
    const losses = data.map((d) => d.loss);
    const minVal = Math.min(...losses);
    return config.yAxisScale === 'log' ? Math.max(EPSILON, minVal) : minVal;
  }, [data, config.yAxisScale]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const point = payload[0].payload as LossDataPoint & { smoothedLoss?: number };

    return (
      <Card className="bg-background/95 border p-3 shadow-lg backdrop-blur-sm">
        <div className="space-y-1 text-sm">
          <div className="font-semibold">Epoch {point.epoch}</div>
          <div className="text-muted-foreground">Iteration: {point.iteration}</div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Loss: {point.loss.toFixed(6)}</span>
          </div>
          {point.smoothedLoss !== undefined && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <span>Smoothed: {point.smoothedLoss.toFixed(6)}</span>
            </div>
          )}
          {point.metrics && Object.keys(point.metrics).length > 0 && (
            <div className="mt-2 border-t pt-2">
              <div className="text-muted-foreground mb-1 text-xs">Metrics:</div>
              {Object.entries(point.metrics).map(([key, value]) => (
                <div key={key} className="text-xs">
                  {key}: {typeof value === 'number' ? value.toFixed(4) : value}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (data.length === 0) {
    return (
      <Card className="flex h-[400px] w-full items-center justify-center">
        <div className="text-muted-foreground text-center">
          <div className="mb-1 text-lg font-medium">No training data yet</div>
          <div className="text-sm">Loss data will appear here as training progresses</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full p-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload[0] && onDataPointClick) {
              onDataPointClick(e.activePayload[0].payload);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="epoch"
            label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
            className="text-xs"
          />
          <YAxis
            scale={config.yAxisScale}
            label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
            domain={config.yAxisScale === 'log' ? [1e-6, 'auto'] : [0, 'auto']}
            className="text-xs"
            allowDataOverflow={true}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" />

          {/* Reference line for minimum loss */}
          <ReferenceLine
            y={minLoss}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            label={{
              value: `Min: ${minLoss.toFixed(6)}`,
              position: 'right',
              className: 'text-xs fill-muted-foreground',
            }}
          />

          {/* Raw loss line */}
          <Line
            type="monotone"
            dataKey="loss"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            name="Loss"
            isAnimationActive={false}
          />

          {/* Smoothed loss line */}
          {config.showMovingAverage && (
            <Line
              type="monotone"
              dataKey="smoothedLoss"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              name="Smoothed Loss (EMA)"
              isAnimationActive={false}
            />
          )}

          {/* Additional metrics lines */}
          {config.metricsToDisplay.map((metricName, i) => (
            <Line
              key={metricName}
              type="monotone"
              dataKey={(d: any) => {
                const val = d.metrics?.[metricName];
                if (typeof val !== 'number') return undefined;
                return config.yAxisScale === 'log' ? Math.max(1e-6, val) : val;
              }}
              stroke={`hsl(var(--chart-${(i % 5) + 1}))`}
              strokeWidth={1.5}
              dot={false}
              name={metricName}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
