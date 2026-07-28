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
 *
 * ANATOMIA (doc `composicao-da-resposta` §6). Uma resposta rende até sete
 * gráficos seguidos, então o card precisa se comportar bem repetido:
 *
 *  - TÍTULO + RECORTE — o título nomeia a medida, o recorte a delimita
 *    (período, volume, unidade). Sem a segunda linha o número não tem contexto.
 *  - ALTURA RESERVADA — a caixa nasce do tamanho final, então o dado chegando
 *    não empurra o texto que está sendo lido.
 *  - DOIS FORMATOS — gráfico ganha moldura; KPI NÃO, porque já é um cartão:
 *    envolvê-lo dava card dentro de card com o título escrito duas vezes,
 *    1110 px de largura para exibir "4.080". Quem os põe lado a lado é o
 *    `InlineCharts` (`inline-chart-list.tsx`), que enxerga a sequência inteira.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import {
  BlockRenderer,
  chartBodyHeight,
  describeDataScope,
  isCompactCardBlock,
} from '@/shared/render-engine';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';
import type { ChatChartPayload } from '../transport';
import { AddToDashboardDialog } from './add-to-dashboard-dialog';
import { payloadProblem, toBlock } from './inline-chart-payload';

export interface InlineChartProps {
  chart: ChatChartPayload;
  /**
   * Verdadeiro enquanto a resposta está CHEGANDO. Liga a animação de entrada
   * só nesse caso: ao abrir uma conversa antiga os sete gráficos já existem, e
   * animá-los seria um piscar coletivo sem nada acontecendo — a mesma regra que
   * a trilha de auditoria segue (ver `.app-step-in` em app/index.css).
   */
  isEntering?: boolean;
}

const NO_PERMISSION_REASON =
  'Seu perfil não pode salvar gráficos — peça a um administrador.';

const ADD_LABEL = 'Adicionar a um dashboard';

export function InlineChart({ chart, isEntering = false }: InlineChartProps) {
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
  // Recorte: período/volume/unidade que o PRÓPRIO payload comprova. Vem vazio
  // quando não há o que afirmar — e aí a linha simplesmente não existe.
  const scope = describeDataScope({ result: chart.result, props: chart.props });
  const entryClass = isEntering ? 'app-step-in' : undefined;

  const dialog = canManage ? (
    <AddToDashboardDialog
      chart={chart}
      isOpen={isDialogOpen}
      onOpenChange={setIsDialogOpen}
    />
  ) : null;

  /**
   * CARTÃO DE NÚMERO (kpi, métrica, tile, sinal): o bloco já desenha o próprio
   * card com rótulo e valor. Aqui não entra nem moldura nem título — só a ação,
   * abaixo e discreta, para não competir com o número.
   */
  if (isCompactCardBlock(chart.catalogType)) {
    return (
      <VStack gap={1} className={entryClass} data-slot="inline-chart-compact">
        <BlockRenderer block={toBlock(chart)} result={chart.result} />
        {scope ? (
          <Text type="supporting" maxLines={1}>
            {scope}
          </Text>
        ) : null}
        <HStack hAlign="end">
          <Button
            size="sm"
            variant="ghost"
            label={ADD_LABEL}
            icon={<Icon icon={Plus} />}
            isIconOnly
            isDisabled={!canManage}
            tooltip={canManage ? ADD_LABEL : NO_PERMISSION_REASON}
            onClick={() => setIsDialogOpen(true)}
          />
        </HStack>
        {dialog}
      </VStack>
    );
  }

  return (
    <Card padding={3} className={entryClass} data-slot="inline-chart">
      <VStack gap={2}>
        <HStack gap={2} vAlign="start" justify="between" wrap="wrap">
          <VStack gap={0.5}>
            <Text type="label" maxLines={1}>
              {title}
            </Text>
            {scope ? (
              <Text type="supporting" maxLines={1} data-slot="inline-chart-scope">
                {scope}
              </Text>
            ) : null}
          </VStack>
          {/* Desabilitado com o motivo no tooltip em vez de sumir: quem não
              pode salvar precisa saber que o caminho existe — e por que está
              fechado. */}
          <Button
            size="sm"
            variant="secondary"
            label={ADD_LABEL}
            icon={<Icon icon={Plus} />}
            isDisabled={!canManage}
            tooltip={canManage ? undefined : NO_PERMISSION_REASON}
            onClick={() => setIsDialogOpen(true)}
          />
        </HStack>

        {/* Altura reservada desde o esqueleto: a caixa não cresce quando o dado
            chega. `justify="center"` mantém um gráfico mais baixo que a reserva
            centrado, em vez de colado no topo com um vão embaixo. */}
        <VStack
          minHeight={chartBodyHeight(chart.catalogType)}
          justify="center"
          data-slot="inline-chart-body"
        >
          <BlockRenderer block={toBlock(chart)} result={chart.result} />
        </VStack>
      </VStack>

      {dialog}
    </Card>
  );
}
