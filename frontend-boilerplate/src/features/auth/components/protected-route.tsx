import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { useCurrentUser } from '../hooks/use-auth'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { token, isHydrated } = useAuthStore()
  const { isLoading, error } = useCurrentUser()

  // Aguarda hidratacao do zustand
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  // Sem token
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Carregando usuario
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  // Erro ao carregar usuario
  if (error) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
