import { AppQueryProvider } from './app/providers/AppQueryProvider';
import { AppRouter } from './app/router/routes';

export function App() {
  return (
    <AppQueryProvider>
      <AppRouter />
    </AppQueryProvider>
  );
}
