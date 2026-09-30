import type { Employee } from '../../generated/prisma/client.js';

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
