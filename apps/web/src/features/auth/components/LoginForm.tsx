import { loginBodySchema } from '@payscope/shared/auth';
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';
import { useLogin } from '../hooks/useLogin';
import { describeAuthError, validateFields } from '../lib/form-errors';

type Field = 'email' | 'password';

export function LoginForm() {
  const { notice } = useAuth();
  const login = useLogin();

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const checked = validateFields(loginBodySchema, values);
  const errors = checked.errors ?? {};
  const visible = (field: Field) => (submitted || touched[field] ? errors[field] : undefined);
  const serverError = login.isError ? describeAuthError(login.error) : undefined;

  function change(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (checked.errors) {
      // Focus the first invalid field so keyboard and screen reader users land on it.
      if (errors.email) emailRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }
    // On success the session flips to authenticated and PublicOnlyRoute moves us on.
    login.mutate(checked.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {notice === 'expired' ? (
        <Alert tone="info">Your session expired. Please sign in again.</Alert>
      ) : null}
      {serverError?.banner ? <Alert tone="error">{serverError.banner}</Alert> : null}

      <TextField
        ref={emailRef}
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        inputMode="email"
        value={values.email}
        error={visible('email')}
        disabled={login.isPending}
        onChange={(event) => change('email', event.target.value)}
        onBlur={() => setTouched((current) => ({ ...current, email: true }))}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={values.password}
        error={visible('password')}
        disabled={login.isPending}
        onChange={(event) => change('password', event.target.value)}
        onBlur={() => setTouched((current) => ({ ...current, password: true }))}
      />

      <Button type="submit" size="lg" loading={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-sm text-neutral-600">
        New to PayScope?{' '}
        <Link to="/register" className="link">
          Create an account
        </Link>
      </p>
    </form>
  );
}
