import { describe, it, expect } from 'vitest';
import { computeAccessiblePortals } from './authUtils';

describe('computeAccessiblePortals', () => {
  it('should grant CEO access to all portals', () => {
    const portals = computeAccessiblePortals('CEO', false);
    expect(portals).toContain('CEO');
    expect(portals).toContain('Manager');
    expect(portals).toContain('Teacher');
    expect(portals).toContain('Sales/HR');
    expect(portals).toContain('DM');
    expect(portals).toContain('Student');
  });

  it('should grant Sales access to only Sales by default', () => {
    const portals = computeAccessiblePortals('Sales/HR', false);
    expect(portals).toEqual(['Sales/HR']);
  });

  it('should grant Sales access to Teacher portal if assigned classes', () => {
    const portals = computeAccessiblePortals('Sales/HR', true);
    expect(portals).toContain('Sales/HR');
    expect(portals).toContain('Teacher');
  });

  it('should grant Manager access to Manager and Teacher by default (managers teach sometimes)', () => {
    const portals = computeAccessiblePortals('Manager', false);
    expect(portals).toContain('Manager');
  });

  it('should grant Teacher access to only Teacher by default', () => {
    const portals = computeAccessiblePortals('Teacher', false);
    expect(portals).toEqual(['Teacher']);
  });
});
