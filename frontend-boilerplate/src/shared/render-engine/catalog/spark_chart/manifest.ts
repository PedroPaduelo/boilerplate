/**
 * Manifesto do bloco `spark_chart` (shape 'series') — minigráfico de tendência
 * (sparkline), sem eixos. Consome só os valores `y`.
 *
 * Nomes e tipos das props são CONTRATO com o backend/agente. A prop de cor
 * (`accent`) é resolvida pelo componente para um token de dado do design system
 * e pinta a SÉRIE (traço/preenchimento), nunca o fundo.
 *
 * 1.1.0 — `palette` REMOVIDA: num desenho de série única não há cor para
 * distribuir, e o único efeito que ela tinha era ANULAR `accent` (ver a nota no
 * lugar onde ela era declarada, logo abaixo).
 */
import type { BlockManifest } from '@dashboards/contracts';
import { ACCENT_COLORS } from '../../lib/accent';

export const manifest = {
  type: 'spark_chart',
  kind: 'chart',
  name: 'Sparkline',
  description: 'Minigráfico de tendência (sem eixos) — ótimo ao lado de um KPI.',
  source: 'custom',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      // Forma do minigráfico.
      type: {
        type: 'string',
        enum: ['area', 'bar', 'line'],
        default: 'area',
        description:
          'Forma do minigráfico: "area" (default, linha com preenchimento), "bar" (colunas) ou "line" (só a linha).',
      },
      // Curva usada em area/line.
      curveType: {
        type: 'string',
        enum: ['linear', 'monotone', 'step'],
        default: 'monotone',
        description:
          'Curva usada em type="area" e type="line": "monotone" (default) suaviza a linha; "linear" e "step" desenham segmentos retos entre os pontos.',
      },
      /*
       * `palette` foi REMOVIDA na 1.1.0 — redundante, e pior: nociva.
       *
       * O mini-gráfico desenha UMA série. Paleta é a regra de "qual cor cada
       * série/categoria recebe", e com uma série só não há o que distribuir:
       * medida na auditoria de inércia, a prop percorria os três valores sem
       * mudar um pixel. O único efeito real dela era o inverso do anunciado —
       * `palette: "multi"` DESLIGAVA a cor pedida em `accent`, em silêncio.
       *
       * Quem decide a cor aqui é `accent`, e só ele. Painéis salvos com
       * `palette` continuam válidos (o valor é ignorado).
       */
      // COR — enum do catálogo; o componente resolve para token de dado do DS.
      accent: {
        type: 'string',
        enum: [...ACCENT_COLORS],
        default: 'chart-1',
        description:
          'Cor da SÉRIE (traço e preenchimento; nunca o fundo). É a ÚNICA decisão de cor deste bloco. O valor é resolvido para uma cor de dado do design system (chart-1..5 e primary mapeiam para as cores categóricas, na mesma ordem da paleta) e o mini-gráfico usa o tom escuro dela, como manda a referência. Valores fora do enum são aceitos por compatibilidade e caem na cor padrão quando não descrevem uma cor do sistema.',
      },
    },
  },
  dataContract: {
    shape: 'series',
    spec: {
      x: { type: 'category', required: false },
      y: { type: 'number', required: true },
    },
    example: [
      { x: '1', y: 5 },
      { x: '2', y: 8 },
    ],
  },
  // `accent: 'chart-1'` MANTÉM o default de fábrica de propósito: aqui ele não
  // desliga nada (não há paleta a ciclar) e resolve exatamente para a cor
  // padrão do mini-gráfico — o tom escuro do verde do produto (§2.3).
  defaultProps: {
    type: 'area',
    curveType: 'monotone',
    accent: 'chart-1',
  },
  maxRows: 5000,
  version: '1.1.0',
} satisfies BlockManifest;
