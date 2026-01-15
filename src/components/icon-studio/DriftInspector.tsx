'use client';

import { useIconStudioStore } from '@/lib/store/icon-studio-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Search } from 'lucide-react';

export function DriftInspector() {
    const { assets } = useIconStudioStore();

    const mockDriftChecks = [
        { name: 'Stroke Width', status: 'pass', value: '2.0px', expected: '2.0px' },
        { name: 'Corner Radius', status: 'pass', value: '4px', expected: '4px' },
        { name: 'Padding', status: 'warn', value: '12%', expected: '12.5%' },
        { name: 'Metaphor Clarity', status: 'pass', value: '98%', expected: '>90%' },
        { name: 'Lighting Angle', status: 'fail', value: 'Top', expected: 'Top-Left' },
    ];

    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Run the generation pipeline to view QA results.</p>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-6">
                {/* Asset Preview */}
                <Card className="bg-black/20 border-white/10 col-span-1">
                    <CardHeader>
                        <CardTitle>Generated Asset</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
                        <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-xl border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                            {/* Placeholder Icon */}
                            <div className="w-12 h-12 bg-primary/80 rounded-full" />
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">ID: {assets[0].id.slice(0, 8)}</Badge>
                    </CardContent>
                </Card>

                {/* QA Scorecard */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    {mockDriftChecks.map(check => (
                        <div key={check.name} className="bg-white/5 border border-white/5 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {check.status === 'pass' && <CheckCircle className="text-emerald-500" size={18} />}
                                {check.status === 'warn' && <AlertTriangle className="text-yellow-500" size={18} />}
                                {check.status === 'fail' && <AlertTriangle className="text-red-500" size={18} />}
                                <div>
                                    <div className="font-medium text-sm">{check.name}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        Expected: <span className="text-white/60">{check.expected}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-sm font-bold">{check.value}</div>
                                <Badge
                                    variant="secondary"
                                    className={`text-[10px] mt-1 ${check.status === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : check.status === 'fail' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}
                                >
                                    {check.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Drift Analysis Details */}
            <Card className="bg-white/5 border-white/10 flex-1">
                <CardHeader>
                    <CardTitle>Style System Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm font-mono bg-black/40 p-4 rounded-lg border border-white/5 text-muted-foreground">
                        {`{
  "drift_detected": true,
  "drift_severity": "low",
  "corrections_applied": [
    "Normalized stroke width from 1.9px to 2.0px",
    "Adjusted lighting highlights to matching 0.6 intensity"
  ],
  "style_dna_compliance": 92.5
}`}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
