'use client';

import { TrainingMonitor } from '@/components/training/TrainingMonitor';
import { DatasetManager } from '@/components/training/DatasetManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Training Page
 * Main page for monitoring and managing training jobs and datasets
 */
export default function TrainingPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card/50 sticky top-0 z-40 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Training Studio</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage datasets and monitor training jobs
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="monitor" className="w-full">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monitor">Active Jobs</TabsTrigger>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
          </TabsList>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="mt-6 space-y-6">
            {/* Monitor Section */}
            <div>
              <TrainingMonitor />
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Jobs automatically refresh every 5 seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Cancel active jobs using the cancel button (running jobs only)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Progress is saved to the last checkpoint when cancelled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Click on a job card to view detailed metrics and logs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="mt-6">
            <DatasetManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-card/50 mt-12 border-t">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold">Training</h3>
              <p className="text-muted-foreground text-sm">
                Fine-tune models with your custom datasets
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Monitoring</h3>
              <p className="text-muted-foreground text-sm">
                Real-time progress tracking and job management
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Results</h3>
              <p className="text-muted-foreground text-sm">
                Access trained models and training metrics
              </p>
            </div>
          </div>
          <div className="text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
            <p>Multi-Modal Generation Studio • Training powered by advanced AI models</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
