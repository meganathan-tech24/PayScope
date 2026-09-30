import type { ApiErrorEnvelope, ApiSuccessEnvelope } from '@payscope/types';

// The server answered with an error envelope (or something that is not JSON).
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

// The request never got an answer (offline, DNS, CORS, server down).
export class NetworkError extends Error {
  constructor() {
    super('Could not reach the server');
    this.name = 'NetworkError';
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  getToken: () => string | null;
  /** Called when a request that carried a token comes back 401 (expired or revoked). */
  onUnauthorized: () => void;
}

export interface HttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
}

async function readError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorEnvelope>;
    return new ApiError(
      response.status,
      body.code ?? 'HTTP_ERROR',
      body.message ?? response.statusText,
      body.requestId,
    );
  } catch {
    return new ApiError(response.status, 'HTTP_ERROR', response.statusText || 'Request failed');
  }
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = options.getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new NetworkError();
    }

    if (!response.ok) {
      // A 401 for a request that sent a token means the session is over. A 401 for
      // one that did not (a wrong password) is an ordinary form error.
      if (response.status === 401 && token) options.onUnauthorized();
      throw await readError(response);
    }

    if (response.status === 204) return undefined as T;
    return ((await response.json()) as ApiSuccessEnvelope<T>).data;
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
  };
}
