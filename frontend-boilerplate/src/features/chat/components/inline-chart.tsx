/**
 * Gráfico INLINE no chat — renderiza o `ChatChartPayload` do agente com o MESMO
 * render-engine do dashboard (BlockRenderer) e oferece "Adicionar a um dashboard".
 *
 * O botão de adicionar usa a API REAL (POST /charts + POST /dashboards/:id/blocks)
 * e respeita RBAC (`artifacts:manage`) — defesa em profundidade, já que a rota
 * /chat também é gateada. O diálogo é o mesmo de sempre (`AddToDashboardDialog`):
 * aqui só se decide QUANDO abri-lo.
 *
 * Um payload quebrado vira ERRO explícito, não vazio. O `BlockRenderer` trata a
 * ausência de dados como "ainda carregando" e desenha esqueleto para sempre —
 * uma resposta que nunca chega parece travamento; um erro nomeado o usuário
 * entende e sabe o que fazer (pedir de novo).
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Block } from '@dashboards/contracts';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { BlockRenderer, hasBlock } from '@/shared/render-engine';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';
import type { ChatChartPayload } from '../transport';
import { AddToDashboardDialog } from './add-to-dashboard-dialog';

export interface InlineChartProps {
  chart: ChatChartPayload;
}

const NO_PERMISSION_REASON =
  'Seu perfil não pode salvar gráficos — peça a um administrador.';

/**
 * O ENVELOPE do gráfico veio utilizável? Devolve o motivo técnico quando não.
 *
 * Só cuida do que impede o render de acontecer. O erro DO DADO (query que
 * falhou, consulta sem linhas) continua sendo do `BlockRenderer`, que já o
 * mostra no lugar certo — duplicar aqui daria duas mensagens para um problema.
 */
function payloadProblem(chart: ChatChartPayload): string | undefined {
  const catalogType = chart.catalogType?.trim();
  if (!catalogType) return 'O agente não informou o tipo de bloco (catalogType).';
  if (!hasBlock(catalogType)) {
    return `Tipo de bloco desconhecido nesta versão: "${catalogType}".`;
  }

  const result: unknown = chart.result;
  const isRenderable =
    !!result &&
    typeof result === 'object' &&
    typeof (result as { state?: unknown }).state === 'string';
  if (!isRenderable) return 'O agente não enviou os dados do gráfico (result).';

  return undefined;
}

export function InlineChart({ chart }: InlineChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canManage = hasPermission(role, 'artifacts:manage');

  const problem = payloadProblem(chart);
  if (problem) {
    return (
      <Banner
        status="error"
        title="Não consegui montar este gráfico"
        description="O texto da resposta continua valendo — só a visualização veio incompleta. Peça o gráfico de novo para tentar outra vez."
      >
        <Text type="code">{problem}</Text>
      </Banner>
    );
  }

  // Título é a legenda da evidência: sem ele o gráfico não diz o que mostra.
  const title = chart.title?.trim() || 'Gráfico gerado pelo agente';

  // Bloco sintético para o render-engine (mesmo contrato do dashboard).
  const block = {
    id: chart.result.blockId ?? 'chat_inline',
    type: chart.catalogType,
    span: 12,
    props: chart.props,
  } as Block;

  return (
    <Card padding={3}>
      <VStack gap={2}>
        <HStack gap={2} vAlign="center" justify="between" wrap="wrap">
          <Text type="label" maxLines={1}>
            {title}
          </Text>
          {/* Desabilitado com o motivo no tooltip em vez de sumir: quem não pode
              salvar precisa saber que o caminho existe — e por que está fechado. */}
          <Button
            size="sm"
            variant="secondary"
            label="Adicionar a um dashboard"
            icon={<Icon icon={Plus} />}
            isDisabled={!canManage}
            tooltip={canManage ? undefined : NO_PERMISSION_REASON}
            onClick={() => setIsDialogOpen(true)}
          />
        </HStack>

        <BlockRenderer block={block} result={chart.result} />
      </VStack>

      {canManage ? (
        <AddToDashboardDialog
          chart={chart}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      ) : null}
    </Card>
  );
}
