/**
 * Bloco `bar_list` (shape 'categorical') — ranking "Top N" sobre o `BarList` de
 * `@/shared/ui`.
 *
 * O que mudou na migração:
 *  - o rótulo saiu de DENTRO da barra. Isso apagou de uma vez o cálculo de
 *    luminância WCAG, o parser de cor e o contorno de texto que o legado
 *    carregava só para o nome não sumir na barra colorida;
 *  - COR: `accent` continua aceitando o vocabulário antigo, mas vira token de
 *    dado do DS e VENCE a paleta (regra de `chart-accent.ts`); `palette:
 *    "multi"` cicla a paleta por item quando não há acento;
 *  - `textColor` foi REMOVIDA na 1.2.0: existia só para corrigir o contraste do
 *    rótulo escrito DENTRO da barra colorida, e o rótulo saiu de lá nesta
 *    migração. Ver a justificativa no manifesto;
 *  - a lista já é texto (`<ol>` com rótulo e valor), então não precisa de
 *    equivalente acessível extra — leitor de tela lê a linha inteira.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL (§4 do briefing — um item por linha da tabela)
 * ---------------------------------------------------------------------------
 * A referência não tem "ranking em DOM": o layout é a BARRA HORIZONTAL (§8)
 * com o par rótulo/valor da LEGENDA PRÓPRIA (§05-3). Registro em NOTAS.md.
 *
 *  1. Grade só horizontal, tracejada 3 ....... N/A — ranking em DOM, sem grade.
 *  2. Eixos sem linha e sem marcações ........ N/A — sem eixo; o rótulo é texto.
 *  3. Texto dos eixos 12px/400/#919EAB ....... N/A — o par rótulo/valor segue a
 *     legenda própria (§05-3): 11,375px/500 e peso 600 no degrau de 14px.
 *  4. Linha 2,5px, curva suave, sem pontos ... N/A — não há linha.
 *  5. Coluna raio 4px no topo, largura 48% ... adaptado da §8: raio 2px
 *     (`geometry.barRadiusFlat`) e traço 0. A ESPESSURA não vem da fração da
 *     §8 (30% da faixa da linha, que dava ≈10px e fazia deste o bloco de barra
 *     mais fina do catálogo): vem do degrau de LISTA da escala do tema,
 *     `geometry.trackThickness` (12px) — o mesmo do `progress_bar` e da etapa
 *     de funil, porque as três são barra SEM eixo ao lado de uma linha de
 *     texto. Trilho em `chrome('trackLight')`, na MESMA espessura da barra.
 *  6. Hover ESCURECE ......................... `darkenColor` sobre a cor da
 *     barra, disparado pelo hover da linha inteira.
 *  7. Tooltip branco 90% com blur ............ N/A — o valor já está escrito ao
 *     lado da barra; não há nada que o tooltip revelaria.
 *  + Cor: `palette.primary80` (série única, §2.1) / ciclo da paleta em "multi".
 *  + Animação de entrada: N/A — não há desenho a percorrer. O único movimento é
 *    a transição de cor do hover, com a duração de `palette.motion`.
 *  + Estados: esqueleto da base (`ChartSkeleton`), vazio em `EmptyState`, erro
 *    em `ChartFrame state="error"`. A lista NÃO é `role="img"` — é texto.
 */
import type { CategoricalData } from '@dashboards/contracts';
import { BarList, ChartFrame, chartAccentColor, isMultiColorPalette } from '@/shared/ui';
import type { BarListItem } from '@/shared/ui';
import type { ValueFormat } from '@/shared/lib/format';
import { CHART_BODY_HEIGHT } from '../../lib/block-sizing';
import { formatCatalogValue } from '../../lib/value-format';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BarListProps = {
  sortOrder?: 'ascending' | 'descending' | 'none';
  /**
   * Modo de paleta. `none` saiu do enum do manifesto por ser redundante (ver
   * lá), mas continua ACEITO aqui: painel salvo com ele lê como "não
   * multicolorido", que é o que ele sempre desenhou.
   */
  palette?: 'single' | 'multi' | 'none';
  /** Cor das barras; resolvida para token do DS. Vence `palette: "multi"`. */
  accent?: string;
  /** Formato do valor ao lado da barra (enum fechado do catálogo). */
  valueFormat?: ValueFormat;
};

type CategoryPoint = { label: string; value: number | null };

export const Component: BlockComponent<BarListProps, CategoricalData> = ({
  props,
  data,
  state,
  error,
}) => {
  const items = (data ?? []) as CategoryPoint[];
  const formatValue = (value: number) => formatCatalogValue(value, props.valueFormat);

  /**
   * COR — a regra de precedência publicada em `chart-accent.ts`:
   *  1. `accent` reconhecível vence sempre (pedir uma cor É pedir cor única);
   *  2. `multi` só cicla a paleta quando NÃO há acento.
   *
   * Era `props.palette === 'single' ? chartAccentColor(...) : undefined`: o
   * acento só valia se o autor TAMBÉM escolhesse a paleta certa, e quem pedia
   * só a cor não via mudança nenhuma.
   */
  const isMulti = isMultiColorPalette(props.palette, props.accent);
  const accent = isMulti ? undefined : chartAccentColor(props.accent);
  const rows: BarListItem[] = items.map((item) => ({
    label: item.label,
    value: item.value ?? 0,
    color: accent,
  }));

  // Erro é BANNER, não uma lista vazia com o texto do erro no lugar da
  // mensagem: quem desenha os estados do catálogo é o `ChartFrame` da base.
  if (state === 'error') {
    return (
      <ChartFrame
        label={manifest.name}
        height={CHART_BODY_HEIGHT.categorical}
        state="error"
        errorMessage={error}
      >
        {null}
      </ChartFrame>
    );
  }

  return (
    <BarList
      data={rows}
      sortOrder={props.sortOrder ?? 'descending'}
      hasColorByItem={isMulti}
      valueFormatter={formatValue}
      isLoading={state === 'loading' || state === 'skeleton'}
    />
  );
};

/**
 * Insights de rodapé: primeiro e último do ranking. Formata pelo MESMO
 * `valueFormat` do bloco — o insight repete o número que a barra mostra, e as
 * duas leituras não podem discordar na unidade.
 */
function deriveTakeaway(
  data: CategoricalData,
  props: BarListProps = {},
): string[] | undefined {
  const items = (data ?? []) as CategoryPoint[];
  if (items.length === 0) return undefined;

  const format = (value: number) => formatCatalogValue(value, props.valueFormat);
  const top = items.reduce((best, item) =>
    (item.value ?? 0) > (best.value ?? 0) ? item : best,
  );
  if ((top.value ?? 0) <= 0) return undefined;

  const insights = [`Top 1: ${top.label} (${format(top.value ?? 0)})`];

  if (items.length > 1) {
    const bottom = items.reduce((best, item) =>
      (item.value ?? 0) < (best.value ?? 0) ? item : best,
    );
    if ((bottom.value ?? 0) > 0 && bottom !== top) {
      insights.push(`Último: ${bottom.label} (${format(bottom.value ?? 0)})`);
    }
  }

  return insights;
}

export const definition = defineBlock<BarListProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
  deriveTakeaway,
});
export default definition;
