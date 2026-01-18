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
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
        <Search size={48} className="mb-4 opacity-20" />
        <p>Run the generation pipeline to view QA results.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Asset Preview */}
        <Card className="col-span-1 border-white/10 bg-black/20">
          <CardHeader>
            <CardTitle>Generated Asset</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              {/* Placeholder Icon */}
              <div className="bg-primary/80 h-12 w-12 rounded-full" />
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              ID: {assets[0].id.slice(0, 8)}
            </Badge>
          </CardContent>
        </Card>

        {/* QA Scorecard */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {mockDriftChecks.map((check) => (
            <div
              key={check.name}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                {check.status === 'pass' && <CheckCircle className="text-emerald-500" size={18} />}
                {check.status === 'warn' && <AlertTriangle className="text-yellow-500" size={18} />}
                {check.status === 'fail' && <AlertTriangle className="text-red-500" size={18} />}
                <div>
                  <div className="text-sm font-medium">{check.name}</div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    Expected: <span className="text-white/60">{check.expected}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold">{check.value}</div>
                <Badge
                  variant="secondary"
                  className={`mt-1 text-[10px] ${check.status === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : check.status === 'fail' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}
                >
                  {check.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drift Analysis Details */}
      <Card className="flex-1 border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Style System Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground rounded-lg border border-white/5 bg-black/40 p-4 font-mono text-sm">
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
