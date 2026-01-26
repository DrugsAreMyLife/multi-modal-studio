# TrainingMonitor Component

A real-time monitoring component for tracking active training jobs with live progress updates, elapsed time, and job management capabilities.

## Features

- **Real-time Progress Tracking**: Displays live progress bars with percentage indicators
- **Auto-refresh**: Automatically refreshes job status every 5 seconds
- **Job Metrics**: Shows current step count, total steps, and training loss
- **Elapsed Time**: Displays formatted elapsed time that updates every second
- **Job Cancellation**: Cancel active jobs with confirmation dialog
- **Status Badges**: Visual status indicators (Pending, Running, Completed, Failed, Cancelled)
- **Responsive Design**: Mobile-friendly grid layout
- **Empty State**: Helpful message when no active jobs exist

## Usage

```tsx
import { TrainingMonitor } from '@/components/training/TrainingMonitor';

export function TrainingDashboard() {
  return (
    <div className="space-y-6">
      <TrainingMonitor />
    </div>
  );
}
```

## Component Structure

### Main Component: `TrainingMonitor`

The root component that manages:

- Initial data fetching
- 5-second auto-refresh interval
- Job status polling
- Rendering job cards

### Sub-component: `JobCard`

Individual job card displaying:

- Job name and creation timestamp
- Status badge with icon
- Progress bar with percentage
- Metrics (elapsed time, steps, loss)
- Cancel button (for active jobs)

### Utility Functions

#### `formatElapsedTime(startedAt: string | null)`

Converts a start timestamp to formatted elapsed time (HH:MM:SS).

**Returns**: String in format `HH:MM:SS` or `--:--:--` if not started

#### `getStatusBadge(status: string)`

Returns badge styling configuration based on job status.

**Returns**: Object with `variant`, `icon`, and `text` properties

#### `useElapsedTime(startedAt: string | null)`

Custom hook that updates elapsed time display every second.

**Returns**: Formatted elapsed time string

## Props

The component uses data from `useTrainingStore` and doesn't accept any props:

```typescript
// Destructured from store
const {
  activeJobs, // TrainingJob[]
  fetchActiveJobs, // () => Promise<void>
  cancelJob, // (jobId: string) => Promise<void>
  pollJobStatus, // (jobId: string) => Promise<void>
} = useTrainingStore();
```

## TrainingJob Type Definition

```typescript
interface TrainingJob {
  id: string; // Unique job identifier
  name: string; // Human-readable job name
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // Progress percentage (0-100)
  currentStep?: number; // Current training step
  totalSteps?: number; // Total training steps
  currentLoss?: number; // Current loss value
  startedAt: string | null; // ISO timestamp when training started
  createdAt: string; // ISO timestamp when job was created
}
```

## Status Badges

| Status    | Variant     | Icon        | Polling |
| --------- | ----------- | ----------- | ------- |
| pending   | secondary   | Clock       | Yes     |
| queued    | secondary   | Clock       | Yes     |
| running   | default     | Zap         | Yes     |
| completed | default     | CheckCircle | No      |
| failed    | destructive | AlertCircle | No      |
| cancelled | outline     | XCircle     | No      |

## Behavior

### On Mount

1. Fetches active jobs
2. Sets up 5-second auto-refresh interval
3. Initializes component state

### Job Status Polling

- Only polls jobs with status: `pending`, `queued`, or `running`
- Polling calls `pollJobStatus()` for each active job
- The store manages polling intervals internally

### Auto-refresh

- Calls `fetchActiveJobs()` every 5 seconds
- Updates the entire jobs list
- Component cleans up interval on unmount

### Job Cancellation

1. User clicks cancel button
2. Confirmation dialog appears
3. If confirmed, calls `cancelJob(jobId)`
4. Dialog closes
5. Job status updates to `cancelled`

### Elapsed Time Updates

- Custom hook updates every second
- Only active for jobs where `startedAt` is set
- Stops updating after job completes or fails

## Styling

### Layout

- Main container uses `space-y-4` for vertical spacing
- Job cards use grid layout for responsive metrics
- Metrics displayed in 3-column grid on desktop

### Colors & Variants

- Status badges use shadcn Badge variants
- Progress bar uses default theme colors
- Icons from lucide-react for consistency

### Responsive

- Card layout adapts to screen size
- Metrics grid is 3 columns on desktop, responsive on mobile
- Cancel button is compact icon button (4x4)

## Performance Considerations

### Optimizations

1. **Interval Cleanup**: Auto-refresh and elapsed time intervals are properly cleaned up
2. **Limited Polling**: Only active jobs are polled
3. **Memoization**: Status badge function returns consistent objects
4. **Minimal Re-renders**: Separate JobCard components prevent unnecessary re-renders

### Performance Tips

- If you have many jobs, consider adding pagination or virtual scrolling
- Monitor interval count if polling many jobs simultaneously
- Consider WebSocket for lower latency updates vs 5-second polling

## Error Handling

### Job Cancellation Errors

- Errors during job cancellation are logged to console
- Error state sets `isCancelling` to false
- User can retry cancellation

### Fetch Errors

- Handled by the store
- Component gracefully displays whatever data is available
- Empty state shown if no jobs available

### Time Formatting Errors

- Try-catch block prevents crashes from invalid timestamps
- Defaults to `--:--:--` if timestamp parsing fails

## Accessibility

- Status badges include readable text labels
- Icon buttons have `title` attribute for tooltips
- Dialog has proper semantic structure
- Color not sole indicator of status (includes text and icons)
- Cancel button properly disabled during operation

## Testing

Unit tests cover:

- Empty state rendering
- Job card rendering
- Progress bar display
- Metrics display
- Job status polling
- Cancel button visibility
- Status badge variations

Run tests with:

```bash
npm test -- TrainingMonitor.test.tsx
```

## Dependencies

### Internal

- `@/lib/store/training-store` - Zustand store for training state
- `@/components/ui/*` - shadcn UI components:
  - Card (CardContent, CardHeader, CardTitle)
  - Progress
  - Button
  - Badge
  - Dialog (DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger)

### External

- `react` - React hooks (useEffect, useState)
- `lucide-react` - Icons (XCircle, CheckCircle, Clock, Zap, AlertCircle)

## Future Enhancements

1. **WebSocket Support**: Real-time updates without polling
2. **Job Filtering**: Filter by status, creation date, or name
3. **Job Search**: Search functionality for job names
4. **Sorting**: Sort by progress, creation time, or status
5. **Pagination**: Handle large numbers of jobs
6. **Virtual Scrolling**: Optimize rendering of many jobs
7. **Job Details**: Click to expand detailed job information
8. **Export Logs**: Download training logs
9. **Notifications**: Notify when jobs complete
10. **Performance Metrics**: Chart loss over time

## Troubleshooting

### Empty state showing when jobs exist

- Check if `fetchActiveJobs()` is being called
- Verify store has data with `console.log(activeJobs)`
- Check API endpoint `/api/training/jobs?status=active`

### Progress not updating

- Verify `pollJobStatus()` is implemented in store
- Check API endpoint `/api/training/status?job_id={jobId}`
- Ensure job status is `pending`, `queued`, or `running`

### Elapsed time not updating

- Check browser console for errors
- Verify `startedAt` timestamp is valid ISO format
- Ensure component hasn't been unmounted

### Cancel button not working

- Check if `cancelJob()` is properly implemented
- Verify API endpoint `/api/training/jobs/{jobId}/cancel`
- Check browser console for API errors

## License

Part of Multi-Modal Generation Studio project.
