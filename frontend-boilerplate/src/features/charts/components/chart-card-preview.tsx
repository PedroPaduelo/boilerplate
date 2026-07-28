/**
 * MINIATURA do gráfico — o "cover" do card da grade de `/charts`.
 *
 * Por que existe: numa biblioteca de gráficos, a identidade de um item é a
 * FORMA dele. Um card com ícone + título + data é o mesmo card doze vezes — a
 * grade só ganha do texto quando cada célula mostra o gráfico de verdade. É o
 * que Superset (thumbnail), Power BI e Looker Studio fazem; aqui sai melhor,
 * porque o app tem o render-engine: a miniatura é o MESMO motor do dashboard,
 * com os DADOS REAIS da query — não uma imagem gerada em outro momento.
 *
 * COMO ELA CABE. Os blocos de gráfico desenham com altura FIXA (~280px, é o
 * `ResponsiveContainer` do Recharts). Enfiar isso num cover de 174px cortaria
 * eixo e legenda no meio — o gráfico pareceria quebrado. Então a miniatura faz
 * o que um thumbnail de verdade faz: desenha num CANVAS de tamanho fixo
 * (`CANVAS_WIDTH` × 16:9) e encolhe o conjunto inteiro por `transform: scale()`
 * até a largura da célula. Nada é cortado e nada distorce — só diminui.
 *
 * Três cuidados, nesta ordem:
 *
 *  1. CUSTO. `POST /charts/:id/data` executa a query INLINE (sem cache). Por
 *     isso a busca só dispara quando o card entra no campo de visão
 *     (`useInView`) — e o `staleTime` de `useChartData` evita refazer ao
 *     alternar grade/tabela.
 *  2. CACHE COMPARTILHADO. É a mesma query-key da tela de detalhe, então rolar
 *     a grade já aquece `/charts/:id`: abrir o gráfico vem instantâneo.
 *  3. FALHA SILENCIOSA. Miniatura é conteúdo SECUNDÁRIO. Se o tipo não existe
 *     no registry ou a query falha, o card continua útil (título, estado,
 *     visibilidade, data) e a área vira um aviso discreto — nunca um `Banner`
 *     de erro vermelho repetido doze vezes na tela.
 */
import { useMemo } from 'react';
import { ImageOff } from 'lucide-react';
import type { Block } from '@dashboards/contracts';
import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { useElementWidth } from '@/shared/hooks/use-element-width';
import { useInView } from '@/shared/hooks/use-in-view';
import { BlockRenderer, getBlock, hasBlock } from '@/shared/render-engine';
import { useChartData } from '../hooks';
import type { Chart } from '../types';

/** Proporção da miniatura — a mesma em todo card, para a grade alinhar. */
const PREVIEW_RATIO = 16 / 9;

/**
 * Largura em que o bloco é DESENHADO antes de encolher — e ela depende do que
 * o bloco tem para mostrar:
 *
 *  - SÉRIE/CATEGÓRICO/TABELA precisam de canvas largo (560 × 9/16 = 315px de
 *    altura) para caber os ~280px fixos do gráfico com eixo e legenda. Como o
 *    canvas encolhe para a largura da célula (~0,55×), a miniatura fica densa
 *    — que é o efeito certo: parece um gráfico visto de longe.
 *  - ESCALAR (KPI, ladrilho, medidor) é uma frase e um número. No canvas largo
 *    ele viraria um selo perdido no meio do vazio, então usa um canvas quase do
 *    tamanho da célula: quase não encolhe e o número continua sendo o assunto.
 */
const CANVAS_WIDTH_WIDE = 560;
const CANVAS_WIDTH_SCALAR = 340;

function canvasWidthFor(catalogType: string): number {
  const shape = getBlock(catalogType)?.manifest.dataContract?.shape;
  return shape === 'scalar' ? CANVAS_WIDTH_SCALAR : CANVAS_WIDTH_WIDE;
}

export interface ChartCardPreviewProps {
  chart: Chart;
}

export function ChartCardPreview({ chart }: ChartCardPreviewProps) {
  const isKnownType = hasBlock(chart.catalogType);
  const { ref, isInView } = useInView<HTMLDivElement>({ enabled: isKnownType });
  const width = useElementWidth(ref);

  // A query só existe quando vale a pena: tipo renderizável E card visível.
  const { data, isError } = useChartData(
    isKnownType && isInView ? chart.id : undefined,
    'draft',
  );

  const block = useMemo<Block>(
    () => ({
      id: chart.id,
      type: chart.catalogType,
      span: 12,
      // O título vai no bloco porque KPIs/ladrilhos usam o rótulo como texto
      // principal — sem ele a miniatura mostraria o fallback genérico ("KPI").
      title: chart.title,
      props: chart.draftProps,
    }),
    [chart.id, chart.catalogType, chart.title, chart.draftProps],
  );

  // Duas falhas diferentes, mesmo desfecho visual: a requisição não foi
  // (`isError`) ou foi e o banco recusou a query (`state: 'error'`). A segunda
  // é a comum, e o `BlockRenderer` a desenharia como `Banner` vermelho — doze
  // desses numa grade é um alarme de incêndio, não uma listagem. Aqui vira um
  // aviso curto: o sinal continua na tela, o diagnóstico fica no detalhe.
  const hasFailed = isError || data?.state === 'error';
  const isUnavailable = !isKnownType || hasFailed;
  const canvasWidth = canvasWidthFor(chart.catalogType);
  const canvasHeight = Math.round(canvasWidth / PREVIEW_RATIO);

  return (
    // `div` cru de propósito: é a ÂNCORA dos observadores (visibilidade e
    // largura). Sem estilo e sem semântica — o layout segue todo em DS.
    <div ref={ref} data-slot="chart-card-preview">
      <AspectRatio ratio={PREVIEW_RATIO}>
        {isUnavailable ? (
          <VStack height="100%" padding={3} justify="center">
            <PreviewUnavailable
              reason={
                isKnownType
                  ? 'A consulta deste gráfico falhou. Abra para ver o motivo.'
                  : `Tipo “${chart.catalogType}” não está no catálogo atual.`
              }
            />
          </VStack>
        ) : width == null ? null : (
          // Dois níveis de propósito: o `AspectRatio` estica o filho DIRETO
          // para preencher o cover (position:absolute; inset:0), o que
          // atropelaria qualquer tamanho fixo. O canvas escalado precisa então
          // vir um nível abaixo, livre desse esticão.
          <div>
            <div
              style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${width / canvasWidth})`,
                transformOrigin: 'top left',
              }}
            >
              <VStack height="100%" padding={4} justify="center">
                <BlockRenderer block={block} result={data} />
              </VStack>
            </div>
          </div>
        )}
      </AspectRatio>
    </div>
  );
}

/**
 * Área da miniatura quando não há o que desenhar. Fala em voz baixa (ícone +
 * texto de apoio) porque a falha é da PRÉVIA, não do gráfico: o item continua
 * abrindo normalmente.
 */
function PreviewUnavailable({ reason }: { reason: string }) {
  return (
    <VStack gap={1} align="center" justify="center" height="100%">
      <Icon icon={ImageOff} color="secondary" />
      <Text type="supporting" color="secondary" maxLines={2}>
        {reason}
      </Text>
    </VStack>
  );
}
