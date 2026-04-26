/**
 * src/api/client.ts
 * -----------------
 * Axios instance pre-configured for the Dspire VR Zone FastAPI backend.
 * The base URL is read from the Expo environment variable so it can be
 * changed per build profile without code changes.
 */
import axios from 'axios';

// Expo sets EXPO_PUBLIC_* variables into process.env at build time.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Global response error handler – surfaces backend error details to callers
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail: string =
      error?.response?.data?.detail ??
      error?.message ??
      'An unknown error occurred';
    return Promise.reject(new Error(detail));
  },
);

export default apiClient;
