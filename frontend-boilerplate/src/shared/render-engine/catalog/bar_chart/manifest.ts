/**
 * Manifesto do bloco `bar_chart` — compara valores entre categorias
 * (shape 'series', x categórico, `series` opcional p/ multi-série).
 * Alinhado a @dashboards/contracts.
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente e seguem iguais. O
 * que mudou foi a semântica de COR (`accent` e `seriesColors` viram tokens de
 * dado do design system, com os valores antigos traduzidos pelo componente) e,
 * na 1.2.0, o default de `valueFormat`: era `compactBRL`, o que fazia contagem
 * de mensagens sair como "R$ 7". Agora é `number` (ver `lib/value-format.ts`).
 *
 * TODAS as props têm `description` completa — o MCP lê este schema p/ instruir
 * a IA na montagem de dashboards.
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';
import { VALUE_FORMATS } from '@/shared/lib/format';

export const manifest = {
  type: 'bar_chart',
  kind: 'chart',
  name: 'Gráfico de Barras',
  description:
    'Compara valores entre categorias em barras verticais (colunas) ou horizontais. Suporta empilhamento (stacked) quando os dados têm múltiplas séries (campo `series`).',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Empilhamento.
      stacked: {
        type: 'boolean',
        default: false,
        description:
          'Empilha as séries em cada coluna (requer dados MULTI-SÉRIE: pontos com o campo `series`). true = cada categoria do eixo X vira uma coluna com segmentos empilhados, um por série. false = barras agrupadas. LIMITAÇÃO: só vale na orientação "vertical"; em "horizontal" o empilhamento é ignorado — cada par categoria × série vira uma barra própria, rotulada "Categoria · Série" e com a cor da SÉRIE. Se não houver dados multi-série, degrada para barras planas.',
      },
      orientation: {
        type: 'string',
        enum: ['vertical', 'horizontal'],
        default: 'vertical',
        description:
          'Orientação das barras: "vertical" (colunas, default) ou "horizontal" (barras deitadas — bom para rótulos longos). O empilhamento (stacked) só funciona na vertical.',
      },
      // COR base — resolvida para token de dado do DS pelo componente.
      // SEM `default` de propósito: o BlockRenderer mescla `defaultProps` em
      // toda renderização, e como `accent` VENCE o modo de paleta, um default
      // de fábrica desligaria `palette: "multi"` em todo gráfico do catálogo.
      // Ausência aqui precisa significar "não pedi cor".
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        description:
          'Cor de TODAS as barras. Declarar `accent` é pedir cor única: ele vence o modo de paleta (inclusive "multi"). OMITA para que a cor venha de `palette`. O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta); valores fora do enum são aceitos por compatibilidade e, quando não descrevem uma cor do sistema, caem na paleta.',
      },
      // Modo de paleta automática. O valor "none" foi REMOVIDO na 1.3.0:
      // medido na auditoria de inércia, desenhava igual a "single" — era um
      // segundo nome para o mesmo resultado. Painéis salvos com "none"
      // continuam funcionando (caem na cor padrão do tipo).
      palette: {
        type: 'string',
        enum: ['single', 'multi'],
        default: 'single',
        description:
          'Modo de paleta AUTOMÁTICA: "single" (default) = todas as barras/séries com a MESMA cor; "multi" = cicla a paleta categórica do design system (uma cor por série; com série única, uma cor por categoria). Perde para `accent` e para `seriesColors` quando algum deles é declarado.',
      },
      // Cor MANUAL por série — configurável, NÃO automático.
      seriesColors: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Cor por série, na ORDEM (índice 0 = primeira série, 1 = segunda, etc.). Cada item é resolvido para uma cor de dado do design system e SOBRESCREVE `accent` e `palette` naquela série. Se omitido, vale `accent`; sem ele, `palette`. Use principalmente com stacked=true para fixar a cor de cada série empilhada.',
      },
      // Legenda série → cor.
      showLegend: {
        type: 'boolean',
        default: true,
        description:
          'Exibe a legenda (uma marca de cor por série + rótulo) abaixo da plotagem. Com série única e sem cor por categoria a legenda é omitida de qualquer forma, pois não há o que distinguir.',
      },
      // valueFormat — ENUM FECHADO, default 'number' (contagem).
      valueFormat: {
        type: 'string',
        enum: [...VALUE_FORMATS],
        default: 'number',
        description:
          'Formato PT-BR do valor exibido no eixo e no tooltip. ENUM FECHADO (sem input livre): BRL, compactBRL, number, compactNumber, percent. Default "number" (contagem): escolha "BRL"/"compactBRL" QUANDO A MEDIDA FOR DINHEIRO — o bloco não adivinha a natureza do dado.',
        oneOf: [
          {
            const: 'BRL',
            description: 'formatBRL — moeda BRL completa (ex.: "R$ 2.609.946.157,73").',
          },
          {
            const: 'compactBRL',
            description: 'formatCompactBRL — moeda BRL compacta (ex.: "R$ 2,61 bi").',
          },
          {
            const: 'number',
            description:
              'formatNumberBR — número PT-BR com milhar (ex.: "1.234.567,8"). DEFAULT — use para CONTAGEM.',
          },
          {
            const: 'compactNumber',
            description: 'formatCompactNumberBR — número compacto (ex.: "2,61 bi").',
          },
          {
            const: 'percent',
            description:
              'formatPercentBR — percentual a partir de FRAÇÃO (ex.: 0.125 → "12,5%").',
          },
        ],
      },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: true },
      y: { type: 'number', required: true },
      series: { type: 'category', required: false },
    },
    example: [
      { x: 'Jan', y: 120, series: 'Receita' },
      { x: 'Jan', y: 95, series: 'Despesa' },
      { x: 'Fev', y: 138, series: 'Receita' },
      { x: 'Fev', y: 110, series: 'Despesa' },
    ],
  },
  // `accent` NÃO tem default (ver a nota no schema): com ele aqui, `palette`
  // nunca sairia do modo de cor única.
  defaultProps: {
    orientation: 'vertical',
    stacked: false,
    palette: 'single',
    showLegend: true,
    valueFormat: 'number',
  },
  minColumns: 1,
  maxRows: 5000,
  version: '1.3.0',
} satisfies BlockManifest;
