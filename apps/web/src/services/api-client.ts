import { env } from '../app/config/env';
import { tokenStorage } from '../features/auth/services/token-storage';

import { createHttpClient } from './http';

// The auth provider registers what happens when the server rejects the session.
let unauthorizedHandler: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler;
}

export const apiClient = createHttpClient({
  baseUrl: env.apiUrl,
  getToken: tokenStorage.get,
  onUnauthorized: () => unauthorizedHandler?.(),
});
