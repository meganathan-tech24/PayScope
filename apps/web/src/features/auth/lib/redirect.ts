// After signing in, go back to where the visitor was heading, but only inside the app:
// anything else (another site, a protocol-relative address) falls back to /app.
export function safeRedirectTarget(from: unknown): string {
  if (typeof from === 'string' && from.startsWith('/app') && !from.startsWith('//')) return from;
  return '/app';
}
