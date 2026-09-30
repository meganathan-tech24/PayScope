// The only place that touches where the session token lives. It is kept in
// localStorage (see docs/design-notes.md for why, and what would replace it), so
// moving to another store later is a change to this file alone.
export const TOKEN_KEY = 'payscope.token';

export const tokenStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage blocked (private mode, quota): the session lasts until the page closes.
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
