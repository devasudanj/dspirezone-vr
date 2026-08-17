/**
 * __tests__/installationStatus.test.ts
 * -----------------------------------
 * Ensures session start remains available when a game has valid installations.
 */
import { hasUsableInstallation, isInstallationAvailable } from '../src/utils/installationStatus';

describe('installation status helpers', () => {
  it('treats active and expiring-soon installs as usable', () => {
    expect(isInstallationAvailable('ACTIVE')).toBe(true);
    expect(isInstallationAvailable('EXPIRING_SOON')).toBe(true);
    expect(isInstallationAvailable('EXPIRED')).toBe(false);
  });

  it('allows session start when at least one non-expired installation exists', () => {
    const installations = [
      { installation_status: 'EXPIRED' },
      { installation_status: 'EXPIRING_SOON' },
    ] as any[];

    expect(hasUsableInstallation(installations)).toBe(true);
  });
});
