import { getAccessToken } from "./auth-storage";
import { getApiBaseUrl } from "./env";

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
}

const API_BASE_URL = getApiBaseUrl();

export async function apiClient<TResponse>(
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers ?? {});
  headers.set('Accept', 'application/json');

  let body: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(options.body);
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
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
};
