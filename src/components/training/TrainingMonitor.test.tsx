import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrainingMonitor } from './TrainingMonitor';
import { useTrainingStore } from '@/lib/store/training-store';

// Mock the store
jest.mock('@/lib/store/training-store');

describe('TrainingMonitor', () => {
  const mockFetchActiveJobs = jest.fn();
  const mockCancelJob = jest.fn();
  const mockPollJobStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: [],
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });
  });

  it('renders empty state when no active jobs', () => {
    render(<TrainingMonitor />);
    expect(screen.getByText('No Active Training Jobs')).toBeInTheDocument();
    expect(screen.getByText('Start a new training job to see progress here')).toBeInTheDocument();
  });

  it('fetches active jobs on mount', () => {
    render(<TrainingMonitor />);
    expect(mockFetchActiveJobs).toHaveBeenCalled();
  });

  it('renders job cards for active jobs', () => {
    const mockJobs = [
      {
        id: 'job-1',
        name: 'Fine-tune Model v1',
        status: 'running' as const,
        progress: 45,
        currentStep: 450,
        totalSteps: 1000,
        currentLoss: 0.245,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: mockJobs,
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });

    render(<TrainingMonitor />);
    expect(screen.getByText('Fine-tune Model v1')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('displays progress bar with percentage', () => {
    const mockJobs = [
      {
        id: 'job-1',
        name: 'Fine-tune Model v1',
        status: 'running' as const,
        progress: 75,
        currentStep: 750,
        totalSteps: 1000,
        currentLoss: 0.15,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: mockJobs,
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });

    render(<TrainingMonitor />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays metrics correctly', () => {
    const mockJobs = [
      {
        id: 'job-1',
        name: 'Fine-tune Model v1',
        status: 'running' as const,
        progress: 45,
        currentStep: 450,
        totalSteps: 1000,
        currentLoss: 0.245,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: mockJobs,
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });

    render(<TrainingMonitor />);
    expect(screen.getByText('Steps')).toBeInTheDocument();
    expect(screen.getByText('450 / 1,000')).toBeInTheDocument();
    expect(screen.getByText('Loss')).toBeInTheDocument();
    expect(screen.getByText('0.2450')).toBeInTheDocument();
  });

  it('polls job status for active jobs', () => {
    const mockJobs = [
      {
        id: 'job-1',
        name: 'Fine-tune Model v1',
        status: 'running' as const,
        progress: 45,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: mockJobs,
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });

    render(<TrainingMonitor />);
    expect(mockPollJobStatus).toHaveBeenCalledWith('job-1');
  });

  it('does not poll jobs that are not active', () => {
    const mockJobs = [
      {
        id: 'job-1',
        name: 'Completed Job',
        status: 'completed' as const,
        progress: 100,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: mockJobs,
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });

    render(<TrainingMonitor />);
    expect(mockPollJobStatus).not.toHaveBeenCalledWith('job-1');
  });

  it('shows cancel button only for active jobs', () => {
    const mockJobs = [
      {
        id: 'job-1',
        name: 'Running Job',
        status: 'running' as const,
        progress: 45,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'job-2',
        name: 'Completed Job',
        status: 'completed' as const,
        progress: 100,
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: mockJobs,
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });

    render(<TrainingMonitor />);
    const cancelButtons = screen.getAllByTitle('Cancel training job');
    expect(cancelButtons).toHaveLength(1);
  });

  it('displays appropriate status badges', () => {
    const mockJobs = [
      {
        id: 'job-1',
        name: 'Pending Job',
        status: 'pending' as const,
        progress: 0,
        startedAt: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'job-2',
        name: 'Running Job',
        status: 'running' as const,
        progress: 50,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'job-3',
        name: 'Failed Job',
        status: 'failed' as const,
        progress: 30,
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    (useTrainingStore as unknown as jest.Mock).mockReturnValue({
      activeJobs: mockJobs,
      fetchActiveJobs: mockFetchActiveJobs,
      cancelJob: mockCancelJob,
      pollJobStatus: mockPollJobStatus,
    });

    render(<TrainingMonitor />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
