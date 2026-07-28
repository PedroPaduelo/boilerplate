/**
 * Props de exemplo dos blocos NARRATIVOS — fonte ÚNICA.
 *
 * Blocos sem `dataContract` (`title`, `rich_text`) não têm fixture: o conteúdo
 * deles vem das PROPS. Sem um valor de exemplo, eles aparecem em branco — e um
 * bloco em branco na galeria parece defeito de render, não bloco vazio.
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
};

/** Props de exemplo de um `catalogType` (ou `undefined` se não for narrativo). */
export function previewPropsFor(type: string): Record<string, unknown> | undefined {
  return PREVIEW_PROPS[type];
}
