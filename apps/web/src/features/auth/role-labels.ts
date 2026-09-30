import type { Role } from '@payscope/types';

export const ROLE_LABEL: Record<Role, string> = {
  HR_MANAGER: 'HR Manager',
  VIEWER: 'Viewer',
};

export const ROLE_SUMMARY: Record<Role, string> = {
  HR_MANAGER:
    'You can manage employees and see every pay figure, including individual salaries, outliers and CSV export.',
  VIEWER:
    'You can browse the employee directory and aggregated pay statistics. Individual salaries are never shown to your account, and you cannot change data.',
};
