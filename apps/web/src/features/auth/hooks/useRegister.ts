import { useMutation } from '@tanstack/react-query';

import type { RegisterRequest } from '../services/auth.service';

import { useAuth } from './useAuth';

export function useRegister() {
  const { register } = useAuth();
  return useMutation({ mutationFn: (request: RegisterRequest) => register(request) });
}
