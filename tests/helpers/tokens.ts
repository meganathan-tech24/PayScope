import type { Role } from '@payscope/types';

import { signToken } from '@api/lib/jwt.js';

// authenticate trusts the signed payload (no DB read), so tests can hand-sign a
// token for any role without creating a user.
export const bearer = (role: Role, sub = `${role.toLowerCase()}-user`): string =>
  `Bearer ${signToken({ sub, role })}`;

export const hrAuth = bearer('HR_MANAGER');
export const viewerAuth = bearer('VIEWER');
