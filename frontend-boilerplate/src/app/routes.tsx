import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from './dashboard-layout';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { collectFeatureRoutes } from '@/shared/lib/feature-routes';

// Auth - sem lazy (critico, sempre disponivel)
import { LoginPage } from '@/features/auth/login';
import { RegisterPage } from '@/features/auth/register';

/**
 * Router central — território FECHADO da Fase 0.
 *
 * NÃO adicione rotas de feature aqui. Cada feature declara as suas em
 * `src/features/<feature>/routes.tsx` (export `featureRoutes`), descobertas
 * automaticamente por `collectFeatureRoutes()` (glob). Este arquivo só define a
 * casca: rotas de auth + o shell autenticado (`DashboardLayout`) + fallback.
 */
const { publicRoutes, protectedRoutes } = collectFeatureRoutes();

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Rotas públicas declaradas por features (ex.: /public/:token do share).
  ...publicRoutes,

  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboards" replace /> },
      // Rotas protegidas declaradas por cada feature (listagens, render, etc.).
      ...protectedRoutes,
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
