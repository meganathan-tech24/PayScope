import type { AuthResult, AuthUser } from '@payscope/types';

import { apiClient } from '../../../services/api-client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  role: 'HR_MANAGER' | 'VIEWER';
}

export const authService = {
  login: (request: LoginRequest) => apiClient.post<AuthResult>('/auth/login', request),
  register: (request: RegisterRequest) => apiClient.post<AuthResult>('/auth/register', request),
  currentUser: () => apiClient.get<AuthUser>('/auth/me'),
};
