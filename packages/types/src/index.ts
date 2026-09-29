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
