import type { Role } from '@payscope/types';

// A statistic over one or two people is those people's salary. A VIEWER only
// sees groups at least this large; HR_MANAGER sees every group.
export const MIN_GROUP_SIZE_FOR_VIEWER = 5;

export function canSeeGroup(headcount: number, role: Role): boolean {
  return role === 'HR_MANAGER' || headcount >= MIN_GROUP_SIZE_FOR_VIEWER;
}

export function limitGroupsForRole<T extends { headcount: number }>(
  groups: T[],
  role: Role,
): { visible: T[]; suppressed: number } {
  const visible = groups.filter((group) => canSeeGroup(group.headcount, role));
  return { visible, suppressed: groups.length - visible.length };
}
