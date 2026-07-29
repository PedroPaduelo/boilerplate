/**
 * Cabeçalho da tela de VISUALIZAÇÃO do dashboard.
 *
 * ---------------------------------------------------------------------------
 * TRÊS FAIXAS, TRÊS PERGUNTAS
 * ---------------------------------------------------------------------------
 * O cabeçalho antigo era uma linha só: título, selo e três botões. Funcionava
 * enquanto a tela tinha três ações; com período, tema, compartilhar, atualizar
 * e exportar, ele vira uma fileira em que nada tem precedência — e a informação
 * mais perguntada num painel ("isto está atualizado?") não tinha lugar nenhum.
 *
 * Agora são três faixas, cada uma respondendo a uma pergunta diferente:
 *
 *   1. ONDE ESTOU   → trilha de navegação;
 *   2. O QUE É      → título + estado de publicação, e do lado, as AÇÕES;
 *   3. DE QUANDO É  → o estado do dado: atualizando / atualizado há X / falhou.
 *
 * A ordem é a da leitura: contexto, identidade, frescor. Quem chega pelo link
 * de um colega lê as três em sequência sem procurar nada.
 *
 * ---------------------------------------------------------------------------
 * A TRILHA VOLTOU — e por quê (reversão consciente)
 * ---------------------------------------------------------------------------
 * A versão anterior desta tela removeu a trilha com o argumento de que a tela é
 * AUTÔNOMA: abre em guia própria, para projetar numa reunião, e "não há app em
 * volta para se orientar".
 *
 * O argumento valia para a tela daquele momento — praticamente um slide. Duas
 * coisas mudaram: (a) a tela ganhou ações de trabalho (compartilhar, período,
 * exportar), ou seja, não se está só olhando, se está OPERANDO; e (b) o próprio
 * estado de erro já tinha provado que a saída era necessária — ele precisou
 * ganhar um botão "ver todos os dashboards" justamente porque não havia
 * caminho de volta. Uma tela que precisa de saída no erro precisa de saída
 * sempre; a diferença é que a trilha também diz ONDE se está, o que um botão
 * solto não faz.
 *
 * ---------------------------------------------------------------------------
 * PERÍODO NO CABEÇALHO
 * ---------------------------------------------------------------------------
 * O filtro de data sobe da barra de filtros para cá (ver `pickPeriodFilter`).
 * Ele é o único filtro que muda o significado de TODOS os números da tela ao
 * mesmo tempo, e fica ao lado de "atualizado há X" porque os dois juntos
 * respondem a mesma dúvida: "que recorte estou vendo, e de quando é o dado?".
 * Sem filtro de data no layout, o controle simplesmente não existe — inventar
 * um período que não filtra nada seria pior que não ter.
 *
 * ---------------------------------------------------------------------------
 * AÇÕES: DUAS INLINE, O RESTO NO MENU
 * ---------------------------------------------------------------------------
 * "Atualizar" e "Compartilhar" ficam visíveis porque são o que se faz durante a
 * leitura (reprocessar e mandar para alguém). Exportar PDF é caro, lento e
 * pontual: vai para o menu, junto de "copiar link desta aba". Cinco botões
 * lado a lado não é um cabeçalho rico, é um cabeçalho sem opinião.
 */
import { useState } from 'react';
import { Copy, Download, MoreHorizontal, RefreshCw, Share2 } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { LayoutHeader } from '@astryxdesign/core/Layout';
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ShareArtifactDialog } from '@/shared/components/share-artifact-dialog';
import { useAppToast } from '@/shared/hooks/use-app-toast';
import { ColorModeToggle } from '@/shared/theme';
import type { DashFilter, FilterValues } from '../../lib/dashboard-filters';
import { DashboardBreadcrumbs } from '../dashboard-breadcrumbs';
import { FilterControl } from '../filter-control';
import { RelativeTime } from './relative-time';

export interface DashboardViewerHeaderProps {
  title: string;
  dashboardId: string;
  isPublished: boolean;
  /** Filtro de data promovido ao cabeçalho (ver `pickPeriodFilter`). */
  periodFilter?: DashFilter;
  values: FilterValues;
  onFilterChange: (filterId: string, value: unknown) => void;
  /** Epoch ms da última chegada de dados. `0` = ainda não chegou nada. */
  updatedAt: number;
  isFetching: boolean;
  isError: boolean;
  onRefresh: () => void;
  canShare: boolean;
  canExport: boolean;
  isExporting: boolean;
  onExport: () => void;
}

export function DashboardViewerHeader({
  title,
  dashboardId,
  isPublished,
  periodFilter,
  values,
  onFilterChange,
  updatedAt,
  isFetching,
  isError,
  onRefresh,
  canShare,
  canExport,
  isExporting,
  onExport,
}: DashboardViewerHeaderProps) {
  const toast = useAppToast();
  const [isShareOpen, setIsShareOpen] = useState(false);

  const copyCurrentLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link desta visão copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  return (
    <LayoutHeader hasDivider>
      <VStack gap={3}>
        {/* 1. ONDE ESTOU */}
        <DashboardBreadcrumbs title={title} />

        {/* 2. O QUE É + AÇÕES */}
        <HStack gap={3} vAlign="start" hAlign="between" wrap="wrap">
          <VStack gap={1}>
            <HStack gap={2} vAlign="center">
              <Heading level={2} maxLines={1}>
                {title}
              </Heading>
              <Badge
                variant={isPublished ? 'success' : 'neutral'}
                label={isPublished ? 'Publicado' : 'Rascunho'}
              />
            </HStack>

            {/* 3. DE QUANDO É */}
            <DataFreshness
              updatedAt={updatedAt}
              isFetching={isFetching}
              isError={isError}
            />
          </VStack>

          <HStack gap={2} vAlign="center" wrap="wrap">
            {periodFilter ? (
              <FilterControl
                filter={periodFilter}
                value={values[periodFilter.id]}
                onChange={onFilterChange}
              />
            ) : null}

            {/*
              TROCA DE TEMA aqui, e não só no shell do app: esta tela é
              AUTÔNOMA (abre em guia própria), então o controle do shell não a
              alcança. E é justamente aqui que ele mais importa — dashboard vai
              para telão de reunião e para sala clara, e a escolha certa
              depende da sala, não da preferência salva outro dia.
            */}
            <ColorModeToggle />

            <Button
              label="Atualizar"
              icon={<Icon icon={RefreshCw} />}
              isLoading={isFetching}
              tooltip="Reprocessa os dados de todos os blocos"
              onClick={onRefresh}
            />

            {canShare ? (
              <Button
                label="Compartilhar"
                variant="primary"
                icon={<Icon icon={Share2} />}
                onClick={() => setIsShareOpen(true)}
              />
            ) : null}

            <MoreMenu
              label="Mais ações do dashboard"
              icon={<Icon icon={MoreHorizontal} />}
              items={[
                {
                  label: 'Copiar link desta visão',
                  icon: <Icon icon={Copy} />,
                  onClick: () => void copyCurrentLink(),
                },
                ...(canExport
                  ? [
                      {
                        label: isExporting ? 'Gerando PDF…' : 'Exportar PDF',
                        icon: <Icon icon={Download} />,
                        isDisabled: isExporting,
                        onClick: onExport,
                      },
                    ]
                  : []),
              ]}
            />
          </HStack>
        </HStack>
      </VStack>

      {/*
        `key` no id: remonta o diálogo ao trocar de dashboard, zerando o link
        já gerado. É o mesmo padrão da listagem — reset por remontagem, sem
        `setState` dentro de efeito.
      */}
      <ShareArtifactDialog
        key={dashboardId}
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        targetType="DASHBOARD"
        targetId={dashboardId}
        targetTitle={title}
      />
    </LayoutHeader>
  );
}

/**
 * A linha "de quando é este número".
 *
 * Três estados, e os três importam: ATUALIZANDO (o número na tela pode mudar em
 * segundos — não vale copiar para um e-mail agora), ATUALIZADO (com o tempo
 * relativo, que é como se pensa em frescor: "há 2 min", não "14:07:33"), e
 * FALHOU (o número na tela é velho e ninguém avisou — o pior estado possível
 * num painel, e por isso o único em vermelho).
 *
 * O ponto de cor nunca carrega o significado sozinho: quem nomeia o estado é o
 * texto ao lado, que é também o que o leitor de tela anuncia.
 */
function DataFreshness({
  updatedAt,
  isFetching,
  isError,
}: {
  updatedAt: number;
  isFetching: boolean;
  isError: boolean;
}) {
  // O ponto segue o padrão do app: `label` para a API do DS, `aria-hidden`
  // porque quem anuncia o estado é o TEXTO ao lado — anunciar os dois faria o
  // leitor de tela dizer a mesma coisa duas vezes.
  if (isFetching) {
    return (
      <HStack gap={1.5} vAlign="center" data-slot="data-freshness">
        <StatusDot variant="warning" label="Atualizando" isPulsing aria-hidden="true" />
        <Text type="supporting" color="secondary">
          Atualizando os dados…
        </Text>
      </HStack>
    );
  }

  if (isError) {
    return (
      <HStack gap={1.5} vAlign="center" data-slot="data-freshness">
        <StatusDot variant="error" label="Falha ao atualizar" aria-hidden="true" />
        <Text type="supporting" color="secondary">
          Falha ao atualizar — os números abaixo podem estar desatualizados.
        </Text>
      </HStack>
    );
  }

  if (!updatedAt) {
    return (
      <HStack gap={1.5} vAlign="center" data-slot="data-freshness">
        <StatusDot variant="neutral" label="Aguardando dados" aria-hidden="true" />
        <Text type="supporting" color="secondary">
          Aguardando os dados
        </Text>
      </HStack>
    );
  }

  return (
    <HStack gap={1.5} vAlign="center" data-slot="data-freshness">
      <StatusDot variant="success" label="Dados atualizados" aria-hidden="true" />
      <Text type="supporting" color="secondary">
        {/*
          Componente PRÓPRIO, e não o `Timestamp` do design system: as frases de
          tempo relativo dele estão cravadas em inglês ("now", "2 hours ago"),
          fora do catálogo de i18n — medido na tela, esta linha saía como
          "Atualizado now". Ver a nota longa em `lib/relative-time.ts`.
        */}
        Atualizado <RelativeTime value={updatedAt} />
      </Text>
    </HStack>
  );
}
