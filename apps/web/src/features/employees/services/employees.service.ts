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

export const employeesService = {
  list: (params: EmployeeListParams) =>
    apiClient.getPage<EmployeeRow[]>(
      withQuery('/employees', { ...filters(params), page: params.page, pageSize: PAGE_SIZE }),
    ),
  // The export follows the same filters and sort as the list, without paging.
  exportCsv: (params: EmployeeListParams) =>
    apiClient.download(withQuery('/employees/export.csv', filters(params)), 'text/csv'),
};
