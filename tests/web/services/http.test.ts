import { describe, expect, it, vi } from 'vitest';

import {
  apiError,
  apiSuccess,
  jsonResponse,
  stubFetch,
  stubFetchNetworkFailure,
} from '@tests/helpers/fetch-mock.js';
import { ApiError, createHttpClient, NetworkError, withQuery } from '@web/services/http';

function build(token: string | null = null) {
  const onUnauthorized = vi.fn();
  const client = createHttpClient({
    baseUrl: 'http://api.test/v1/',
    getToken: () => token,
    onUnauthorized,
  });
  return { client, onUnauthorized };
}

describe('http client', () => {
  it('sends JSON to the base URL and unwraps the envelope data', async () => {
    const { calls } = stubFetch(() => apiSuccess({ ok: true }));
    const { client } = build();

    const data = await client.post('/things', { a: 1 });

    expect(data).toEqual({ ok: true });
    expect(calls[0]).toMatchObject({
      url: 'http://api.test/v1/things',
      method: 'POST',
      json: { a: 1 },
    });
    expect(calls[0]?.headers.get('Content-Type')).toBe('application/json');
  });

  it('adds the bearer token when there is one, and only then', async () => {
    const { calls } = stubFetch(() => apiSuccess({}));

    await build('abc.def').client.get('/me');
    await build(null).client.get('/me');

    expect(calls[0]?.headers.get('Authorization')).toBe('Bearer abc.def');
    expect(calls[1]?.headers.has('Authorization')).toBe(false);
  });

  it('turns an error envelope into an ApiError with status, code and request id', async () => {
    stubFetch(() => apiError(409, 'EMAIL_TAKEN', 'An account with this email already exists'));

    await expect(build().client.post('/auth/register', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      code: 'EMAIL_TAKEN',
      message: 'An account with this email already exists',
      requestId: 'req_test',
    });
  });

  it('still produces an ApiError when the body is not JSON', async () => {
    stubFetch(
      () => new Response('<html>Bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }),
    );

    const error = await build()
      .client.get('/x')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, code: 'HTTP_ERROR' });
  });

  it('reports an unreachable server as a NetworkError', async () => {
    stubFetchNetworkFailure();

    await expect(build().client.get('/x')).rejects.toBeInstanceOf(NetworkError);
  });

  it('calls onUnauthorized for a 401 on a request that carried a token', async () => {
    stubFetch(() => apiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    const { client, onUnauthorized } = build('expired.token');

    await expect(client.get('/employees')).rejects.toMatchObject({ status: 401 });

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not call onUnauthorized for a 401 without a token (a wrong password)', async () => {
    stubFetch(() => apiError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials'));
    const { client, onUnauthorized } = build(null);

    await expect(client.post('/auth/login', {})).rejects.toMatchObject({
      code: 'AUTH_INVALID_CREDENTIALS',
    });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not call onUnauthorized for other errors, even with a token', async () => {
    stubFetch(() => jsonResponse(403, { success: false, message: 'No', code: 'FORBIDDEN' }));
    const { client, onUnauthorized } = build('valid.token');

    await expect(client.get('/employees')).rejects.toMatchObject({ status: 403 });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('handles a 204 with no body', async () => {
    stubFetch(() => new Response(null, { status: 204 }));

    await expect(build().client.post('/x')).resolves.toBeUndefined();
  });
});

describe('http client, paging, writes and downloads', () => {
  it('getPage returns the data together with the paging meta', async () => {
    stubFetch(() =>
      jsonResponse(200, {
        success: true,
        data: [{ id: 'e1' }],
        meta: { requestId: 'req_test', page: 2, pageSize: 25, total: 60, totalPages: 3 },
      }),
    );

    const page = await build().client.getPage('/employees?page=2');

    expect(page.data).toEqual([{ id: 'e1' }]);
    expect(page.meta).toMatchObject({ page: 2, total: 60, totalPages: 3 });
  });

  it('sends PUT with a JSON body and DELETE with none, and accepts a 204', async () => {
    const { calls } = stubFetch((request) =>
      request.method === 'DELETE' ? new Response(null, { status: 204 }) : apiSuccess({ id: 'e1' }),
    );
    const { client } = build('valid.token');

    const updated = await client.put('/employees/e1', { fullName: 'Ada' });
    await expect(client.delete('/employees/e1')).resolves.toBeUndefined();

    expect(updated).toEqual({ id: 'e1' });
    expect(calls.map((c) => [c.method, c.json])).toEqual([
      ['PUT', { fullName: 'Ada' }],
      ['DELETE', undefined],
    ]);
    expect(calls[1]?.headers.get('Authorization')).toBe('Bearer valid.token');
  });

  it('downloads a file with the bearer token, the accept header and the suggested name', async () => {
    const { calls } = stubFetch(
      () =>
        new Response('id,fullName\r\ne1,Ada\r\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="employees-2026-09-30.csv"',
          },
        }),
    );

    const file = await build('valid.token').client.download('/employees/export.csv', 'text/csv');

    expect(file.filename).toBe('employees-2026-09-30.csv');
    expect(await file.blob.text()).toContain('e1,Ada');
    expect(calls[0]?.headers.get('Authorization')).toBe('Bearer valid.token');
    expect(calls[0]?.headers.get('Accept')).toBe('text/csv');
  });

  it('names a download "download" when the server suggests nothing', async () => {
    stubFetch(() => new Response('x', { status: 200 }));

    expect((await build().client.download('/x', 'text/csv')).filename).toBe('download');
  });

  it('applies the 401 rule to downloads and writes too', async () => {
    stubFetch(() => apiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    const { client, onUnauthorized } = build('expired.token');

    await expect(client.download('/employees/export.csv', 'text/csv')).rejects.toMatchObject({
      status: 401,
    });
    await expect(client.delete('/employees/e1')).rejects.toMatchObject({ status: 401 });

    expect(onUnauthorized).toHaveBeenCalledTimes(2);
  });
});

describe('withQuery', () => {
  it('drops empty, undefined and null values and encodes the rest', () => {
    expect(
      withQuery('/employees', {
        page: 2,
        search: 'o brien',
        country: '',
        jobTitle: undefined,
        x: null,
      }),
    ).toBe('/employees?page=2&search=o+brien');
  });

  it('returns the bare path when nothing is set', () => {
    expect(withQuery('/employees', { search: '' })).toBe('/employees');
  });
});
