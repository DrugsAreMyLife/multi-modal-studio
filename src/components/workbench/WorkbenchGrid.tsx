'use client';

import { useWorkbenchStore } from '@/lib/store/workbench-store';
import { RunCard } from './RunCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function WorkbenchGrid() {
    const { runs, togglePin, addRun } = useWorkbenchStore();
    const runList = Object.values(runs).sort((a, b) => b.timestamp - a.timestamp);

    // Mock Data Seeder
    const seedData = () => {
        addRun({
            prompt: "Cyberpunk street city at night, neon rain",
            modelId: "SDXL Turbo",
            assets: [{ id: '1', type: 'image', url: 'https://picsum.photos/seed/cyber/400/400', createdAt: Date.now() }]
        });
        addRun({
            prompt: "A beautiful portrait of a cat in space suit",
            modelId: "DALL-E 3",
            assets: [{ id: '2', type: 'image', url: 'https://picsum.photos/seed/cat/400/400', createdAt: Date.now() }]
        });
    };

    return (
        <div className="h-full w-full p-4">
            {runList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <p>No runs yet.</p>
                    <Button onClick={seedData} variant="outline" className="gap-2">
                        <Plus size={16} /> Seed Mock Data
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {runList.map((run) => (
                        <RunCard
                            key={run.id}
                            run={run}
                            onPin={togglePin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
