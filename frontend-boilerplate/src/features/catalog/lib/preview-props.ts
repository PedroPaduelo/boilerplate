/**
 * Props de exemplo dos blocos SEM DADOS — fonte ÚNICA.
 *
 * Blocos sem `dataContract` (`title`, `rich_text`, containers de layout) não
 * têm fixture: o conteúdo deles vem das PROPS. Sem um valor de exemplo, eles
 * aparecem em branco — e um bloco em branco na galeria parece defeito de
 * render, não bloco vazio.
 *
 * É aqui — e NÃO no `defaultProps` do manifesto — que mora o texto de vitrine.
 * A diferença importa: o `BlockRenderer` mescla `defaultProps` em TODA
 * renderização, então um título de exemplo declarado lá chegaria a todo
 * dashboard de produção indistinguível de uma escolha do autor (foi assim que
 * toda seção sem nome nasceu escrita "Seção"). Este mapa só é lido pela
 * GALERIA.
 *
 * POR QUE UM MÓDULO SÓ: este mapa existia DUAS vezes — uma em
 * `catalog-entries.ts` (usada pelo card da grade) e outra em
 * `playground-helpers.ts` (usada pelo playground). As duas divergiram: o
 * `rich_text` estava só na primeira. O efeito era desconcertante — o card
 * mostrava um resumo executivo, e clicar nele abria o playground com o campo
 * `markdown` vazio e o preview em branco. Duas listas para a mesma pergunta
 * sempre terminam assim; agora é uma.
 */

/** `catalogType` → props de exemplo do bloco narrativo. */
export const PREVIEW_PROPS: Record<string, Record<string, unknown>> = {
  title: { text: 'Arrecadação por município', level: 2, align: 'left' },
  rich_text: {
    markdown: [
      '## Resumo executivo',
      '',
      'A arrecadação acumulada cresceu **12%** frente ao período anterior, puxada',
      'pela regularização de débitos no `Centro` e pelo avanço dos parcelamentos.',
      '',
      '- **Centro** lidera a arrecadação',
      '- **Sul** em recuperação consistente',
      '- Inadimplência em queda',
    ].join('\n'),
  },
  // Containers de layout com título OBRIGATÓRIO: o nome da região é conteúdo,
  // e conteúdo de exemplo vive aqui.
  section: {
    title: 'Arrecadação consolidada',
    subtitle: 'Indicadores do mês corrente',
  },
  collapsible_block: { title: 'Detalhes da apuração' },
  /**
   * Grafo: a GALERIA mostra a versão de impacto — nuvem 3D navegável no palco
   * escuro. São props do manifesto (não texto inventado); só a vitrine escolhe
   * o melhor traje. O default do bloco em produção segue "2d"/"auto".
   */
  graph_chart: { dimension: '3d', background: 'dark' },
};

/** Props de exemplo de um `catalogType` (ou `undefined` se não for narrativo). */
export function previewPropsFor(type: string): Record<string, unknown> | undefined {
  return PREVIEW_PROPS[type];
}
