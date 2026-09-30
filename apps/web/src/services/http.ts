import type { ApiErrorEnvelope, ApiMeta, ApiSuccessEnvelope } from '@payscope/types';

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
  /** Like get, but also returns the envelope's meta (page, total, ...). */
  getPage<T>(path: string): Promise<{ data: T; meta: ApiMeta }>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  delete(path: string): Promise<void>;
  /** A file the server sends as a body (for example a CSV), with the name it suggests. */
  download(path: string, accept: string): Promise<{ blob: Blob; filename: string }>;
}

/** Appends a query string, leaving out undefined, null and empty values. */
export function withQuery(
  path: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
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

  // Sends the request and returns the response only if it succeeded; every failure is an
  // ApiError or NetworkError, and a 401 on a request that carried a token ends the session.
  async function send(
    method: string,
    path: string,
    body?: unknown,
    accept = 'application/json',
  ): Promise<Response> {
    const token = options.getToken();
    const headers: Record<string, string> = { Accept: accept };
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
    return response;
  }

  async function envelope<T>(response: Response): Promise<ApiSuccessEnvelope<T> | undefined> {
    if (response.status === 204) return undefined;
    return (await response.json()) as ApiSuccessEnvelope<T>;
  }

  return {
    get: async <T>(path: string) => (await envelope<T>(await send('GET', path)))?.data as T,
    getPage: async <T>(path: string) => {
      const body = (await envelope<T>(await send('GET', path))) as ApiSuccessEnvelope<T>;
      return { data: body.data, meta: body.meta };
    },
    post: async <T>(path: string, body?: unknown) =>
      (await envelope<T>(await send('POST', path, body)))?.data as T,
    put: async <T>(path: string, body?: unknown) =>
      (await envelope<T>(await send('PUT', path, body)))?.data as T,
    delete: async (path) => {
      await send('DELETE', path);
    },
    download: async (path, accept) => {
      const response = await send('GET', path, undefined, accept);
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? 'download';
      return { blob: await response.blob(), filename };
    },
  };
}
