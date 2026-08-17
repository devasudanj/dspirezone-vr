/**
 * src/api/vrClient.ts
 * --------------------
 * Axios client for VR game/session APIs.
 *
 * This allows VR and Nex flows to target different backend hosts.
 */
import axios from 'axios';

const VR_BASE_URL =
  process.env.EXPO_PUBLIC_VR_API_BASE_URL ??
  'https://www.dspirezone.com';

const vrClient = axios.create({
  baseURL: VR_BASE_URL,
  timeout: 8_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function normalizeErrorDetail(detail: unknown): string {
  if (typeof detail === 'string' && detail.trim().length > 0) return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
          const message = (entry as { msg?: unknown }).msg;
          if (typeof message === 'string') return message;
        }
        return JSON.stringify(entry);
      })
      .join('; ');
  }
  if (detail && typeof detail === 'object') {
    const message = (detail as { message?: unknown; detail?: unknown; msg?: unknown }).message
      ?? (detail as { detail?: unknown }).detail
      ?? (detail as { msg?: unknown }).msg;
    if (typeof message === 'string' && message.trim().length > 0) return message;
    return JSON.stringify(detail);
  }
  return 'An unknown error occurred';
}

vrClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = normalizeErrorDetail(error?.response?.data?.detail ?? error?.message);
    return Promise.reject(new Error(detail));
  },
);

export default vrClient;
