export interface ApiMeta {
  requestId: string;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  code: string;
  requestId: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export function isApiSuccess<T>(envelope: ApiEnvelope<T>): envelope is ApiSuccessEnvelope<T> {
  return envelope.success;
}

export function isApiError<T>(envelope: ApiEnvelope<T>): envelope is ApiErrorEnvelope {
  return !envelope.success;
}

export type Role = 'HR_MANAGER' | 'VIEWER';

// Wire shapes: what the JSON actually carries, so dates are ISO strings.

/** What every signed-in role may see. There is deliberately no `salary` key. */
export interface EmployeeDirectory {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  currency: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

/** HR Managers only: the directory fields plus the salary in integer minor units. */
export interface EmployeeFull extends EmployeeDirectory {
  salary: number;
}

export type EmployeeFor<R extends Role> = R extends 'HR_MANAGER' ? EmployeeFull : EmployeeDirectory;
