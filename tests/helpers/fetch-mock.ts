import { vi } from 'vitest';

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Headers;
  json: unknown;
}

export type FetchHandler = (request: RecordedRequest) => Response | Promise<Response>;

export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const apiSuccess = (data: unknown, status = 200): Response =>
  jsonResponse(status, { success: true, data, meta: { requestId: 'req_test' } });

export const apiError = (status: number, code: string, message: string): Response =>
  jsonResponse(status, { success: false, message, code, requestId: 'req_test' });

// Replaces fetch for one test; returns the recorded calls. The global setup restores it.
export function stubFetch(handler: FetchHandler): { calls: RecordedRequest[] } {
  const calls: RecordedRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request: RecordedRequest = {
        url: String(input),
        method: init?.method ?? 'GET',
        headers: new Headers(init?.headers),
        json: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      };
      calls.push(request);
      return handler(request);
    }),
  );
  return { calls };
}

export function stubFetchNetworkFailure(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }),
  );
}
