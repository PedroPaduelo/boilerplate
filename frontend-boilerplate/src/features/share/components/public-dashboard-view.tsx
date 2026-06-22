/**
 * Página PÚBLICA read-only (T-G1) — `/public/:token`, SEM auth.
 *
 * Consome `GET /public/:token` (T-B4) via `usePublicArtifact` (cliente sem JWT).
 * Renderiza o artefato em modo PUBLISHED com o MESMO render-engine (T-I) — sem
 * nenhuma ação autenticada (não há FilterBar interativa, edição, share, etc.).
 *
 * Bloqueios (mapeados do status HTTP pelo `shareApi`):
 *  - revogado (403) / expirado (410) / inexistente (404) → tela de bloqueio clara.
 *
 * LIMITAÇÃO consciente do MVP: não existe endpoint público de DADOS (o batch
 * `POST /dashboards/:id/data` é autenticado, T-C). Logo, blocos de dados ficam
 * em estado de carregamento; o conteúdo narrativo (título/texto) renderiza
 * normalmente. A página é, antes de tudo, o relatório read-only.
 */
import { useParams } from 'react-router-dom';
import { Ban, Clock, FileQuestion, Lock, ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import { DashboardRenderer, BlockRenderer } from '@/shared/render-engine';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePublicArtifact } from '../hooks';
import type { ShareBlockReason } from '../types';

export function PublicDashboardView() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError, error } = usePublicArtifact(token);

  if (isLoading) {
    return (
      <PublicShell>
        <Skeleton className="mb-4 h-8 w-64" />
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-4 h-32" />
          <Skeleton className="col-span-8 h-32" />
          <Skeleton className="col-span-12 h-48" />
        </div>
      </PublicShell>
    );
  }

  if (isError || !data) {
    return <ShareBlockedScreen reason={error?.reason ?? 'error'} />;
  }

  const expires = data.expiresAt ? new Date(data.expiresAt) : null;

  return (
    <PublicShell>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {data.dashboard?.title ?? data.chart?.title ?? 'Compartilhamento'}
          </h1>
          <Badge variant="secondary">Somente leitura</Badge>
        </div>
        {expires ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            Acesso disponível até {expires.toLocaleString()}
          </span>
        ) : null}
      </header>

      {data.targetType === 'DASHBOARD' && data.dashboard ? (
        <DashboardRenderer layout={data.dashboard.publishedLayout} />
      ) : null}

      {data.targetType === 'CHART' && data.chart ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <BlockRenderer
              block={{
                id: data.chart.id,
                type: data.chart.catalogType,
                span: 12,
                props: data.chart.publishedProps,
              }}
            />
          </div>
        </div>
      ) : null}
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

const BLOCK_COPY: Record<
  ShareBlockReason,
  { icon: ComponentType<{ className?: string }>; title: string; description: string }
> = {
  expired: {
    icon: Clock,
    title: 'Link expirado',
    description:
      'O tempo de acesso a este compartilhamento terminou. Solicite um novo link a quem o enviou.',
  },
  revoked: {
    icon: Ban,
    title: 'Link revogado',
    description:
      'Este link de compartilhamento foi revogado e não está mais disponível.',
  },
  not_found: {
    icon: FileQuestion,
    title: 'Link não encontrado',
    description:
      'Não encontramos este compartilhamento. Verifique se o endereço está correto e completo.',
  },
  error: {
    icon: ShieldAlert,
    title: 'Não foi possível abrir',
    description:
      'Ocorreu um erro ao abrir este compartilhamento. Tente novamente em instantes.',
  },
};

export function ShareBlockedScreen({ reason }: { reason: ShareBlockReason }) {
  const copy = BLOCK_COPY[reason] ?? BLOCK_COPY.error;
  const Icon = copy.icon;
  return (
    <div
      role="alert"
      data-slot="share-blocked"
      data-reason={reason}
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {copy.title}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">{copy.description}</p>
      </div>
    </div>
  );
}
