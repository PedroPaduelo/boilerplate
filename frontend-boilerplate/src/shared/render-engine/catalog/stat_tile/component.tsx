/**
 * Bloco `stat_tile` (shape 'scalar') — o CARD DE RESUMO COM TENDÊNCIA da
 * referência (`04-widgets-prontos.md` §2 e §6) na versão de fileira, sobre o
 * `StatTile` de `@/shared/ui`.
 *
 * Este bloco NÃO recebe a moldura do motor (`BlockFrame`): ele já é um card, e
 * o cabeçalho do contrato comum é responsabilidade dele — o título do bloco
 * chega como `props.label` (ponte feita pelo `BlockRenderer`) e vira o título
 * de 12,25px/600 da referência.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL (§4 do briefing)
 * ---------------------------------------------------------------------------
 * As sete regras do §4 descrevem uma PLOTAGEM; este bloco é um card sem
 * desenho, então cada uma é registrada com o motivo de não se aplicar:
 *  1. Grade só horizontal, tracejada 3 ......... N/A — o card não tem grade.
 *  2. Eixos sem linha e sem marcações .......... N/A — o card não tem eixo.
 *  3. Texto dos eixos 12px/400 ................. N/A — não há rótulo de eixo.
 *  4. Linha 2,5px, curva suave, sem pontos ..... N/A — não há série desenhada.
 *  5. Coluna raio 4px no topo, largura 48% ..... N/A — não há coluna.
 *  6. Hover escurece ........................... N/A — não há marca de dado.
 *  7. Tooltip branco 90% com desfoque .......... N/A — não há tooltip.
 *
 * O que ESTE bloco tinha de conferir (§2.1/§2.2/§6) está no card compartilhado:
 *  ✓ padding 24px, `box-shadow: none`, `position: relative`
 *  ✓ fundo em gradiente 135° `lighter/0.48` → `light/0.48` da família de cor
 *  ✓ texto na cor `darker` da mesma família
 *  ✓ ícone 48×48 com 24px de respiro abaixo
 *  ✓ tendência absoluta em `top/right: 16px`, gap 4px, seta de 20px e texto
 *    12,25px/600 com `+` no positivo
 *  ✓ título 12,25px/600 com 8px abaixo · valor 17,5px/700 abreviado
 *  ✓ coluna de texto `flex-grow: 1`, `min-width: 112px`
 *
 * CONTRATO COMUM: rótulo, valor, unidade, texto auxiliar (`hint`) e mensagem
 * de vazio passam por `ChartText` (Markdown + `{{variavel}}`), com o escopo
 * derivado dos dados por `buildChartScope`. Carregando / vazio / erro são
 * estados do próprio card.
 */
import type { ScalarData } from '@dashboards/contracts';
import { StatTile, buildChartScope, chartAccentCardVariant } from '@/shared/ui';
import { formatValueByEnum, type ValueFormat } from '@/shared/lib/format';
import { defineBlock } from '../../types';
import type { BlockComponent, BlockRenderState } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type StatTileProps = {
  /** Sobrescreve o rótulo derivado de `data.label`. */
  label?: string;
  /** Formato PT-BR do valor (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
  /** Cor de categorização do ladrilho; resolvida para variante do DS. */
  accent?: string;
  /** Mostra a variação (delta). Default `true`. */
  showDelta?: boolean;
  /** Polaridade do delta: `up-good` (subir é bom) | `up-bad`. */
  deltaPolarity?: 'up-good' | 'up-bad';
  /** Texto auxiliar exibido abaixo do valor. */
  hint?: string;
};

/** Estado do motor → estado do card (o `skeleton` do motor é carregamento). */
function cardState(
  state: BlockRenderState,
  data: ScalarData | undefined,
): 'success' | 'loading' | 'empty' | 'error' {
  if (state === 'loading' || state === 'skeleton') return 'loading';
  if (state === 'error') return 'error';
  if (state === 'empty' || data == null || data.value == null) return 'empty';
  return 'success';
}

export const Component: BlockComponent<StatTileProps, ScalarData> = ({
  props,
  data,
  state,
  error,
}) => {
  const value = data?.value ?? 0;

  // O contrato entrega `delta` como FRAÇÃO (0.06); o ladrilho lê em pontos
  // percentuais.
  const showDelta = props.showDelta ?? true;
  const delta =
    showDelta && data?.delta != null ? Math.round(data.delta * 1000) / 10 : undefined;

  return (
    <StatTile
      label={props.label ?? data?.label ?? manifest.name}
      value={value}
      displayValue={formatValueByEnum(value, props.valueFormat ?? 'compactNumber')}
      delta={delta}
      higherIsBetter={(props.deltaPolarity ?? 'up-good') === 'up-good'}
      hint={props.hint}
      variant={chartAccentCardVariant(props.accent)}
      state={cardState(state, data)}
      error={error}
      scope={buildChartScope(data)}
    />
  );
};

export const definition = defineBlock<StatTileProps, ScalarData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
