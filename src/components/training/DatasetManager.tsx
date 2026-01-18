'use client';

import { useEffect, useState } from 'react';
import { useTrainingStore } from '@/lib/store/training-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

export function DatasetManager() {
  const { datasets, isLoading, fetchDatasets, createDataset, deleteDataset, setSelectedDataset } =
    useTrainingStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetType, setNewDatasetType] = useState<string>('lora');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleCreateDataset = async () => {
    if (!newDatasetName || !selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', newDatasetName);
      formData.append('type', newDatasetType);

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('images', selectedFiles[i]);
      }

      await createDataset(formData);

      // Reset form
      setNewDatasetName('');
      setSelectedFiles(null);
      setNewDatasetType('lora');
    } catch (error) {
      console.error('Failed to create dataset:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    if (confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      try {
        await deleteDataset(datasetId);
      } catch (error) {
        console.error('Failed to delete dataset:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500';
      case 'creating':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Dataset Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Create New Dataset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Training Dataset</DialogTitle>
            <DialogDescription>
              Upload images to create a new dataset for model training
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="dataset-name">Dataset Name</Label>
              <Input
                id="dataset-name"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="My LoRA Dataset"
              />
            </div>

            <div>
              <Label htmlFor="dataset-type">Training Type</Label>
              <Select value={newDatasetType} onValueChange={setNewDatasetType}>
                <SelectTrigger id="dataset-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lora">LoRA</SelectItem>
                  <SelectItem value="dreambooth">Dreambooth</SelectItem>
                  <SelectItem value="textual_inversion">Textual Inversion</SelectItem>
                  <SelectItem value="checkpoint">Full Checkpoint</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataset-images">Images</Label>
              <Input
                id="dataset-images"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setSelectedFiles(e.target.files)}
              />
              {selectedFiles && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>

            <Button
              onClick={handleCreateDataset}
              disabled={!newDatasetName || !selectedFiles || isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create Dataset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Datasets List */}
      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">Loading datasets...</p>
        ) : datasets.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No datasets yet. Create one to get started!
          </p>
        ) : (
          datasets.map((dataset) => (
            <Card key={dataset.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{dataset.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(dataset.status)}>{dataset.status}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDataset(dataset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>{dataset.image_count} images</span>
                  </div>
                  <Badge variant="outline">{dataset.type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
