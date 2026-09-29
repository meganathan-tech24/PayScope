import jwt from 'jsonwebtoken';

import { config } from '../app/config/config.js';

const ALGORITHM = 'HS256';

export interface AuthTokenPayload {
  sub: string;
  role: string;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: [ALGORITHM] });

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.role !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid token payload');
  }

  return { sub: decoded.sub, role: decoded.role };
}
