// The auth body schemas are shared with the web app; re-exported so the rest of the
// auth module keeps importing them from here.
export {
  loginBodySchema,
  registerBodySchema,
  type LoginInput,
  type RegisterInput,
} from '@payscope/shared/auth';
