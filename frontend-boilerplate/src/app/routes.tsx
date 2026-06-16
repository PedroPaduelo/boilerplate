import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from './app-layout';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { Skeleton } from '@/shared/components/ui/skeleton';

// Auth - sem lazy (critico)
import { LoginPage } from '@/features/auth/login';
import { RegisterPage } from '@/features/auth/register';

// Lazy load paginas
const UsersPage = lazy(() =>
  import('@/features/users').then((m) => ({ default: m.UsersPage })),
);

// Loader
const PageLoader = () => (
  <div className="p-6">
    <Skeleton className="h-8 w-48 mb-4" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/users" replace /> },
      {
        path: 'users',
        element: (
          <Lazy>
            <UsersPage />
          </Lazy>
        ),
      },
      // Adicionar outras rotas aqui
    ],
  },
  { path: '*', element: <Navigate to="/users" replace /> },
]);
