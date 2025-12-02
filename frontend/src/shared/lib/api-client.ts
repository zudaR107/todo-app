import { getAccessToken, setAccessToken } from './auth-storage';
import { getApiBaseUrl } from './env';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API error with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

export interface ApiClientOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuthRefresh?: boolean;
}

const API_BASE_URL = getApiBaseUrl();

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const url = `${API_BASE_URL}/auth/refresh`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      const contentType = response.headers.get('Content-Type') ?? '';
      let data: unknown;

      if (contentType.includes('application/json')) {
        data = (await response.json()) as unknown;
      } else {
        const text = await response.text();
        data = text || null;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setAccessToken(null);

          if (typeof window !== 'undefined') {
            const isAlreadyOnLogin = window.location.pathname.startsWith('/login');
            if (!isAlreadyOnLogin) {
              window.location.href = '/login';
            }
          }
        }

        throw new ApiError(response.status, data);
      }

      const parsed = data as { accessToken?: string } | null;
      const accessToken = parsed?.accessToken ?? null;

      if (accessToken) {
        setAccessToken(accessToken);
      } else {
        setAccessToken(null);
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiClient<TResponse>(
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const { body: rawBody, skipAuthRefresh, ...init } = options;

  const isLoginEndpoint = path.startsWith('/auth/login');
  const isRefreshEndpoint = path.startsWith('/auth/refresh');

  let hasRetried = false;

  async function doRequest(): Promise<TResponse> {
    const headers = new Headers(init.headers ?? {});
    headers.set('Accept', 'application/json');

    let body: BodyInit | undefined;
    if (rawBody !== undefined && rawBody !== null) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      body = JSON.stringify(rawBody);
    }

    const token = getAccessToken();

    if (!isLoginEndpoint && !isRefreshEndpoint && token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...init,
      headers,
      body,
      credentials: 'include',
    });

    const contentType = response.headers.get('Content-Type') ?? '';
    let data: unknown;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || null;
    }

    if (!response.ok) {
      throw new ApiError(response.status, data);
    }

    return data as TResponse;
  }

  try {
    return await doRequest();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      !skipAuthRefresh &&
      !isRefreshEndpoint &&
      !hasRetried
    ) {
      hasRetried = true;

      try {
        await refreshAccessToken();
      } catch {
        throw error;
      }

      return await doRequest();
    }

    throw error;
  }
}
