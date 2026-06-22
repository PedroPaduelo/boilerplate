import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

export interface ForbiddenPageProps {
  /** Mensagem opcional sobre o que era necessário. */
  description?: string;
}

/**
 * Tela de 403 (acesso negado por papel/permissão). Renderizada pelo guarda
 * `RequireRole` quando o usuário autenticado não tem o papel/permissão exigidos.
 */
export function ForbiddenPage({ description }: ForbiddenPageProps) {
  const navigate = useNavigate();
  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="size-7" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Acesso negado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {description ?? 'Você não tem permissão para acessar esta página.'}
        </p>
      </div>
      <Button variant="outline" onClick={() => navigate('/')}>
        Voltar ao início
      </Button>
    </div>
  );
}
