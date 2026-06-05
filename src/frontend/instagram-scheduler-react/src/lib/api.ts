const BASE = '/api';

let _getToken: (() => string | undefined) | null = null;
let _getRefreshToken: (() => string | undefined) | null = null;
let _updateTokens: ((token: string, refreshToken?: string) => void) | null = null;
let _logout: (() => void) | null = null;

export function configureApi(opts: {
  getToken: () => string | undefined;
  getRefreshToken: () => string | undefined;
  updateTokens: (token: string, refreshToken?: string) => void;
  logout: () => void;
}) {
  _getToken = opts.getToken;
  _getRefreshToken = opts.getRefreshToken;
  _updateTokens = opts.updateTokens;
  _logout = opts.logout;
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = _getRefreshToken?.();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    _updateTokens?.(data.token, data.refreshToken);
    return data.token;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = _getToken?.();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshTokens();
    if (newToken) return request<T>(path, init, false);
    _logout?.();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.error ?? err.message ?? message;
    } catch { /* empty */ }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  upload: async <T>(path: string, file: File): Promise<T> => {
    const token = _getToken?.();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.error ?? `Upload failed`);
    }
    return res.json();
  },
};
