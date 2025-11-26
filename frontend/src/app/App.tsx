import { AppRouter } from './router';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { RootLayout } from './layout/RootLayout';

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RootLayout>
          <AppRouter />
        </RootLayout>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
