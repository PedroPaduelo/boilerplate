import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { DashboardLayout } from './dashboard-layout';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { Skeleton } from '@/components/ui';

// Auth - sem lazy (critico)
import { LoginPage } from '@/features/auth/login';
import { RegisterPage } from '@/features/auth/register';

// Lazy load paginas
const UsersPage = lazy(() =>
  import('@/features/users').then((m) => ({ default: m.UsersPage })),
);

const PageLoader = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const Lazy = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
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
    ],
  },
  { path: '*', element: <Navigate to="/users" replace /> },
]);
