import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityLog } from './ActivityLog';
import * as activitiesApi from '../../lib/api/activities';

vi.mock('../../lib/api/activities', () => ({
  getActivitiesByLead: vi.fn(),
  getActivitiesByStudent: vi.fn(),
  createActivity: vi.fn(),
}));

describe('ActivityLog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(activitiesApi.getActivitiesByLead).mockReturnValue(new Promise(() => {})); // pending promise
    render(<ActivityLog entityType="lead" entityId="lead_123" />);
    expect(screen.getByText(/Loading activities.../i)).toBeInTheDocument();
  });

  it('renders empty state if no activities', async () => {
    vi.mocked(activitiesApi.getActivitiesByLead).mockResolvedValue([]);
    render(<ActivityLog entityType="lead" entityId="lead_123" />);
    
    await waitFor(() => {
      expect(screen.getByText(/No activities yet./i)).toBeInTheDocument();
    });
  });

  it('fetches and displays activities for lead', async () => {
    vi.mocked(activitiesApi.getActivitiesByLead).mockResolvedValue([
      { id: 'act_1', user_id: 'u1', type: 'Call', content: 'Followed up on pricing', created_at: '2026-07-08T10:00:00Z', user_name: 'John Doe' }
    ]);
    
    render(<ActivityLog entityType="lead" entityId="lead_123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Followed up on pricing')).toBeInTheDocument();
    });
    
    expect(activitiesApi.getActivitiesByLead).toHaveBeenCalledWith('lead_123');
  });

  it('allows adding a new activity', async () => {
    vi.mocked(activitiesApi.getActivitiesByLead).mockResolvedValue([]);
    vi.mocked(activitiesApi.createActivity).mockResolvedValue('act_new');
    
    render(<ActivityLog entityType="lead" entityId="lead_123" />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Activity details.../i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Activity details.../i);
    fireEvent.change(input, { target: { value: 'New note added' } });
    
    const button = screen.getByRole('button', { name: /add activity/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(activitiesApi.createActivity).toHaveBeenCalledWith({
        type: 'Call', // default
        content: 'New note added',
        lead_id: 'lead_123',
        student_id: null,
      });
    });
  });

  it('allows fetching activities for student', async () => {
    vi.mocked(activitiesApi.getActivitiesByStudent).mockResolvedValue([
      { id: 'act_2', user_id: 'u2', type: 'Meeting', content: 'Onboarding completed', created_at: '2026-07-08T12:00:00Z', user_name: 'Jane Smith' }
    ]);
    
    render(<ActivityLog entityType="student" entityId="std_456" />);
    
    await waitFor(() => {
      expect(screen.getByText('Onboarding completed')).toBeInTheDocument();
    });
    
    expect(activitiesApi.getActivitiesByStudent).toHaveBeenCalledWith('std_456');
  });
});
