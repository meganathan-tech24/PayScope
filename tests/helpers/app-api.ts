import type { RecordedRequest } from './fetch-mock.js';
import { apiSuccess, jsonResponse, stubFetch } from './fetch-mock.js';

export type TestRole = 'HR_MANAGER' | 'VIEWER';

let counter = 0;

// One employee as the API returns it: HR gets `salary`, a VIEWER does not have the key.
export function employeeJson(
  overrides: Record<string, unknown> = {},
  role: TestRole = 'HR_MANAGER',
) {
  counter += 1;
  const { salary, ...directory } = {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    fullName: `Person ${counter}`,
    email: `person${counter}@example.com`,
    jobTitle: 'Engineer',
    department: 'Engineering',
    country: 'GB',
    currency: 'GBP',
    salary: 9_000_000,
    employmentType: 'FULL_TIME',
    hireDate: '2020-01-15T00:00:00.000Z',
    createdAt: '2020-02-01T00:00:00.000Z',
    updatedAt: '2020-02-01T00:00:00.000Z',
    ...overrides,
  };
  return role === 'HR_MANAGER' ? { ...directory, salary } : directory;
}

export const listPage = (
  employees: unknown[],
  meta: { page?: number; total?: number; totalPages?: number } = {},
) =>
  jsonResponse(200, {
    success: true,
    data: employees,
    meta: {
      requestId: 'req_test',
      page: 1,
      pageSize: 25,
      total: employees.length,
      totalPages: 1,
      ...meta,
    },
  });

export interface AppApiOptions {
  role: TestRole;
  /** Handles GET /employees; defaults to an empty page. */
  list?: (request: RecordedRequest) => Response | Promise<Response>;
  /** Handles anything else (writes, export, insights). Return undefined to fall through. */
  other?: (request: RecordedRequest) => Response | undefined | Promise<Response | undefined>;
}

const OPTIONS: Record<string, { key: string; headcount: number }[]> = {
  country: [
    { key: 'GB', headcount: 5 },
    { key: 'DE', headcount: 3 },
    { key: 'JP', headcount: 2 },
  ],
  department: [
    { key: 'Engineering', headcount: 6 },
    { key: 'Finance', headcount: 4 },
  ],
  jobTitle: [
    { key: 'Analyst', headcount: 4 },
    { key: 'Engineer', headcount: 6 },
  ],
};

// Stubs the API the signed-in app talks to: who you are, the filter options, the list, the rest.
export function stubAppApi({ role, list, other }: AppApiOptions) {
  return stubFetch(async (request) => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^.*\/api\/v1/, '').replace(/^https?:\/\/[^/]+/, '');

    if (path.endsWith('/auth/me')) {
      return apiSuccess({ id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role });
    }
    if (path.endsWith('/insights/headcount')) {
      return apiSuccess(OPTIONS[url.searchParams.get('by') ?? 'country'] ?? []);
    }
    const custom = await other?.(request);
    if (custom) return custom;
    if (path.endsWith('/employees') && request.method === 'GET') {
      return list ? list(request) : listPage([]);
    }
    return jsonResponse(404, { success: false, message: 'not stubbed', code: 'NOT_FOUND' });
  });
}
