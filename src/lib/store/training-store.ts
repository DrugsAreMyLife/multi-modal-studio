import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dataset, TrainingJob, TrainedModel } from '@/lib/db/training';

interface TrainingStore {
  // State
  datasets: Dataset[];
  activeJobs: TrainingJob[];
  trainedModels: TrainedModel[];
  selectedDatasetId: string | null;
  isLoading: boolean;

  // Dataset actions
  fetchDatasets: () => Promise<void>;
  createDataset: (formData: FormData) => Promise<Dataset>;
  deleteDataset: (datasetId: string) => Promise<void>;
  setSelectedDataset: (datasetId: string | null) => void;

  // Training job actions
  fetchActiveJobs: () => Promise<void>;
  submitTraining: (config: {
    datasetId: string;
    name: string;
    type: string;
    baseModel: string;
    config: Record<string, unknown>;
  }) => Promise<TrainingJob>;
  cancelJob: (jobId: string) => Promise<void>;
  pollJobStatus: (jobId: string) => Promise<void>;

  // Trained models actions
  fetchTrainedModels: () => Promise<void>;
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      datasets: [],
      activeJobs: [],
      trainedModels: [],
      selectedDatasetId: null,
      isLoading: false,

      // Fetch datasets
      fetchDatasets: async () => {
        try {
          set({ isLoading: true });
          const response = await fetch('/api/datasets');
          if (!response.ok) throw new Error('Failed to fetch datasets');

          const datasets = await response.json();
          set({ datasets, isLoading: false });
        } catch (error) {
          console.error('[TrainingStore] Fetch datasets error:', error);
          set({ isLoading: false });
        }
      },

      // Create dataset
      createDataset: async (formData: FormData) => {
        try {
          const response = await fetch('/api/datasets/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create dataset');
          }

          const result = await response.json();

          // Refresh datasets list
          await get().fetchDatasets();

          return result;
        } catch (error) {
          console.error('[TrainingStore] Create dataset error:', error);
          throw error;
        }
      },

      // Delete dataset
      deleteDataset: async (datasetId: string) => {
        try {
          const response = await fetch(`/api/datasets/${datasetId}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Failed to delete dataset');

          // Remove from local state
          set((state) => ({
            datasets: state.datasets.filter((d) => d.id !== datasetId),
            selectedDatasetId:
              state.selectedDatasetId === datasetId ? null : state.selectedDatasetId,
          }));
        } catch (error) {
          console.error('[TrainingStore] Delete dataset error:', error);
          throw error;
        }
      },

      // Set selected dataset
      setSelectedDataset: (datasetId: string | null) => {
        set({ selectedDatasetId: datasetId });
      },

      // Fetch active training jobs
      fetchActiveJobs: async () => {
        try {
          const response = await fetch('/api/training/jobs?status=active');
          if (!response.ok) throw new Error('Failed to fetch active jobs');

          const jobs = await response.json();
          set({ activeJobs: jobs });
        } catch (error) {
          console.error('[TrainingStore] Fetch active jobs error:', error);
        }
      },

      // Submit training job
      submitTraining: async (config) => {
        try {
          const response = await fetch('/api/training/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit training job');
          }

          const job = await response.json();

          // Add to active jobs
          set((state) => ({
            activeJobs: [job, ...state.activeJobs],
          }));

          // Start polling for this job
          get().pollJobStatus(job.id);

          return job;
        } catch (error) {
          console.error('[TrainingStore] Submit training error:', error);
          throw error;
        }
      },

      // Cancel training job
      cancelJob: async (jobId: string) => {
        try {
          const response = await fetch(`/api/training/jobs/${jobId}/cancel`, {
            method: 'POST',
          });

          if (!response.ok) throw new Error('Failed to cancel job');

          // Update local state
          set((state) => ({
            activeJobs: state.activeJobs.map((job) =>
              job.id === jobId ? { ...job, status: 'cancelled' as const } : job,
            ),
          }));
        } catch (error) {
          console.error('[TrainingStore] Cancel job error:', error);
          throw error;
        }
      },

      // Poll job status
      pollJobStatus: async (jobId: string) => {
        try {
          const response = await fetch(`/api/training/status?job_id=${jobId}`);
          if (!response.ok) return;

          const status = await response.json();

          // Update job in state
          set((state) => ({
            activeJobs: state.activeJobs.map((job) =>
              job.id === jobId ? { ...job, ...status } : job,
            ),
          }));

          // Continue polling if still active
          if (['pending', 'queued', 'running'].includes(status.status)) {
            setTimeout(() => get().pollJobStatus(jobId), 5000);
          } else if (status.status === 'completed') {
            // Refresh trained models when job completes
            get().fetchTrainedModels();
          }
        } catch (error) {
          console.error('[TrainingStore] Poll job status error:', error);
        }
      },

      // Fetch trained models
      fetchTrainedModels: async () => {
        try {
          const response = await fetch('/api/training/models');
          if (!response.ok) throw new Error('Failed to fetch trained models');

          const models = await response.json();
          set({ trainedModels: models });
        } catch (error) {
          console.error('[TrainingStore] Fetch trained models error:', error);
        }
      },
    }),
    {
      name: 'training-storage',
      partialize: (state) => ({
        selectedDatasetId: state.selectedDatasetId,
      }),
    },
  ),
);
