/**
 * Página PÚBLICA read-only (T-G1, com bugfix T-G1) — `/public/:token`, SEM auth.
 *
 * Consome `GET /public/:token` (T-B4) via `usePublicArtifact` (cliente sem JWT)
 * para título/layout/expira; e `GET /public/:token/data` para o snapshot
 * materializado de dados (T-G1 bugfix — antes o batch era autenticado e a
 * página não conseguia hidratar blocos de dados). Renderiza o artefato em modo
 * PUBLISHED com o MESMO render-engine (T-I).
 *
 * Bloqueios (mapeados do status HTTP pelo `shareApi`):
 *  - revogado (403) / expirado (410) / inexistente (404) → tela de bloqueio clara.
 *
 * Sem filtro interativo (read-only), sem ações autenticadas.
 */
import { useParams } from 'react-router-dom';
import { Ban, Clock, FileQuestion, Lock, ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import { DashboardRenderer, BlockRenderer } from '@/shared/render-engine';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePublicArtifact, usePublicData } from '../hooks';
import type { ShareBlockReason } from '../types';

export function PublicDashboardView() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError, error } = usePublicArtifact(token);

  // Snapshot de dados: só ligamos se o token for de DASHBOARD (a rota
  // dedicada /public/:token/data rejeita CHART com 400). A UI consome SÓ
  // quando a página é de fato um dashboard.
  const isDashboard = data?.targetType === 'DASHBOARD';
  const { data: dataPayload, isLoading: dataLoading } = usePublicData(
    token,
    isDashboard,
  );

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
        // Snapshot pode estar em `data.dashboard.publishedDataPayload` (legado,
        // embutido no GET /public/:token) OU no `dataPayload` (endpoint
        // dedicado). Preferimos o dedicado quando já chegou (mais rico e
        // sempre presente pós-bugfix). Enquanto o segundo ainda está
        // carregando, mostramos skeleton nos blocos de dados — mas o
        // `publishedLayout` (narrativos) já renderiza, então a página nunca
        // fica vazia.
        <DashboardRenderer
          layout={data.dashboard.publishedLayout}
          data={dataPayload ?? data.dashboard.publishedDataPayload ?? undefined}
        />
      ) : null}

      {data.targetType === 'DASHBOARD' && dataLoading ? (
        // Skeleton sutil só para os blocos de dados enquanto o snapshot chega.
        // O `publishedLayout` (chips de filtro + narrativos) já está visível
        // acima; isto só ocupa o espaço dos blocos de dados.
        <div data-slot="public-data-skeleton" aria-busy className="mt-4 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
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