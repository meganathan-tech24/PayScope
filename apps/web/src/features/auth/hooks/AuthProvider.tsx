import type { AuthResult, AuthUser } from '@payscope/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setUnauthorizedHandler } from '../../../services/api-client';
import { authService, type LoginRequest, type RegisterRequest } from '../services/auth.service';
import { tokenStorage } from '../services/token-storage';

import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // With no stored token there is nothing to check, so start signed out (no flash of a spinner).
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? 'loading' : 'unauthenticated',
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notice, setNotice] = useState<'expired' | null>(null);

  const endSession = useCallback(
    (reason: 'logout' | 'expired') => {
      tokenStorage.clear();
      queryClient.clear();
      setUser(null);
      setStatus('unauthenticated');
      setNotice(reason === 'expired' ? 'expired' : null);
    },
    [queryClient],
  );

  // Any request that carried a token and came back 401 ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => endSession('expired'));
    return () => setUnauthorizedHandler(undefined);
  }, [endSession]);

  // On load, trust the server, not the stored token: ask who the token belongs to.
  // The role always comes from this answer (or a login response), never from decoding the token.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let cancelled = false;
    authService
      .currentUser()
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        setStatus('authenticated');
      })
      .catch(() => {
        // A 401 has already ended the session through the interceptor. Anything else
        // (server down) keeps the token, so a reload can try again, and shows signed out.
        if (!cancelled) setStatus((s) => (s === 'loading' ? 'unauthenticated' : s));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((result: AuthResult) => {
    tokenStorage.set(result.token);
    setUser(result.user);
    setNotice(null);
    setStatus('authenticated');
    return result;
  }, []);

  const login = useCallback(
    async (request: LoginRequest) => signIn(await authService.login(request)),
    [signIn],
  );
  const register = useCallback(
    async (request: RegisterRequest) => signIn(await authService.register(request)),
    [signIn],
  );
  const logout = useCallback(() => endSession('logout'), [endSession]);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, notice, login, register, logout, dismissNotice }),
    [status, user, notice, login, register, logout, dismissNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
