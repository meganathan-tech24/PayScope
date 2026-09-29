import { describe, expect, it } from 'vitest';

import { isApiError, isApiSuccess, type ApiEnvelope } from '../index.js';

describe('api envelope type guards', () => {
  it('narrows a success envelope', () => {
    const envelope: ApiEnvelope<{ id: string }> = {
      success: true,
      data: { id: '1' },
      meta: { requestId: 'req_1' },
    };

    expect(isApiSuccess(envelope)).toBe(true);
    expect(isApiError(envelope)).toBe(false);
  });

  it('narrows an error envelope', () => {
    const envelope: ApiEnvelope<never> = {
      success: false,
      message: 'Invalid credentials',
      code: 'AUTH_INVALID_CREDENTIALS',
      requestId: 'req_2',
    };

    expect(isApiError(envelope)).toBe(true);
    expect(isApiSuccess(envelope)).toBe(false);
  });
});
