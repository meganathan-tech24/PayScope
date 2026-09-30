import { RegisterForm } from '../features/auth/components/RegisterForm';

export function RegisterPage() {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="display text-3xl font-semibold sm:text-4xl">Create your account</h1>
          <p className="text-neutral-600">
            Choose the account type that fits how you will use PayScope. You can sign in right
            after.
          </p>
        </div>
        <div className="card">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
