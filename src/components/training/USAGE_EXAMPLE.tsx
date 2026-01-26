/**
 * Example usage of the TrainingMonitor component
 * This file demonstrates how to integrate TrainingMonitor into your application
 */

import { TrainingMonitor } from './TrainingMonitor';

/**
 * Example 1: Standalone Dashboard
 */
export function TrainingDashboard() {
  return (
    <div className="container mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-bold">Training Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor your active training jobs</p>
      </div>

      <TrainingMonitor />
    </div>
  );
}

/**
 * Example 2: Within a Layout with Sidebar
 */
export function TrainingPage() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Sidebar */}
      <aside className="col-span-3">
        <div className="sticky top-6 space-y-4">
          <h2 className="font-semibold">Training Tools</h2>
          <nav className="space-y-2">
            <a href="/training" className="block text-sm hover:underline">
              Active Jobs
            </a>
            <a href="/training/history" className="block text-sm hover:underline">
              Job History
            </a>
            <a href="/training/datasets" className="block text-sm hover:underline">
              Datasets
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="col-span-9 space-y-6">
        <TrainingMonitor />
      </main>
    </div>
  );
}

/**
 * Example 3: Within a Tabbed Interface
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TrainingCenter() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Training Center</h1>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <TrainingMonitor />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {/* Show completed jobs here */}
          <p>Completed jobs section</p>
        </TabsContent>

        <TabsContent value="failed" className="mt-6">
          {/* Show failed jobs here */}
          <p>Failed jobs section</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example 4: Full Page Component
 */
export function TrainingMonitorPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Training Monitor</h1>
              <p className="text-muted-foreground text-sm">
                Real-time monitoring of your active training jobs
              </p>
            </div>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">
              New Training Job
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <TrainingMonitor />
      </main>
    </div>
  );
}

/**
 * Example 5: With Error Boundary
 */
import { GlobalErrorBoundary } from '@/components/ui/error-boundary';

export function TrainingMonitorWithErrorHandling() {
  return (
    <GlobalErrorBoundary
      fallback={
        <div className="p-6 text-center">
          <p className="text-destructive">Failed to load training monitor</p>
          <p className="text-muted-foreground mt-2 text-sm">Please try refreshing the page</p>
        </div>
      }
    >
      <TrainingMonitor />
    </GlobalErrorBoundary>
  );
}

/**
 * Example 6: Minimal Setup
 */
export function MinimalTrainingMonitor() {
  return <TrainingMonitor />;
}

/**
 * Example 7: Integrated with Other Components
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TrainingStudio() {
  return (
    <div className="space-y-6">
      {/* Training Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Training Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Training settings panel here</p>
        </CardContent>
      </Card>

      {/* Training Monitor */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Job Status</h2>
        <TrainingMonitor />
      </div>

      {/* Training Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Completed training results here</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Import Instructions
 *
 * 1. Import the component:
 *    import { TrainingMonitor } from '@/components/training/TrainingMonitor';
 *
 * 2. Use in your component:
 *    export function MyPage() {
 *      return <TrainingMonitor />;
 *    }
 *
 * 3. Component handles all state management via useTrainingStore()
 *    No props needed!
 *
 * 4. Auto-refreshes every 5 seconds
 * 5. Cleans up intervals on unmount
 * 6. Responsive on all screen sizes
 */
