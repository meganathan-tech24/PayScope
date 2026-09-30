import { ApiError, NetworkError } from '../../../services/http';

export interface EmployeeError {
  banner?: string;
  emailTaken?: boolean;
  /** The employee was already removed by someone else. */
  gone?: boolean;
}

export function describeEmployeeError(error: unknown): EmployeeError {
  if (error instanceof NetworkError) {
    return { banner: 'Could not reach the server. Check your connection and try again.' };
  }
  if (error instanceof ApiError) {
    if (error.status === 409) return { emailTaken: true };
    if (error.status === 404) {
      return { gone: true, banner: 'This employee no longer exists. The list has been refreshed.' };
    }
    if (error.status === 403) {
      return { banner: 'You do not have permission to change employees.' };
    }
    if (error.status === 429) {
      return { banner: 'Too many requests. Please wait a moment and try again.' };
    }
    if (error.status === 400) return { banner: error.message };
  }
  return { banner: 'Something went wrong. Please try again.' };
}
