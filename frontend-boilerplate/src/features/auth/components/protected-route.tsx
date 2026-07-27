import { Navigate, useLocation } from 'react-router-dom';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { useAuthStore } from '../store';

type UserRole = 'ADMIN' | 'USER';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

/**
 * Espera de sessão: duração desconhecida e sem forma de conteúdo para imitar —
 * por isso `Spinner` com rótulo visível, não `Skeleton`.
 */
function SessionLoading() {
  return (
    <Center axis="both" minHeight="100vh">
      <Spinner size="lg" label="Verificando sua sessão…" />
    </Center>
  );
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, token, isHydrated } = useAuthStore();

  // Aguarda a rehidratação do store (token persistido) antes de decidir.
  if (!isHydrated) {
    return <SessionLoading />;
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
    return <SessionLoading />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
