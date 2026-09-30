import type { AuthResult, AuthUser } from '@payscope/types';
import { createContext } from 'react';

import type { LoginRequest, RegisterRequest } from '../services/auth.service';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Set when the server ended the session (an expired token), shown on the login page. */
  notice: 'expired' | null;
  login: (request: LoginRequest) => Promise<AuthResult>;
  register: (request: RegisterRequest) => Promise<AuthResult>;
  logout: () => void;
  dismissNotice: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
