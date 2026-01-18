'use client';

import { useMemo } from 'react';
import { useAnalyticsStore } from '@/lib/store/analytics-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  DollarSign,
  Zap,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Trash2,
} from 'lucide-react';

export function AnalyticsDashboard() {
  const {
    usage,
    dailyBudgetCents,
    monthlyBudgetCents,
    setDailyBudget,
    setMonthlyBudget,
    clearHistory,
    getTodayCost,
    getMonthCost,
    getUsageByProvider,
    isOverDailyBudget,
    isOverMonthlyBudget,
  } = useAnalyticsStore();

  const todayCost = getTodayCost();
  const monthCost = getMonthCost();
  const byProvider = getUsageByProvider();
  const providers = Object.entries(byProvider);

  const totalTokens = useMemo(
    () => usage.reduce((sum, e) => sum + e.tokensIn + e.tokensOut, 0),
    [usage],
  );

  const successRate = useMemo(() => {
    if (usage.length === 0) return 100;
    return (usage.filter((e) => e.success).length / usage.length) * 100;
  }, [usage]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="h-6 w-6" />
          Analytics Dashboard
        </h2>
        <Button variant="outline" size="sm" onClick={clearHistory}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear History
        </Button>
      </div>

      {/* Budget Alerts */}
      {(isOverDailyBudget() || isOverMonthlyBudget()) && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4">
            <div className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {isOverDailyBudget() && 'Daily budget exceeded! '}
                {isOverMonthlyBudget() && 'Monthly budget exceeded!'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" /> Today's Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(todayCost / 100).toFixed(2)}</div>
            <Progress value={(todayCost / dailyBudgetCents) * 100} className="mt-2" />
            <p className="text-muted-foreground mt-1 text-xs">
              of ${(dailyBudgetCents / 100).toFixed(2)} daily budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" /> Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(monthCost / 100).toFixed(2)}</div>
            <Progress value={(monthCost / monthlyBudgetCents) * 100} className="mt-2" />
            <p className="text-muted-foreground mt-1 text-xs">
              of ${(monthlyBudgetCents / 100).toFixed(2)} monthly budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4" /> Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-muted-foreground mt-1 text-xs">across {usage.length} API calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" /> Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {usage.filter((e) => e.success).length} / {usage.length} successful
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Usage by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {providers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No usage data yet</p>
            ) : (
              providers.map(([provider, data]) => (
                <div key={provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{provider}</Badge>
                    <span className="text-muted-foreground text-sm">{data.count} calls</span>
                  </div>
                  <span className="font-medium">${(data.cost / 100).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Budget Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily">Daily Budget ($)</Label>
              <Input
                id="daily"
                type="number"
                step="0.01"
                value={(dailyBudgetCents / 100).toFixed(2)}
                onChange={(e) => setDailyBudget(Math.round(parseFloat(e.target.value) * 100))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly">Monthly Budget ($)</Label>
              <Input
                id="monthly"
                type="number"
                step="0.01"
                value={(monthlyBudgetCents / 100).toFixed(2)}
                onChange={(e) => setMonthlyBudget(Math.round(parseFloat(e.target.value) * 100))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {usage
                .slice(-20)
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={entry.success ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {entry.provider}
                      </Badge>
                      <span className="text-muted-foreground">{entry.model}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4">
                      <span>{entry.tokensIn + entry.tokensOut} tokens</span>
                      <span>${(entry.costCents / 100).toFixed(4)}</span>
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
