'use client';

import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Move, GripHorizontal } from 'lucide-react';

export function KeyframeEditor() {
    const [easing, setEasing] = useState('ease-in-out');

    // Mock data generation based on easing
    const generateData = (type: string) => {
        const points = [];
        for (let i = 0; i <= 100; i += 5) {
            let y = i;
            const t = i / 100;
            if (type === 'ease-in-out') {
                y = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                y *= 100;
            } else if (type === 'ease-in') {
                y = t * t * 100;
            } else if (type === 'ease-out') {
                y = t * (2 - t) * 100;
            } else if (type === 'linear') {
                y = i;
            } else if (type === 'bounce') {
                // Simplified bounce approximation
                if (t < (1 / 2.75)) {
                    y = 7.5625 * t * t;
                } else if (t < (2 / 2.75)) {
                    const t2 = t - (1.5 / 2.75);
                    y = 7.5625 * t2 * t2 + 0.75;
                } else if (t < (2.5 / 2.75)) {
                    const t3 = t - (2.25 / 2.75);
                    y = 7.5625 * t3 * t3 + 0.9375;
                } else {
                    const t4 = t - (2.625 / 2.75);
                    y = 7.5625 * t4 * t4 + 0.984375;
                }
                y *= 100;
            }
            points.push({ x: i, y: Math.min(100, Math.max(0, y)) });
        }
        return points;
    };

    const data = generateData(easing);

    return (
        <Card className="p-4 w-full h-[300px] bg-background/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GripHorizontal size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Easing Curve</span>
                </div>
                <Select value={easing} onValueChange={setEasing}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="ease-in">Ease In</SelectItem>
                        <SelectItem value="ease-out">Ease Out</SelectItem>
                        <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 w-full min-h-0 bg-muted/20 rounded-lg p-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="x" type="number" hide domain={[0, 100]} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="y"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>

                {/* Visual Handles (Static for prototype) */}
                <div className="absolute left-2 bottom-2 w-3 h-3 border-2 border-primary bg-background rounded-full cursor-move" />
                <div className="absolute right-2 top-2 w-3 h-3 border-2 border-primary bg-background rounded-full cursor-move" />
            </div>
        </Card>
    );
}
