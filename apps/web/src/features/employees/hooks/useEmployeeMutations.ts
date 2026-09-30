import { useMutation, useQueryClient } from '@tanstack/react-query';

import { employeesService, type EmployeeBody } from '../services/employees.service';

// Any change can move filter options (a new department), counts and statistics, so
// employees and insights are both refetched.
export function useEmployeeMutations() {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['employees'] }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),
    ]);

  return {
    create: useMutation({
      mutationFn: (body: EmployeeBody) => employeesService.create(body),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: EmployeeBody }) =>
        employeesService.update(id, body),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => employeesService.remove(id),
      onSuccess: refresh,
    }),
    refresh,
  };
}
