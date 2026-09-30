import type { EmployeeInput } from '@payscope/shared/employee';
import type { EmployeeFull } from '@payscope/types';

import { apiClient } from '../../../services/api-client';
import { withQuery } from '../../../services/http';
import { PAGE_SIZE, type EmployeeListParams, type EmployeeRow } from '../types';

function filters(params: EmployeeListParams) {
  return {
    search: params.search,
    country: params.country,
    department: params.department,
    jobTitle: params.jobTitle,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  };
}

// hireDate goes out as the plain date the person picked, not a timestamp.
export type EmployeeBody = Omit<EmployeeInput, 'hireDate'> & { hireDate: string };

export const employeesService = {
  list: (params: EmployeeListParams) =>
    apiClient.getPage<EmployeeRow[]>(
      withQuery('/employees', { ...filters(params), page: params.page, pageSize: PAGE_SIZE }),
    ),
  create: (body: EmployeeBody) => apiClient.post<EmployeeFull>('/employees', body),
  update: (id: string, body: EmployeeBody) => apiClient.put<EmployeeFull>(`/employees/${id}`, body),
  remove: (id: string) => apiClient.delete(`/employees/${id}`),
  // The export follows the same filters and sort as the list, without paging.
  exportCsv: (params: EmployeeListParams) =>
    apiClient.download(
      withQuery('/employees/export.csv', filters(params)),
      'text/csv',
      'employees.csv',
    ),
};
