/**
 * Regressão: `enrichLayoutsChartTitles` precisa tolerar layout NULO.
 *
 * O GET /dashboards/:id passa os TRÊS layouts (resolvido, draft e published)
 * por esta função. `publishedLayout` é `null` enquanto o dashboard nunca foi
 * publicado, e o coletor de referências lia `layout.rows` sem guarda — então
 * QUALQUER dashboard em rascunho respondia 500 ("Cannot read properties of
 * null (reading 'rows')"), quebrando o fluxo criar → editar e o unpublish.
 *
 * O bug passou despercebido porque a base de exemplo só tinha dashboards já
 * publicados. Estes testes fixam o contrato: entradas nulas/inválidas são
 * devolvidas intactas, sem lançar e sem consultar o banco.
 */
import { enrichLayoutsChartTitles } from '@/modules/dashboards/service';

describe('enrichLayoutsChartTitles', () => {
  it('não lança quando um dos layouts é null (dashboard nunca publicado)', async () => {
    const draft = { rows: [], filters: [] };

    await expect(
      enrichLayoutsChartTitles([draft, draft, null]),
    ).resolves.toEqual([draft, draft, null]);
  });

  it('tolera undefined e valores não-objeto sem alterá-los', async () => {
    const layouts = [undefined, 'nope', 42, null];

    await expect(enrichLayoutsChartTitles(layouts)).resolves.toEqual(layouts);
  });

  it('retorna os layouts inalterados quando não há chartId referenciado', async () => {
    const layout = { rows: [{ id: 'r1', blocks: [] }], filters: [] };

    await expect(enrichLayoutsChartTitles([layout])).resolves.toEqual([layout]);
  });
});
