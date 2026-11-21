/**
 * Typed client for the API. Relative URLs: Vite proxies /v1 to the API in dev/preview.
 * Types are imported type-only from shared packages (erased at build time).
 * The session cookie is httpOnly and sent automatically (same origin).
 */
import type {
  ApiError,
  AuthSessionResponse,
  CompleteRequest,
  DailyStudyResponse,
  ImportRequest,
  ImportResponse,
  OptionsResponse,
  ProfileResponse,
  ProgressPath,
  ProgressResponse,
  MusarNextResponse,
  PathOutlineResponse,
  SiddurNextResponse,
  SourcesResponse,
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

let onUnauthorized: () => void = () => {};
/** Called whenever a request returns 401 (e.g. the session expired); App shows the login screen. */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/v1/auth/')) onUnauthorized();
    throw new ApiRequestError(res.status, body as ApiError);
  }
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** GET /v1/{path}/next with the profile's interests and display settings; null on 404 (finished or no interest). */
async function pathNext<T>(path: 'siddur' | 'musar', profile: UserProfile): Promise<T | null> {
  const params = new URLSearchParams({
    interests: profile.interests.join(','),
    languageMode: profile.languageMode,
    showCantillation: String(profile.showCantillation ?? false),
    divineName: profile.divineName ?? 'abbreviated',
  });
  try {
    return await request<T>(`/v1/${path}/next?${params}`);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null;
    throw err;
  }
}

export const api = {
  session: () => request<AuthSessionResponse>('/v1/auth/session'),
  login: (passphrase: string) => request<{ ok: true }>('/v1/auth/login', json('POST', { passphrase })),
  logout: () => request<{ ok: true }>('/v1/auth/logout', json('POST', {})),

  uiStrings: () => request<UiStrings>('/v1/ui-strings'),
  options: () => request<OptionsResponse>('/v1/options'),
  sources: () => request<SourcesResponse>('/v1/sources'),

  getProfile: () => request<ProfileResponse>('/v1/profile'),
  saveProfile: (profile: UserProfile) => request<ProfileResponse>('/v1/profile', json('PUT', profile)),

  dailyStudy: (profile: UserProfile, date: string) =>
    request<DailyStudyResponse>('/v1/study/daily', json('POST', { profile, date })),

  /** Completed units come from the server. Resolves to null when the path is complete or there is no Siddur interest (404). */
  siddurNext: (profile: UserProfile) => pathNext<SiddurNextResponse>('siddur', profile),

  /** Same contract as siddurNext, for the Musar path (Mesillat Yesharim, then Pirkei Avot). */
  musarNext: (profile: UserProfile) => pathNext<MusarNextResponse>('musar', profile),

  /** Every unit of a path, by section, with completion (for section progress). */
  outline: (path: 'siddur' | 'musar') => request<PathOutlineResponse>(`/v1/${path}/outline`),

  progress: (from?: string, to?: string) => {
    const params = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
    return request<ProgressResponse>(`/v1/progress?${params}`);
  },
  complete: (body: CompleteRequest) => request<{ ok: true }>('/v1/progress/complete', json('POST', body)),
  uncomplete: (body: CompleteRequest) => request<{ ok: true }>('/v1/progress/complete', json('DELETE', body)),
  resetPath: (path: ProgressPath) => request<{ ok: true; removed: number }>('/v1/progress/reset', json('POST', { path })),
  importLocal: (body: ImportRequest) => request<ImportResponse>('/v1/progress/import', json('POST', body)),
};
