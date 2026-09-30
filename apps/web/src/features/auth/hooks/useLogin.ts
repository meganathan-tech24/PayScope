import { useMutation } from '@tanstack/react-query';

import type { LoginRequest } from '../services/auth.service';

import { useAuth } from './useAuth';

export function useLogin() {
  const { login } = useAuth();
  return useMutation({ mutationFn: (request: LoginRequest) => login(request) });
}
