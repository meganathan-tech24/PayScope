import { registerBodySchema } from '@payscope/shared/auth';
import type { Role } from '@payscope/types';
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { RadioCardGroup, type RadioOption } from '../../../components/ui/RadioCardGroup';
import { TextField } from '../../../components/ui/TextField';
import { useRegister } from '../hooks/useRegister';
import { describeAuthError, validateFields } from '../lib/form-errors';

type Field = 'name' | 'email' | 'password';

const ACCOUNT_TYPES: readonly RadioOption<Role>[] = [
  {
    value: 'VIEWER',
    label: 'Viewer',
    description:
      'Browse the employee directory and aggregated pay statistics. Individual salaries are never shown, and you cannot change data.',
  },
  {
    value: 'HR_MANAGER',
    label: 'HR Manager',
    description:
      'Manage employees and see every pay figure, including individual salaries, outliers and CSV export.',
  },
];

export function RegisterForm() {
  const register = useRegister();

  // Viewer first: the least-privileged type is the default, as it is on the server.
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState<Role>('VIEWER');
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const checked = validateFields(registerBodySchema, { ...values, role });
  const errors = checked.errors ?? {};
  const serverError = register.isError ? describeAuthError(register.error) : undefined;
  const visible = (field: Field) => (submitted || touched[field] ? errors[field] : undefined);
  const emailError =
    visible('email') ??
    (serverError?.field?.name === 'email' ? serverError.field.message : undefined);

  function change(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // A "this email is taken" message is about the old value.
    if (field === 'email' && register.isError) register.reset();
  }

  const touch = (field: Field) => setTouched((current) => ({ ...current, [field]: true }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (checked.errors) {
      // Focus the first invalid field so keyboard and screen reader users land on it.
      if (errors.name) nameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }
    // On success the session flips to authenticated and PublicOnlyRoute moves us on.
    register.mutate(checked.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError?.banner ? <Alert tone="error">{serverError.banner}</Alert> : null}

      <TextField
        ref={nameRef}
        label="Full name"
        name="name"
        autoComplete="name"
        value={values.name}
        error={visible('name')}
        disabled={register.isPending}
        onChange={(event) => change('name', event.target.value)}
        onBlur={() => touch('name')}
      />
      <TextField
        ref={emailRef}
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        inputMode="email"
        value={values.email}
        error={emailError}
        disabled={register.isPending}
        onChange={(event) => change('email', event.target.value)}
        onBlur={() => touch('email')}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a lowercase letter, an uppercase letter and a number."
        value={values.password}
        error={visible('password')}
        disabled={register.isPending}
        onChange={(event) => change('password', event.target.value)}
        onBlur={() => touch('password')}
      />

      <div className="flex flex-col gap-2">
        <RadioCardGroup
          legend="Account type"
          name="role"
          value={role}
          options={ACCOUNT_TYPES}
          onChange={setRole}
          disabled={register.isPending}
        />
        <p className="field-hint">
          You choose the account type here for this demonstration. In a real deployment an HR
          Manager would invite Viewers and approve HR Manager accounts.
        </p>
      </div>

      <Button type="submit" size="lg" loading={register.isPending}>
        {register.isPending ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-sm text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
