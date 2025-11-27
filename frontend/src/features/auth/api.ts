import { apiClient } from '../../shared/lib/api-client';
import type { Me } from '../../shared/types/api';

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  acсessToken: string;
}

export interface AuthTokens {
  acessToken: string;
}

export async function login(body: LoginBody): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body,
  });
}

export async function refresh(): Promise<AuthTokens> {
  return apiClient<AuthTokens>('/auth/refresh', {
    method: 'POST',
  });
}

export async function me(): Promise<Me> {
  return apiClient<Me>('/auth/me', {
    method: 'GET',
  });
}

export async function logout(): Promise<void> {
  return apiClient<void>('/auth/logout', {
    method: 'POST',
  });
}
