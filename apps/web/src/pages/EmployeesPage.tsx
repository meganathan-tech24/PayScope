import { Card } from '../components/ui/Card';
import { useAuth } from '../features/auth/hooks/useAuth';

// Placeholder: the employee table arrives with the employees UI.
export function EmployeesPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-3xl font-semibold">Employees</h1>
      <Card>
        <p className="text-neutral-700">
          {user.role === 'HR_MANAGER'
            ? 'The employee list, with salaries and editing, will appear here.'
            : 'The employee directory will appear here.'}
        </p>
      </Card>
    </div>
  );
}
