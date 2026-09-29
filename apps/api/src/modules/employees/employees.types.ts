import type { Employee } from '@prisma/client';

export type { Employee };

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EmployeePage {
  items: Employee[];
  meta: PageMeta;
}
