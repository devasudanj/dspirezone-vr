import type { Installation } from '../types';

export function isInstallationAvailable(status: Installation['installation_status']): boolean {
  return status === 'ACTIVE' || status === 'EXPIRING_SOON';
}

export function hasUsableInstallation(installations: Array<Pick<Installation, 'installation_status'>>): boolean {
  return installations.some((installation) => isInstallationAvailable(installation.installation_status));
}
