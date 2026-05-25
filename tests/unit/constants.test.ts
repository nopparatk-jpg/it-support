import { describe, it, expect } from 'vitest';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  DEVICE_STATUS_OPTIONS,
  DEVICE_STATUS_LABELS,
  LICENSE_STATUS_OPTIONS,
  ACTION_LABELS,
} from '@/lib/constants';

describe('constants', () => {
  it('all STATUS_OPTIONS have labels', () => {
    for (const s of STATUS_OPTIONS) {
      expect(STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it('all PRIORITY_OPTIONS have labels', () => {
    for (const p of PRIORITY_OPTIONS) {
      expect(PRIORITY_LABELS[p]).toBeTruthy();
    }
  });

  it('all DEVICE_STATUS_OPTIONS have labels', () => {
    for (const s of DEVICE_STATUS_OPTIONS) {
      expect(DEVICE_STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it('LICENSE_STATUS_OPTIONS are defined', () => {
    expect(LICENSE_STATUS_OPTIONS).toContain('active');
    expect(LICENSE_STATUS_OPTIONS).toContain('expired');
    expect(LICENSE_STATUS_OPTIONS).toContain('cancelled');
  });

  it('ACTION_LABELS covers key actions', () => {
    const requiredActions = [
      'ticket.create', 'ticket.update', 'ticket.delete',
      'user.create', 'user.update', 'user.delete', 'user.import',
      'device.create', 'device.update', 'device.delete', 'device.import',
      'license.create', 'license.update', 'license.import', 'license.delete',
    ];
    for (const action of requiredActions) {
      expect(ACTION_LABELS[action], `Missing label for ${action}`).toBeTruthy();
    }
  });
});
