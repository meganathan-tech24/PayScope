import jsonwebtoken from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { config } from '../../app/config/config.js';
import { signToken, verifyToken } from '../jwt.js';

describe('signToken / verifyToken', () => {
  it('round-trips a payload', () => {
    const token = signToken({ sub: 'user-1', role: 'HR_MANAGER' });

    expect(verifyToken(token)).toEqual({ sub: 'user-1', role: 'HR_MANAGER' });
  });

  it('rejects a tampered token', () => {
    const token = signToken({ sub: 'user-1', role: 'HR_MANAGER' });
    const tampered = `${token.slice(0, -2)}xx`;

    expect(() => verifyToken(tampered)).toThrow();
  });

  it('rejects an expired token', () => {
    const expired = jsonwebtoken.sign({ sub: 'user-1', role: 'HR_MANAGER' }, config.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: -10,
    });

    expect(() => verifyToken(expired)).toThrow(jsonwebtoken.TokenExpiredError);
  });

  it('rejects a token signed with a different algorithm (alg: none)', () => {
    const noneAlgToken = jsonwebtoken.sign({ sub: 'user-1', role: 'HR_MANAGER' }, '', {
      algorithm: 'none',
    });

    expect(() => verifyToken(noneAlgToken)).toThrow();
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jsonwebtoken.sign(
      { sub: 'user-1', role: 'HR_MANAGER' },
      'a-completely-different-secret-not-ours-at-all-32chars',
      { algorithm: 'HS256' },
    );

    expect(() => verifyToken(forged)).toThrow();
  });

  it('rejects a malformed token string', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });
});
