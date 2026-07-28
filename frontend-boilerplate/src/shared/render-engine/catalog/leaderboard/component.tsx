/**
 * Bloco `leaderboard` (shape 'categorical') — ranking com posição, identidade e
 * barra proporcional ao líder (`leaderboard-list.tsx`, próprio do bloco).
 *
 * O que mudou na migração:
 *  - a lista foi reescrita sobre o design system (avatar, tipografia e barra de
 *    dado com cor de token) — sumiram as classes de cor e a barra `bg-primary`;
 *  - o valor passou a ser formatado em PT-BR pelo mesmo helper dos outros
 *    blocos, com a `unit` colada só quando ela existe;
 *  - carregando e sem dados deixaram de ser silêncio: viram esqueleto e aviso.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL (§4 do briefing — um item por linha da tabela)
 * ---------------------------------------------------------------------------
 * A referência não tem "ranking em DOM": o layout é a BARRA HORIZONTAL (§8)
 * com o par rótulo/valor da LEGENDA PRÓPRIA (§05-3). Registro em NOTAS.md.
 *
 *  1. Grade só horizontal, tracejada 3 ....... N/A — ranking em DOM, sem grade.
 *  2. Eixos sem linha e sem marcações ........ N/A — sem eixo; a posição, o
 *     nome e o valor são texto.
 *  3. Texto dos eixos 12px/400/#919EAB ....... N/A — posição, nome e valor
 *     seguem a legenda própria (§05-3): 11,375px/500 e peso 600 em 14px.
 *  4. Linha 2,5px, curva suave, sem pontos ... N/A — não há linha.
 *  5. Coluna raio 4px no topo, largura 48% ... adaptado da §8 pela `RankingBar`:
 *     raio 2px, traço 0, altura de 30% da faixa e trilho em `trackLight`.
 *  6. Hover ESCURECE ......................... `darkenColor` sobre a cor da
 *     barra, disparado pelo hover da linha inteira.
 *  7. Tooltip branco 90% com blur ............ N/A — o valor já está escrito ao
 *     lado da barra.
 *  + Cor: `palette.primary80` (série única, §2.1) — o ranking compara pessoas,
 *    não categorias, então uma cor por linha só adicionaria ruído.
 *  + Animação de entrada: N/A — não há desenho a percorrer. O único movimento é
 *    a transição de cor do hover, com a duração de `palette.motion`.
 *  + Estados: esqueleto da base (`ChartSkeleton`), vazio em `EmptyState`, erro
 *    em `ChartFrame state="error"`. A lista NÃO é `role="img"` — é texto.
 */
import type { CategoricalData } from '@dashboards/contracts';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import {
  CHART_EMPTY_MESSAGE,
  ChartFrame,
  ChartSkeleton,
  buildChartScope,
  chartPlainText,
} from '@/shared/ui';
// Import direto do módulo: a faixa da linha do ranking é da camada de gráficos,
// mas o barril `@/shared/ui` é da BASE e está fechado para esta trilha (pedido
// registrado em `docs/charts/PEDIDOS-BASE.md`).
import { RANKING_ROW_BAND } from '@/shared/ui';
import { formatNumberBR } from '@/shared/lib/format';
import { CHART_BODY_HEIGHT } from '../../lib/block-sizing';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { LeaderboardList } from './leaderboard-list';
import { manifest } from './manifest';
import { fixture } from './fixture';

type LeaderboardProps = { unit?: string };
type CategoryPoint = { label: string; value: number | null };

/** Linhas de esqueleto — mesma silhueta da lista, para não "pular" ao carregar. */
const LOADING_ROWS = 5;

export const Component: BlockComponent<LeaderboardProps, CategoricalData> = ({
  props,
  data,
  state,
  error,
}) => {
  const items = (data ?? []) as CategoryPoint[];
  // Contrato comum: nome, valor e mensagem de vazio aceitam Markdown e
  // `{{variavel}}`, com o vocabulário derivado dos dados do ranking.
  const scope = buildChartScope(items);

  if (state === 'loading' || state === 'skeleton') {
    return (
      <ChartSkeleton
        height={LOADING_ROWS * RANKING_ROW_BAND}
        label={`Carregando ${manifest.name}`}
      />
    );
  }

  // Erro é BANNER, não área em branco: quem desenha os estados é a base.
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

  if (items.length === 0) {
    return (
      <EmptyState
        isCompact
        title={chartPlainText(CHART_EMPTY_MESSAGE, scope) || CHART_EMPTY_MESSAGE}
        description={manifest.name}
      />
    );
  }

  // A barra é proporcional ao LÍDER, não ao total: o ranking compara pessoas
  // entre si, não a fatia de cada uma no bolo.
  const leader = Math.max(...items.map((item) => item.value ?? 0), 0);
  const unit = props.unit?.trim();

  return (
    <LeaderboardList
      scope={scope}
      items={items.map((item, index) => ({
        key: `${item.label}-${index}`,
        name: item.label,
        value: unit
          ? `${formatNumberBR(item.value ?? 0)} ${unit}`
          : formatNumberBR(item.value ?? 0),
        ratio: leader > 0 ? (item.value ?? 0) / leader : 0,
      }))}
    />
  );
};

export const definition = defineBlock<LeaderboardProps, CategoricalData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
