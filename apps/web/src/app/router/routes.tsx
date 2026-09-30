import { BrowserRouter, Route, Routes } from 'react-router';

import { AppShell } from '../../components/layout/AppShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

function HomePlaceholder() {
  return (
    <Card>
      <p className="text-neutral-600">Employee management and pay insights land in later phases.</p>
      <div className="mt-4">
        <Button variant="primary" disabled title="Coming in a later phase">
          Add employee
        </Button>
      </div>
    </Card>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePlaceholder />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
