import { isIsoCurrencyCode, listCountryCodes } from '@payscope/shared';
import { EMPLOYMENT_TYPES } from '@payscope/shared/employee';
import type { EmployeeFull } from '@payscope/types';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SelectField } from '../../../components/ui/SelectField';
import { TextField } from '../../../components/ui/TextField';
import { currencyDigits, fromMinorUnits } from '../../../lib/money';
import { useEmployeeMutations } from '../hooks/useEmployeeMutations';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { describeEmployeeError } from '../lib/employee-errors';
import { EMPTY_FORM, validateEmployeeForm, type EmployeeFormValues } from '../lib/employee-form';
import { countryName, employmentTypeLabel } from '../lib/format';

const COUNTRY_CODES = listCountryCodes();
const CURRENCY_CODES = Intl.supportedValuesOf('currency').filter(isIsoCurrencyCode);

function initialValues(employee: EmployeeFull | null): EmployeeFormValues {
  if (!employee) return EMPTY_FORM;
  return {
    fullName: employee.fullName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    country: employee.country,
    currency: employee.currency,
    salary: fromMinorUnits(employee.salary, employee.currency),
    employmentType: employee.employmentType,
    hireDate: employee.hireDate.slice(0, 10),
  };
}

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  /** null adds a new employee, otherwise the one being edited. */
  employee: EmployeeFull | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function EmployeeFormModal({ employee, onClose, onSaved }: Props) {
  const isEdit = employee !== null;
  const { create, update, refresh } = useEmployeeMutations();
  const mutation = isEdit ? update : create;
  const departments = useFilterOptions('department');
  const jobTitles = useFilterOptions('jobTitle');

  const [values, setValues] = useState(() => initialValues(employee));
  const [touched, setTouched] = useState<Partial<Record<keyof EmployeeFormValues, boolean>>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const checked = validateEmployeeForm(values);
  const errors = checked.errors ?? {};
  const serverError = mutation.isError ? describeEmployeeError(mutation.error) : undefined;
  const visible = (field: keyof EmployeeFormValues) =>
    submitCount > 0 || touched[field] ? errors[field] : undefined;
  const emailError =
    visible('email') ??
    (serverError?.emailTaken ? 'An employee with this email already exists' : undefined);

  // After a failed submit, move focus to the first invalid field.
  useEffect(() => {
    if (submitCount === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [submitCount]);

  const set = (field: keyof EmployeeFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === 'email' && mutation.isError) mutation.reset();
  };
  const bind = (field: keyof EmployeeFormValues) => ({
    name: field,
    value: values[field],
    disabled: mutation.isPending,
    onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitCount((count) => count + 1);
    if (checked.errors) return;

    const done = () => {
      onSaved(isEdit ? 'Employee updated' : 'Employee created');
      onClose();
    };
    const onError = (error: unknown) => {
      if (describeEmployeeError(error).gone) void refresh();
    };

    if (isEdit)
      update.mutate({ id: employee.id, body: checked.body }, { onSuccess: done, onError });
    else create.mutate(checked.body, { onSuccess: done, onError });
  }

  const digits = currencyDigits(values.currency || 'USD');
  const salaryHint = values.currency
    ? `Amount in ${values.currency}${digits === 0 ? ', whole numbers only' : `, up to ${digits} decimals`}`
    : 'Choose a currency first; the amount is in that currency';

  return (
    <Modal title={isEdit ? 'Edit employee' : 'Add employee'} onClose={onClose} size="lg">
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError?.banner ? <Alert tone="error">{serverError.banner}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            autoComplete="off"
            {...bind('fullName')}
            error={visible('fullName')}
            onChange={(event) => set('fullName')(event.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="off"
            {...bind('email')}
            error={emailError}
            onChange={(event) => set('email')(event.target.value)}
          />
          <TextField
            label="Job title"
            list="job-title-options"
            autoComplete="off"
            {...bind('jobTitle')}
            error={visible('jobTitle')}
            onChange={(event) => set('jobTitle')(event.target.value)}
          />
          <TextField
            label="Department"
            list="department-options"
            autoComplete="off"
            {...bind('department')}
            error={visible('department')}
            onChange={(event) => set('department')(event.target.value)}
          />
          <SelectField
            label="Country"
            {...bind('country')}
            error={visible('country')}
            onChange={(event) => set('country')(event.target.value)}
          >
            <option value="">Select a country</option>
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Currency"
            {...bind('currency')}
            error={visible('currency')}
            onChange={(event) => set('currency')(event.target.value)}
          >
            <option value="">Select a currency</option>
            {CURRENCY_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Salary (per year)"
            inputMode="decimal"
            autoComplete="off"
            hint={salaryHint}
            {...bind('salary')}
            error={visible('salary')}
            onChange={(event) => set('salary')(event.target.value)}
          />
          <SelectField
            label="Employment type"
            {...bind('employmentType')}
            error={visible('employmentType')}
            onChange={(event) => set('employmentType')(event.target.value)}
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {employmentTypeLabel(type)}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Hire date"
            type="date"
            max={today()}
            {...bind('hireDate')}
            error={visible('hireDate')}
            onChange={(event) => set('hireDate')(event.target.value)}
          />
        </div>

        <datalist id="job-title-options">
          {(jobTitles.data ?? []).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <datalist id="department-options">
          {(departments.data ?? []).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
