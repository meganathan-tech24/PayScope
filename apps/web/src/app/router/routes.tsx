import { BrowserRouter, Route, Routes } from 'react-router';

import { AppShell } from '../../components/layout/AppShell';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';
import { PublicOnlyRoute } from '../../features/auth/components/PublicOnlyRoute';
import { DashboardPage } from '../../pages/DashboardPage';
import { EmployeesPage } from '../../pages/EmployeesPage';
import { ForbiddenPage } from '../../pages/ForbiddenPage';
import { LandingPage } from '../../pages/LandingPage';
import { LoginPage } from '../../pages/LoginPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { RegisterPage } from '../../pages/RegisterPage';

// The route table alone, so tests can render it inside a MemoryRouter.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
