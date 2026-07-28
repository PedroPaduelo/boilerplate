/**
 * Página PÚBLICA read-only (T-G1, com bugfix T-G1) — `/public/:token`, SEM auth.
 *
 * Consome `GET /public/:token` (T-B4) via `usePublicArtifact` (cliente sem JWT)
 * para título/layout/expira; e `GET /public/:token/data` para o snapshot
 * materializado de dados (T-G1 bugfix — antes o batch era autenticado e a
 * página não conseguia hidratar blocos de dados). Renderiza o artefato em modo
 * PUBLISHED com o MESMO render-engine (T-I).
 *
 * É a única tela vista por quem NÃO está logado: não há TopNav, SideNav nem
 * navegação de volta. Por isso a moldura é feita aqui (`PublicShell` cuida do
 * enquadramento e do scroll — o `<body>` do app é travado) e o `h1` é desta
 * página, não do shell.
 *
 * Bloqueios (mapeados do status HTTP pelo `shareApi`): revogado (403) /
 * expirado (410) / inexistente (404) → `ShareBlockedScreen`.
 *
 * Sem filtro interativo (read-only), sem ações autenticadas.
 */
import type { ReactNode } from 'react';
import type { DashboardDataPayload } from '@dashboards/contracts';
import { useParams } from 'react-router-dom';
import { Clock, Lock } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid, GridSpan } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import { DashboardRenderer, BlockRenderer } from '@/shared/render-engine';
import { usePublicArtifact, usePublicData } from '../hooks';
import { ShareBlockedScreen } from './share-blocked-screen';

export function PublicDashboardView() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError, error } = usePublicArtifact(token);

  // Snapshot de dados: só ligamos se o token for de DASHBOARD (a rota
  // dedicada /public/:token/data rejeita CHART com 400). A UI consome SÓ
  // quando a página é de fato um dashboard.
  const isDashboard = data?.targetType === 'DASHBOARD';
  const { data: dataPayload, isLoading: dataLoading } = usePublicData(token, isDashboard);

  if (isLoading) {
    return (
      <PublicShell>
        <PublicSkeleton />
      </PublicShell>
    );
  }

  if (isError || !data) {
    return <ShareBlockedScreen reason={error?.reason ?? 'error'} />;
  }

  return (
    <PublicShell>
      <PublicHeader
        title={data.dashboard?.title ?? data.chart?.title ?? 'Compartilhamento'}
        expiresAt={data.expiresAt}
      />

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
          // O contrato público tipa `blocks` como `Record<string, unknown>`
          // (o snapshot vem serializado); o renderer espera o payload do
          // dashboard. A forma é a mesma — o schema já validou na borda.
          data={
            (dataPayload ?? data.dashboard.publishedDataPayload ?? undefined) as
              | DashboardDataPayload
              | undefined
          }
        />
      ) : null}

      {data.targetType === 'DASHBOARD' && dataLoading ? (
        // Skeleton sutil só para os blocos de dados enquanto o snapshot chega.
        // O `publishedLayout` (chips de filtro + narrativos) já está visível
        // acima; isto só ocupa o espaço dos blocos de dados.
        <VStack gap={3} data-slot="public-data-skeleton" aria-busy="true">
          <Skeleton height={128} />
          <Skeleton height={192} />
        </VStack>
      ) : null}

      {data.targetType === 'CHART' && data.chart ? (
        <BlockRenderer
          block={{
            id: data.chart.id,
            type: data.chart.catalogType,
            span: 12,
            props: data.chart.publishedProps,
          }}
        />
      ) : null}
    </PublicShell>
  );
}

/**
 * Moldura da rota pública. O `<body>` do app é fixo e sem scroll (o shell
 * autenticado rola por dentro), então aqui a coluna precisa ser o próprio
 * container rolável — senão o conteúdo longo simplesmente não é alcançável.
 */
function PublicShell({ children }: { children: ReactNode }) {
  return (
    <VStack height="100%" isScrollable hAlign="center">
      <VStack width="100%" maxWidth={1152} padding={6} gap={5}>
        {children}
      </VStack>
    </VStack>
  );
}

function PublicHeader({ title, expiresAt }: { title: string; expiresAt: string | null }) {
  return (
    <VStack gap={3}>
      <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
        <HStack gap={2} vAlign="center">
          <Icon icon={Lock} color="secondary" />
          <Heading level={1} maxLines={1}>
            {title}
          </Heading>
          <Badge label="Somente leitura" />
        </HStack>

        {expiresAt ? (
          <HStack gap={1.5} vAlign="center">
            <Icon icon={Clock} size="sm" color="secondary" />
            <Text type="supporting">Acesso disponível até</Text>
            <Timestamp value={expiresAt} format="date_time" />
          </HStack>
        ) : null}
      </HStack>
      <Divider />
    </VStack>
  );
}

/** Carregando: a silhueta real da página (título + grade de blocos). */
function PublicSkeleton() {
  return (
    <VStack gap={5} role="status" aria-label="Carregando compartilhamento">
      <Skeleton width={280} height={32} radius={2} />
      <Grid columns={12} gap={4}>
        <GridSpan columns={4}>
          <Skeleton height={128} index={0} />
        </GridSpan>
        <GridSpan columns={8}>
          <Skeleton height={128} index={1} />
        </GridSpan>
        <GridSpan columns={12}>
          <Skeleton height={192} index={2} />
        </GridSpan>
      </Grid>
    </VStack>
  );
}
