import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Skeleton } from '@/shared/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { token, isHydrated, setUser } = useAuthStore()

  // Aguarda hidratacao do zustand
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  // Sem token - redireciona para login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Token existe - permite acesso (modo demo/development)
  // O usuario pode fazer login real depois via /login
  if (!useAuthStore.getState().user) {
    // Define usuario mock para modo demo
    setUser({
      id: '1',
      name: 'Usuario Demo',
      email: 'demo@teste.com',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return <>{children}</>
}
