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
const UsersPage = lazy(() =>
  import('@/features/users').then((m) => ({ default: m.UsersPage }))
)
const PostsPage = lazy(() =>
  import('@/features/posts').then((m) => ({ default: m.PostsPage }))
)

const ShowcasePage = lazy(() =>
  import('@/features/showcase').then((m) => ({ default: m.ShowcasePage }))
)
const SettingsPage = lazy(() =>
  import('@/features/settings').then((m) => ({ default: m.SettingsPage }))
)
const ProfilePage = lazy(() =>
  import('@/features/profile').then((m) => ({ default: m.ProfilePage }))
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
      {
        path: 'users',
        element: (
          <Lazy>
            <UsersPage />
          </Lazy>
        ),
      },
      {
        path: 'posts',
        element: (
          <Lazy>
            <PostsPage />
          </Lazy>
        ),
      },
      {
        path: 'showcase',
        element: (
          <Lazy>
            <ShowcasePage />
          </Lazy>
        ),
      },
      {
        path: 'settings',
        element: (
          <Lazy>
            <SettingsPage />
          </Lazy>
        ),
      },
      {
        path: 'profile',
        element: (
          <Lazy>
            <ProfilePage />
          </Lazy>
        ),
      },
      // Adicionar outras rotas aqui
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
