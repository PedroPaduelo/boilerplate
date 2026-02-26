import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppLayout } from './app-layout'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import { Skeleton } from '@/shared/components/ui/skeleton'

// Auth - sem lazy (critico)
import { LoginPage } from '@/features/auth/login'
import { RegisterPage } from '@/features/auth/register'

// Lazy load paginas
const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.DashboardPage }))
)

// Loader
const PageLoader = () => (
  <div className="p-6">
    <Skeleton className="h-8 w-48 mb-4" />
    <Skeleton className="h-64 w-full" />
  </div>
)

const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

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
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <DashboardPage />
          </Lazy>
        ),
      },
      // Adicionar outras rotas aqui
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
