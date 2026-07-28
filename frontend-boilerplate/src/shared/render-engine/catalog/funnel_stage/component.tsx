/**
 * Bloco `funnel_stage` (shape 'table') — uma ETAPA de funil temporal como
 * painel colapsável. Self-contained: desenha o PRÓPRIO card e não recebe a
 * moldura `BlockFrame`, então o cabeçalho do contrato comum (rótulo da etapa,
 * texto com Markdown/interpolação) e os estados são responsabilidade dele.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL (checklist §4 do briefing)
 * ---------------------------------------------------------------------------
 * Funil NÃO existe na referência: repaginado por ANALOGIA com a BARRA
 * HORIZONTAL (§8) e a COLUNA EMPILHADA (§6) de `03-tipos-de-grafico.md`.
 *
 *  1. Grade só horizontal, tracejada 3 ... N/A — a etapa não tem plano cartesiano
 *  2. Eixos sem linha e sem marcações .... N/A — a etapa não tem eixos
 *  3. Texto dos eixos 12px/400 ........... N/A — a tipografia aqui é a da LEGENDA
 *                                          PRÓPRIA (§3): 11,375/500 no rótulo e
 *                                          14,875/600 no valor; 12,25/600 na taxa
 *                                          de conversão (o degrau do "Total")
 *  4. Linha 2,5px, suave, sem pontos ..... N/A — não há série contínua
 *  5. Coluna raio 4px no topo, 48% ....... ADAPTADO — a etapa é BARRA HORIZONTAL
 *                                          (§8): raio 2px (`barRadiusFlat`),
 *                                          traço 0 e espessura no degrau de
 *                                          lista (`trackThickness`, 12px)
 *  6. Hover ESCURECE ..................... SIM — o segmento avança um passo da
 *                                          rampa, em `motion.duration`
 *  7. Tooltip branco 90% com blur ........ N/A — os números da etapa estão na
 *                                          tabela de desfechos, não em tooltip
 *
 * Mais: cor da barra pela RAMPA sequencial (claro → escuro, §6) — o passo é a
 * posição do desfecho e a FAMÍLIA vem de `accent`, cujo default agora é o acento
 * do produto (ver `DEFAULT_RAMP`), não mais o azul —, trilha em
 * `chrome('trackLight')` (§3) e os estados (carregando / vazio / erro / sem
 * permissão) delegados ao `ChartFrame` — nenhum é reinventado aqui.
 *
 * A barra da etapa é desenhada por `funnel-bar.tsx` e usa o degrau de LISTA
 * (`geometry.trackThickness`, 12px) — o mesmo do ranking e do progresso linear,
 * porque as três são a mesma coisa: barra sem eixo ao lado de uma linha de
 * texto. Antes ela cravava `--spacing-4` (16px) numa classe utilitária e era a
 * mais grossa das quatro.
 *
 * Comportamento (inalterado): o abre/fecha é o `Collapsible` do DS (foco,
 * teclado e `aria-expanded` prontos), o detalhamento é tabela de verdade
 * (`funnel-rows.tsx`) e a leitura defensiva dos dados fica em `funnel-data.ts`.
 */
import type { TableData } from '@dashboards/contracts';
import { Card } from '@astryxdesign/core/Card';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { VStack } from '@astryxdesign/core/VStack';
import {
  CHART_HEIGHT,
  CHART_SERIES_COLORS,
  ChartFrame,
  buildChartScope,
} from '@/shared/ui';
import type { ChartFrameState, ChartRampColor } from '@/shared/ui';
import { formatBRL, formatCompactBRL } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent, BlockRenderState } from '../../types';
import { FunnelHeader } from './funnel-header';
import { FunnelNotes } from './funnel-notes';
import { FunnelRows } from './funnel-rows';
import { outcomeWeights, readFunnelStage } from './funnel-data';
import { manifest } from './manifest';
import { fixture } from './fixture';

/** Cores aceitas pela etapa (contrato do bloco — não mudam de nome). */
type AccentKey = 'blue' | 'red' | 'green' | 'amber' | 'violet' | 'slate';

type FunnelStageProps = {
  stageLabel: string;
  accent?: AccentKey;
  defaultOpen?: boolean;
  barLabel?: string;
  valueFormat?: 'BRL' | 'compactBRL';
  emptyMessage?: string;
};

/** Cor da etapa → rampa sequencial do design system. */
const RAMP: Record<AccentKey, ChartRampColor> = {
  blue: 'blue',
  red: 'red',
  green: 'shamrock',
  amber: 'orange',
  violet: 'purple',
  slate: 'gray',
};

/**
 * Rampa da etapa quando o bloco não escolhe cor: o ACENTO DO PRODUTO — a 1ª cor
 * do ciclo (`CHART_SERIES_COLORS[0]`), a mesma com que todo bloco do catálogo
 * abre sua primeira série.
 *
 * Era `blue`, e o resultado se via em `/catalog`: a etapa de funil saía
 * azul/ciano no meio de uma grade inteiramente verde. Azul não era escolha de
 * dado — era o nome que veio na primeira posição do enum do bloco. A cor de
 * abertura de qualquer bloco é o acento do produto; quem quiser outra continua
 * dizendo qual em `accent`.
 *
 * Sai da constante do tema (e não de `'emerald'` escrito aqui) para que reordenar
 * o ciclo em `chart-theme` reordene isto junto: se a nova 1ª cor não tiver rampa
 * sequencial, o `tsc` reclama aqui — que é onde tem de reclamar.
 */
const DEFAULT_RAMP: ChartRampColor = CHART_SERIES_COLORS[0];

/**
 * Rampa efetiva da etapa.
 *
 * `accent` ausente = "o bloco não escolheu" = acento do produto. Isso só é
 * verdade porque `accent` foi TIRADO de `manifest.defaultProps`: o
 * `BlockRenderer` mescla os defaults do manifesto em toda renderização
 * (`block-renderer.tsx`), então um default de fábrica chega aqui indistinguível
 * de uma escolha do autor — e era assim que toda etapa saía azul num catálogo
 * inteiro verde sem ninguém ter pedido azul. Com a ausência preservada, as seis
 * cores do enum voltam a significar exatamente o que dizem, `'blue'` inclusive.
 */
function resolveRamp(accent: AccentKey | undefined): ChartRampColor {
  return accent == null ? DEFAULT_RAMP : (RAMP[accent] ?? DEFAULT_RAMP);
}

/** Mensagem padrão quando nenhuma linha da consulta tem papel reconhecido. */
const EMPTY_MESSAGE = 'Sem dados para esta etapa';

/**
 * Altura reservada aos estados sem desenho. 56px é o que a etapa fechada ocupa
 * (rótulo + valor + barra), então o esqueleto entra e sai sem empurrar a
 * página — que é o defeito clássico de esqueleto com altura de gráfico.
 */
const STAGE_HEIGHT = CHART_HEIGHT.spark;

/**
 * Erro que é, na verdade, falta de permissão. O motor de blocos só tem
 * `error`, mas a referência de estados separa os dois — e "sem permissão" pede
 * outra ação de quem lê (pedir acesso), não "tentar de novo".
 */
const FORBIDDEN_PATTERN = /\b403\b|forbidden|unauthorized|sem permiss|n[ãa]o autorizad/i;

/** Estado do motor de blocos → estado do `ChartFrame`. */
function frameState(
  state: BlockRenderState,
  isEmpty: boolean,
  error?: string,
): ChartFrameState {
  if (state === 'loading' || state === 'skeleton') return 'loading';
  if (state === 'error') {
    return FORBIDDEN_PATTERN.test(error ?? '') ? 'forbidden' : 'error';
  }
  return state === 'empty' || isEmpty ? 'empty' : 'success';
}

export const Component: BlockComponent<FunnelStageProps, TableData> = ({
  props,
  data,
  state,
  error,
}) => {
  const { summary, outcomes, total, notes } = readFunnelStage(data);
  const money = (value: unknown) =>
    props.valueFormat === 'compactBRL' ? formatCompactBRL(value) : formatBRL(value);

  /**
   * Contrato comum: todo texto do bloco aceita Markdown e `{{variavel}}`. O
   * vocabulário sai dos dados (`{{contagem}}`, `{{linhas.0.desfecho}}`…) mais
   * o que só a etapa sabe — o rótulo, o volume, o valor e a taxa.
   */
  const scope = buildChartScope(data, {
    etapa: props.stageLabel,
    quantidade: summary?.quantity ?? null,
    valor: summary?.value ?? null,
    taxa: summary?.hasFraction ? summary.fraction : null,
  });

  const isEmpty = !summary && outcomes.length === 0 && !total;
  const frame = frameState(state, isEmpty, error);

  // Carregando / vazio / erro / sem permissão: quem desenha é o `ChartFrame`,
  // com o rótulo da etapa no cabeçalho — o card continua legível sem dado.
  if (frame !== 'success') {
    return (
      <Card padding={4} data-slot="funnel-stage">
        <ChartFrame
          label={props.stageLabel}
          title={props.stageLabel}
          scope={scope}
          state={frame}
          height={STAGE_HEIGHT}
          emptyMessage={props.emptyMessage ?? EMPTY_MESSAGE}
          errorMessage={error}
          isCompact
        >
          {null}
        </ChartFrame>
      </Card>
    );
  }

  return (
    <Card padding={4} data-slot="funnel-stage">
      <Collapsible
        defaultIsOpen={Boolean(props.defaultOpen)}
        trigger={
          <FunnelHeader
            stageLabel={props.stageLabel}
            barLabel={props.barLabel}
            summary={summary}
            weights={outcomeWeights(outcomes)}
            color={resolveRamp(props.accent)}
            scope={scope}
            money={money}
          />
        }
      >
        <VStack gap={3}>
          <FunnelRows outcomes={outcomes} total={total} money={money} scope={scope} />
          <FunnelNotes notes={notes} money={money} scope={scope} />
        </VStack>
      </Collapsible>
    </Card>
  );
};

export const definition = defineBlock<FunnelStageProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
