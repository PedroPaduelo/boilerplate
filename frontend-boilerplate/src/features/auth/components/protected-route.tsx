import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Skeleton } from '@/shared/components/ui/skeleton';

type UserRole = 'ADMIN' | 'USER';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, token, isHydrated } = useAuthStore();

  // Aguarda hidratacao do zustand
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Sem token ou sem usuario carregado - redireciona para login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Checagem de role quando exigida
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
