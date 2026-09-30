import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { employeesService } from '../services/employees.service';
import type { EmployeeListParams } from '../types';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (params: EmployeeListParams) => ['employees', 'list', params] as const,
};

// keepPreviousData: while the next page or filter loads, the current rows stay on screen
// (isPlaceholderData tells the UI to dim them) instead of flashing to a skeleton.
export function useEmployeeList(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeesService.list(params),
    placeholderData: keepPreviousData,
  });
}
