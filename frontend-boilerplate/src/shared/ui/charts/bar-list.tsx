/**
 * RANKING EM DOM — "top N por valor": lista ordenada em que a barra dá a
 * proporção e o texto dá o número exato.
 *
 * COMPONENTE PRÓPRIO: o Astryx não tem ranking. Substitui `bar-list-tremor.tsx`
 * (398 linhas), que escrevia o rótulo DENTRO da barra colorida e, por causa
 * disso, carregava um calculador de luminância WCAG, um parser de hex/rgb e um
 * `text-shadow` de contorno só para o texto não sumir. Aqui o rótulo fica FORA
 * da barra: o problema de contraste deixa de existir e a cor volta a ser dado.
 *
 * Não é `role="img"`: é uma `<ol>` com rótulo e valor em TEXTO — já legível por
 * leitor de tela, sem equivalente textual extra.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT — repaginado por ANALOGIA (decisão em `docs/charts/NOTAS.md` [SUB-09])
 * ---------------------------------------------------------------------------
 * A referência não tem "ranking em DOM". Este componente combina os dois
 * layouts mais próximos, sem inventar um terceiro:
 *
 *  • a BARRA segue a barra horizontal (`03-tipos-de-grafico.md` §8) na COR
 *    (`VERDE80`, `palette.primary80`), no RAIO (2px) e no TRAÇO (0); a
 *    ESPESSURA, porém, sai da escala do tema e não da fração:
 *    `geometry.trackThickness` (12px), o degrau das barras de LISTA — sem eixo
 *    e ao lado de uma linha de texto. O trilho é a MESMA barra apagada
 *    (`trackLight`): mesma espessura, muda só a cor;
 *  • o par RÓTULO/VALOR segue a legenda própria (`05-tooltip-legenda-css.md`
 *    §3): rótulo 11,375px/500, valor com peso 600;
 *  • o hover ESCURECE a barra (`02-configuracao-base.md` §4) — a linha inteira
 *    é a área de hover.
 */
import type { CSSProperties } from 'react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CHART_EMPTY_MESSAGE } from './chart-frame';
import { ChartSkeleton } from './chart-skeleton';
import { ChartText } from './chart-text';
import { chartPlainText } from './chart-text-html';
import { buildChartScope } from './chart-template';
import { formatChartValue } from './chart-data';
import type { ChartStateProps, ValueFormatter } from './types';
import type { ChartPalette, ChartSeriesColor } from './use-chart-palette';
import { CHART_SERIES_COLORS, darkenColor, useChartPalette } from './use-chart-palette';

/**
 * Faixa vertical de UMA linha do ranking, em px — a analogia, no DOM, da faixa
 * de categoria de uma barra horizontal. É o espaço que a linha reserva (par
 * rótulo/valor + barra) e a unidade com que o esqueleto calcula a área a
 * segurar, para o card não pular quando o dado chega. A linha inteira também é
 * a área de hover.
 *
 * NÃO é mais a origem da espessura da barra. A `RankingBar` derivava a altura
 * de `RANKING_ROW_BAND × geometry.hBarWidth` (30% de 32 ≈ 10px) — a fração da
 * §8 aplicada a uma faixa de DOM —, e era isso que fazia do ranking a barra
 * mais fina do catálogo. Agora a espessura é o degrau de lista da escala
 * (`geometry.trackThickness`).
 *
 * O valor é 37 porque é o que a linha MEDE hoje no navegador (par rótulo/valor
 * + respiro + os 12px da barra), não um número redondo escolhido a olho. Ficou
 * em 32 desde que a barra tinha 10px: a reserva do esqueleto ficava ~5px curta
 * POR LINHA, e num ranking de cinco o card pulava ~25px na chegada do dado —
 * exatamente o salto que esta constante existe para evitar.
 */
export const RANKING_ROW_BAND = 37;

/**
 * Tipografia do par rótulo/valor — a legenda própria da referência (§3).
 * Declarada aqui porque o `leaderboard` desenha o MESMO par: uma linha de
 * ranking tem que ler igual nos dois blocos.
 */
export const RANKING_TEXT = {
  /** Rótulo: 11,375px/500 — o degrau `3xs` do tema é exatamente esse valor. */
  label: '3xs',
  /** Valor: peso 600 no degrau de 14px (`sm`) — ver NOTAS.md [SUB-09]. */
  value: 'sm',
} as const;

/** Uma linha do ranking. */
export interface BarListItem {
  /** Chave estável. Sem isto, usa o rótulo. */
  key?: string;
  /** Nome da categoria. Aceita Markdown e `{{variaveis}}`. */
  label: string;
  /** Valor que define o comprimento da barra. */
  value: number;
  /** Quando presente, o rótulo vira link. */
  href?: string;
  /** Cor fixa da barra. Sem isto, segue `hasColorByItem`. */
  color?: ChartSeriesColor;
}

export interface BarListProps extends Omit<ChartStateProps, 'label' | 'summary'> {
  /** Itens do ranking. */
  data: BarListItem[];
  /** Ordem de exibição. */
  sortOrder?: 'ascending' | 'descending' | 'none';
  /** Uma cor por item em vez de uma cor só para toda a lista. */
  hasColorByItem?: boolean;
  /** Formata o valor exibido à direita. */
  valueFormatter?: ValueFormatter;
  /** Nº de linhas reservadas pelo esqueleto no estado de carregamento. */
  loadingRows?: number;
}

export interface RankingBarProps {
  /** Fração preenchida, de 0 a 1. Valores fora da faixa são grampeados. */
  ratio: number;
  /** Cor RESOLVIDA da barra (de `useChartPalette`) — o hover a escurece. */
  color: string;
}

/**
 * Trilho + barra proporcional de uma linha de ranking (§8: raio 2px, traço 0;
 * espessura pelo degrau de lista da escala). Decorativa (`aria-hidden`): o
 * valor já está escrito ao lado, em texto.
 *
 * O hover escurece quando a LINHA recebe o ponteiro — quem usa marca a linha
 * com a classe `group`.
 */
export function RankingBar({ ratio, color }: RankingBarProps) {
  const palette = useChartPalette();
  const percent = Math.min(Math.max(ratio, 0), 1) * 100;
  /**
   * Raio das barras de lista: `barRadiusFlat` (2px), o raio da barra horizontal
   * da §8 — e o mesmo nas quatro (ranking, trilho da base, progresso linear,
   * etapa de funil), porque raio diferente na mesma espessura é a segunda coisa
   * mais visível depois da espessura diferente.
   *
   * Por que não os outros dois candidatos: 4px é o raio da COLUNA (§10), do
   * degrau de 32px — numa barra de 12px arredondaria um terço da espessura;
   * cápsula (raio = metade, 6px) arredonda a PONTA que carrega o dado, encurta
   * a leitura do valor e faz a marca de medida parecer um chip de status. 2px é
   * 1/6 da espessura: suaviza o canto e mantém a ponta reta.
   *
   * O trilho recebe o MESMO raio porque é ele que recorta o preenchimento.
   */
  const radius = palette.geometry.barRadiusFlat;

  return (
    <span
      aria-hidden="true"
      data-slot="ranking-bar"
      className="block w-full overflow-hidden"
      style={{
        // runtime: medidas e cores do DESENHO, todas do `chart-theme`. A
        // espessura é o DEGRAU DE LISTA da escala (`trackThickness`, 12px), o
        // mesmo do progresso linear e da etapa de funil: as três são a mesma
        // marca — barra SEM eixo, acompanhando uma linha de texto —, e o que as
        // separava era só a seção da referência de onde cada uma herdou a sua
        // fração. Aqui isso dava `RANKING_ROW_BAND × hBarWidth` ≈ 10px, a barra
        // mais fina do catálogo, ao lado de uma coluna de 21px.
        blockSize: palette.geometry.trackThickness,
        borderRadius: radius,
        backgroundColor: palette.chromeVar('trackLight'),
      }}
    >
      <span
        data-slot="ranking-bar-fill"
        // TRILHA = BARRA: o preenchimento é `h-full`, então ele tem exatamente a
        // espessura do trilho — entre os dois muda só a cor.
        className="block h-full bg-[color:var(--chart-bar)] group-hover:bg-[color:var(--chart-bar-hover)]"
        style={
          {
            // runtime: a largura é a FRAÇÃO DO DADO e a cor é a da série. As
            // duas cores viajam como variável porque o hover ESCURECE (§4) e a
            // troca fica no CSS, sem estado de React por linha.
            inlineSize: `${percent}%`,
            borderRadius: radius,
            transitionProperty: 'background-color',
            transitionDuration: `${palette.motion.duration}ms`,
            '--chart-bar': color,
            '--chart-bar-hover': darkenColor(color),
          } as CSSProperties
        }
      />
    </span>
  );
}

/** Ordena uma cópia dos itens conforme `sortOrder`. */
function sortItems(data: BarListItem[], order: BarListProps['sortOrder']): BarListItem[] {
  if (order === 'none') return data;
  return [...data].sort((a, b) =>
    order === 'ascending' ? a.value - b.value : b.value - a.value,
  );
}

/**
 * Cor da barra da linha `index`.
 *
 * Série ÚNICA usa o verde escuro a 80% (`palette.primary80`): a referência é
 * explícita (`01-fundamentos.md` §2.1) — `rgba(0,120,103,0.8)` é a cor mais
 * usada do catálogo, mais até que o verde puro. Um acento DIFERENTE do padrão
 * vence; `hasColorByItem` cicla a paleta, uma cor por linha.
 */
function barColor(
  palette: ChartPalette,
  index: number,
  hasColorByItem: boolean,
  color?: ChartSeriesColor,
): string {
  if (hasColorByItem) return palette.colorAt(index, color);
  // A 1ª cor do ciclo é o default do catálogo (`accent: "chart-1"`): nela a
  // referência pede o verde escuro a 80%, não o `#00A76F` puro.
  return !color || color === CHART_SERIES_COLORS[0]
    ? palette.primary80
    : palette.colorAt(0, color);
}

/** Ranking horizontal "top N", com barra proporcional e valor à direita. */
export function BarList({
  data,
  sortOrder = 'descending',
  hasColorByItem = false,
  valueFormatter = formatChartValue,
  loadingRows = 5,
  isLoading,
  emptyMessage = CHART_EMPTY_MESSAGE,
}: BarListProps) {
  const palette = useChartPalette();
  // Contrato comum: rótulo, valor e mensagem de vazio aceitam Markdown e
  // `{{variavel}}` — o vocabulário sai dos próprios dados do ranking.
  const scope = buildChartScope(data);

  if (isLoading) {
    // A área reservada é a da lista que vai aparecer (nº de linhas × faixa),
    // para o card não pular quando o dado chegar.
    return (
      <ChartSkeleton height={loadingRows * RANKING_ROW_BAND} label="Carregando ranking" />
    );
  }

  if (data.length === 0) {
    // `EmptyState.title` do DS é `string`: o markdown inline é achatado por
    // `chartPlainText`, que é o que a moldura da base também faz.
    return (
      <EmptyState isCompact title={chartPlainText(emptyMessage, scope) || emptyMessage} />
    );
  }

  const items = sortItems(data, sortOrder);
  const max = Math.max(...items.map((item) => item.value), 0);

  /*
   * Respiro ENTRE linhas do ranking: `gap={1.5}` (6px).
   *
   * Era `gap={3}` (12px) para uma linha que mede 37px — 32% da altura da lista
   * virava vão. Num "Top 10" isso somava 108px, e o card ia a 628px de altura
   * para 370px de conteúdo real: o bloco mais alto do dashboard inteiro, e o
   * "gráfico excessivamente alto" que a queixa apontou.
   *
   * 6px mantém as linhas separadas sem transformar a lista num acordeão: cada
   * linha já é um par rótulo/valor + a própria barra, que é o que separa uma da
   * outra visualmente. Ranking é para ser lido de cima a baixo — quanto mais
   * junto, mais fácil comparar duas posições vizinhas.
   */
  return (
    <VStack as="ol" gap={1.5} width="100%" data-slot="bar-list">
      {items.map((item, index) => (
        <VStack
          as="li"
          key={item.key ?? item.label}
          gap={1}
          // `group`: a linha INTEIRA é a área de hover que escurece a barra.
          className="group"
          data-slot="bar-list-item"
        >
          <HStack gap={3} hAlign="between" vAlign="center">
            {item.href ? (
              <Link
                href={item.href}
                size={RANKING_TEXT.label}
                weight="medium"
                maxLines={1}
              >
                <ChartText value={item.label} scope={scope} />
              </Link>
            ) : (
              <Text
                size={RANKING_TEXT.label}
                weight="medium"
                color="secondary"
                maxLines={1}
              >
                <ChartText value={item.label} scope={scope} />
              </Text>
            )}
            <Text size={RANKING_TEXT.value} weight="semibold" hasTabularNumbers>
              <ChartText value={valueFormatter(item.value)} scope={scope} />
            </Text>
          </HStack>
          <RankingBar
            ratio={max === 0 ? 0 : item.value / max}
            color={barColor(palette, index, hasColorByItem, item.color)}
          />
        </VStack>
      ))}
    </VStack>
  );
}
