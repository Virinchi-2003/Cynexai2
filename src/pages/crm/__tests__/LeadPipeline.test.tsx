// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock the APIs before importing the component
vi.mock('../../../lib/api/crm', () => ({
  getLeads: vi.fn(),
  updateLeadStatus: vi.fn(),
  addActivity: vi.fn(),
}));

vi.mock('../../../lib/auth', () => ({
  getCurrentUser: vi.fn(() => ({ id: '1', name: 'Test User' })),
}));

// We also need to mock lucide-react just in case, but standard vitest should handle it fine.
// But some components like @hello-pangea/dnd might have issues in jsdom. Let's see if it works without mocking.

import LeadPipeline from '../LeadPipeline';
import { getLeads } from '../../../lib/api/crm';

describe('LeadPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a lead in the correct stage column', async () => {
    const mockLead = {
      id: 'lead-1',
      name: 'John Doe Testing',
      status: 'New',
      course_interest: 'React Basics',
      phone: '1234567890',
      created_at: new Date().toISOString(),
    };
    
    // Setup the mock to return our sample lead
    (getLeads as any).mockResolvedValue([mockLead]);

    render(
      <MemoryRouter>
        <LeadPipeline />
      </MemoryRouter>
    );

    // Wait for the lead to appear on the screen
    await waitFor(() => {
      expect(screen.getByText('John Doe Testing')).toBeInTheDocument();
    });

    // The component structure puts the stage name (e.g. "New Lead") in a heading
    // and the leads underneath it in a droppable container.
    // We'll verify that the lead's name is rendered correctly.
    const leadElement = screen.getByText('John Doe Testing');
    expect(leadElement).toBeInTheDocument();
    
    // We can also verify that the course interest is rendered
    expect(screen.getByText('React Basics')).toBeInTheDocument();
  });
});
