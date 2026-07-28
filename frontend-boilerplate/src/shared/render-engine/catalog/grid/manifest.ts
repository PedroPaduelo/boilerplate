/**
 * Manifesto do bloco `grid` — o CONTÊINER DE LAYOUT canônico do catálogo.
 *
 * É uma div em volta: organiza sub-blocos em COLUNAS e LINHAS e não desenha
 * nada por conta própria (sem borda, sem sombra, sem padding) a menos que se
 * peça `variant`. Substitui o `bento_grid` (mosaico com `span`/`rowSpan`
 * livres) e é o motor de grade que `section` e `collapsible_block` usam por
 * dentro — três blocos, uma grade só.
 *
 * AS TRÊS GARANTIAS que este bloco dá a quem compõe (é por elas que ele existe):
 *
 *  1. Todos os itens de uma linha têm a MESMA largura e a MESMA altura. Não há
 *     como dois gráficos irmãos saírem com tamanhos diferentes por acidente.
 *  2. A linha tem altura definida — derivada do tipo dos filhos (KPI é baixo,
 *     série é alta, texto não reserva nada) ou fixada em `rowHeight`.
 *  3. Em tela estreita as colunas caem sozinhas (3 → 2 → 1) e a última estica
 *     para a largura toda. Sem breakpoint escrito à mão.
 *
 * Exemplo (IA via MCP) — três gráficos do mesmo tamanho:
 *   { type:'grid', props:{ columns:3 }, blocks:[
 *       { type:'bar_chart',  span:4, dataBinding:{...} },
 *       { type:'donut',      span:4, dataBinding:{...} },
 *       { type:'line_chart', span:4, dataBinding:{...} } ] }
 */
import type { BlockManifest } from '@dashboards/contracts';

export const manifest = {
  type: 'grid',
  kind: 'layout',
  name: 'Grid (contêiner)',
  description: [
    'Contêiner de layout: organiza os sub-blocos (`block.blocks`) em colunas e linhas.',
    'NÃO é um card — não desenha borda, sombra nem padding (use `variant` se quiser).',
    'Todos os itens de uma linha saem com a MESMA largura e a MESMA altura; a altura da',
    'linha é derivada do tipo dos filhos ou fixada em `rowHeight`; em telas estreitas as',
    'colunas colapsam sozinhas (3 → 2 → 1). Aceita qualquer bloco do catálogo como filho',
    '(gráficos, tabelas, títulos, textos, efeitos e outros containers).',
    'ARRANJOS PRONTOS: 1 coluna = `props:{columns:1}` (leitura sequencial: título, série,',
    'tabela); 2 colunas = `props:{columns:2}` (pares — 4 filhos viram 2+2, nunca 3+1);',
    '3 colunas = omita `columns` e mande 3 filhos (o teto já é 3); KPIs + gráficos = DOIS',
    '`grid` irmãos dentro de um `grid` com `columns:1` — a faixa de KPIs fica compacta e a',
    'de gráficos fica cheia, o que uma linha só não permitiria.',
    'Props: columns, gap, align, rowHeight, itemSizing, variant.',
  ].join(' '),
  source: 'astryx:grid',
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: 'integer',
        minimum: 1,
        maximum: 12,
        description:
          'Número de colunas. OMITA para o padrão recomendado: o grid usa uma coluna por filho, até 3 (gráficos/tabelas) ou 4 (cartões de número). Informe só quando quiser forçar a quantidade de faixas — ex.: `2` para manter pares.',
      },
      gap: {
        type: 'string',
        enum: ['none', 'sm', 'md', 'lg'],
        default: 'md',
        description:
          'Espaçamento entre as células: none (colado), sm (compacto), md (default), lg (espaçado).',
      },
      align: {
        type: 'string',
        enum: ['stretch', 'start', 'center', 'end'],
        default: 'stretch',
        description:
          'Alinhamento vertical dos itens na linha. `stretch` (default) é o que iguala as alturas — mude apenas para conteúdo que não deve esticar.',
      },
      rowHeight: {
        type: 'string',
        enum: ['auto', 'compact', 'default', 'tall'],
        description:
          'Altura da linha. OMITA para derivar do tipo dos filhos (é o recomendado): `compact` para cartões de número, `default` para composições/tabelas, `tall` para séries temporais, `auto` para linhas só de texto. Informe apenas para forçar um degrau — o valor é um PISO, o conteúdo nunca é cortado.',
      },
      itemSizing: {
        type: 'string',
        enum: ['equal', 'span'],
        default: 'equal',
        description:
          'Largura dos itens. `equal` (default): faixas iguais — `span` só é lido para pedir a linha inteira (`span: 12`). `span`: mosaico assimétrico, em que cada filho ocupa `span` colunas de 12 e `rowSpan` linhas. Use `span` apenas quando o destaque desigual for intencional.',
      },
      variant: {
        type: 'string',
        enum: ['plain', 'card', 'framed'],
        default: 'plain',
        description:
          'Superfície do contêiner. `plain` (default): nenhuma pintura — só a organização. `card`: cartão com padding e elevação. `framed`: moldura fechada, para leitura densa. Evite `card` quando os filhos já são cards (gráficos emoldurados): vira card dentro de card.',
      },
    },
  },
  defaultProps: { gap: 'md', align: 'stretch', itemSizing: 'equal', variant: 'plain' },
  version: '1.0.0',
} satisfies BlockManifest;
