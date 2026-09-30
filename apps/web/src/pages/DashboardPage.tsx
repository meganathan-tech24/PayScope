import { Card } from '../components/ui/Card';
import { useAuth } from '../features/auth/hooks/useAuth';
import { ROLE_LABEL, ROLE_SUMMARY } from '../features/auth/role-labels';

// Placeholder: the real dashboards arrive with the insights UI.
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-3xl font-semibold">Dashboard</h1>
      <Card>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="field-hint">Signed in as</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="field-hint">Email</dt>
            <dd className="break-all font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="field-hint">Account type</dt>
            <dd>
              <span className="badge-brand">{ROLE_LABEL[user.role]}</span>
            </dd>
          </div>
        </dl>
        <p className="mt-6 max-w-prose text-neutral-700">{ROLE_SUMMARY[user.role]}</p>
      </Card>
      <p className="text-sm text-neutral-600">Pay insights will appear here.</p>
    </div>
  );
}
