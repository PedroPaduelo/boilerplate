/**
 * Tela de VISUALIZAÇÃO do dashboard — `/dashboards/:id/view` (doc 40).
 *
 * É o "modo de consumo": somente leitura, com as abas navegáveis na lateral.
 * Separada da edição (`/edit`) e também da tela de detalhe atual
 * (`/dashboards/:id`), que segue existindo e intocada — esta rota é ADITIVA,
 * então nenhum link, teste ou fluxo existente muda de comportamento.
 *
 * SEM TRILHA DE NAVEGAÇÃO, de propósito. Esta tela é AUTÔNOMA: roda fora do
 * `DashboardLayout` e abre em guia própria, para projetar numa reunião ou ficar
 * num telão. Uma trilha "Dashboards / Fulano / Visualização" é orientação
 * DENTRO de um app — e aqui não há app em volta para se orientar. A saída é
 * fechar a guia, e quem tem permissão de edição ainda tem o botão "Editar" no
 * cabeçalho. As telas que vivem no shell (`/dashboards/:id` e `/edit`) mantêm a
 * trilha, que lá continua fazendo sentido.
 *
 * Este componente é só o PORTÃO (carrega, resolve os três estados: carregando,
 * erro e conteúdo). A composição fica em `DashboardViewerContent`, no mesmo
 * arranjo que `DashboardView`/`DashboardViewContent` já usam — inclusive a
 * decisão de modo: uma única query (`mode=draft`, sempre válida) e a escolha
 * draft/published feita LOCALMENTE a partir do `status` que vem junto, sem
 * probe extra.
 */
import { useParams, useSearchParams } from 'react-router-dom';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import type { ApiMode } from '@/shared/lib/query-keys';
import { useDashboard } from '../hooks';
import { pickEffectiveLayout } from '../lib/dashboard-filters';
import { DashboardViewerContent } from './viewer/dashboard-viewer-content';

export function DashboardViewer() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const modeParam = searchParams.get('mode');
  const override: ApiMode | null =
    modeParam === 'draft' || modeParam === 'published' ? modeParam : null;

  const detailQuery = useDashboard(id, 'draft');
  const detail = detailQuery.data;

  if (detailQuery.isLoading && !detail) return <DashboardViewerSkeleton />;

  if (detailQuery.isError || !detail) {
    return (
      <VStack gap={4}>
        <Banner
          status="error"
          title="Não foi possível carregar este dashboard"
          description="Ele pode não existir, estar inacessível para o seu perfil, ou ainda não ter uma versão neste modo."
          /*
           * DUAS saídas, e as duas importam numa guia autônoma.
           *
           * Tirar a trilha de navegação desta tela (ver o cabeçalho) levou junto
           * o único caminho de volta que o estado de erro tinha. Numa tela
           * dentro do app isso seria inofensivo — o menu está ali do lado. Aqui
           * não há menu: quem abre um link quebrado ficaria com um aviso e nada
           * para fazer além de fechar a guia.
           *
           * A recuperação volta como AÇÃO do próprio aviso, que é onde ela
           * pertence, em vez de como resíduo de navegação no topo da página.
           */
          endContent={
            <HStack gap={2}>
              <Button label="Tentar de novo" onClick={() => void detailQuery.refetch()} />
              <Button
                label="Ver todos os dashboards"
                variant="ghost"
                href="/dashboards"
              />
            </HStack>
          }
        />
      </VStack>
    );
  }

  const wantsPublished =
    override === 'published' || (override == null && detail.status === 'PUBLISHED');
  const { mode, layout } = pickEffectiveLayout(
    detail,
    wantsPublished ? 'published' : 'draft',
  );

  // `key` no ID (e NUNCA no modo): remontar na troca de modo refaria o
  // join/leave da sala do socket e reinicializaria os filtros — regressão já
  // conhecida na tela de detalhe (ver `dashboard-view.tsx`).
  return (
    <DashboardViewerContent key={detail.id} detail={detail} layout={layout} mode={mode} />
  );
}

/** Esqueleto com a silhueta da tela: cabeçalho, barra lateral de abas e grid. */
function DashboardViewerSkeleton() {
  return (
    <VStack gap={4} aria-busy="true" aria-label="Carregando dashboard">
      <Skeleton width={280} height={32} />
      <Skeleton height={56} />
      <HStack gap={4}>
        <Skeleton width={220} height={240} index={1} />
        <Skeleton height={240} index={2} />
      </HStack>
    </VStack>
  );
}
