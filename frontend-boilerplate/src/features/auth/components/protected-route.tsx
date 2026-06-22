import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Skeleton } from '@/components/ui';

type UserRole = 'ADMIN' | 'USER';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, token, isHydrated } = useAuthStore();

  // Aguarda a rehidratação do store (token persistido) antes de decidir.
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Sem token: não autenticado.
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token presente mas `user` ainda não carregado: o `AuthProvider` está
  // buscando `GET /auth/me` (o store persiste só o token). Mostra loading em vez
  // de redirecionar — em caso de falha, o interceptor faz logout (limpa o token)
  // e o guard acima passa a redirecionar para /login.
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
