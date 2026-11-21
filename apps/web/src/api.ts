/**
 * Typed client for the API. Relative URLs: Vite proxies /v1 to the API in dev/preview.
 * Types are imported type-only from shared packages (erased at build time).
 */
import type {
  ApiError,
  DailyStudyResponse,
  OptionsResponse,
  SiddurNextResponse,
  UserProfile,
} from '@torah/core';
import type { UiStrings } from '@torah/content';

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiError
  ) {
    super(body.error);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new ApiRequestError(res.status, body as ApiError);
  return body as T;
}

export const api = {
  uiStrings: () => request<UiStrings>('/v1/ui-strings'),
  options: () => request<OptionsResponse>('/v1/options'),
  dailyStudy: (profile: UserProfile, date: string) =>
    request<DailyStudyResponse>('/v1/study/daily', { method: 'POST', body: JSON.stringify({ profile, date }) }),
  /** Resolves to null when the path is complete or the user has no Siddur interest (404). */
  siddurNext: async (profile: UserProfile, completed: string[]): Promise<SiddurNextResponse | null> => {
    const params = new URLSearchParams({
      completed: completed.join(','),
      interests: profile.interests.join(','),
      languageMode: profile.languageMode,
    });
    try {
      return await request<SiddurNextResponse>(`/v1/siddur/next?${params}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) return null;
      throw err;
    }
  },
};
