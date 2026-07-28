/**
 * Regras do módulo `catalog` sem HTTP: filtros de listagem e — o que mais
 * importa — o formato do erro de validação.
 *
 * O erro é a parte testada com mais cuidado porque quem o lê, na maior parte
 * das vezes, é um modelo de linguagem tentando se corrigir sozinho. Um erro que
 * não diz ONDE e O QUE fazer transforma uma correção automática em uma pergunta
 * ao usuário.
 */
import {
  listCatalog,
  getCatalogBlock,
  validateCatalogBlock,
} from '@/modules/catalog/service';

describe('listCatalog', () => {
  it('não expõe tipos internos (__example) na superfície pública', () => {
    const { blocks } = listCatalog({ includeSchemas: true });
    expect(blocks.map((b) => b.type)).not.toContain('__example');
    expect(getCatalogBlock('__example')).toBeUndefined();
  });

  it('devolve a versão do catálogo junto com os blocos', () => {
    const result = listCatalog({ includeSchemas: true });
    expect(typeof result.catalogVersion).toBe('number');
    expect(result.total).toBe(result.blocks.length);
  });

  it('filtra por shape — o eixo usado para escolher um bloco pelo dado', () => {
    const { blocks } = listCatalog({ shape: 'scalar', includeSchemas: true });
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect((b.dataContract as { shape?: string } | undefined)?.shape).toBe('scalar');
    }
  });

  it('filtra por kind', () => {
    const { blocks } = listCatalog({ kind: 'chart', includeSchemas: true });
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) expect(b.kind).toBe('chart');
  });

  it('includeSchemas=false remove os JSON Schemas mas preserva o shape', () => {
    const full = listCatalog({ includeSchemas: true });
    const light = listCatalog({ includeSchemas: false });

    expect(light.total).toBe(full.total);
    for (const b of light.blocks) {
      expect(b.propsSchema).toBeUndefined();
      const contract = b.dataContract as Record<string, unknown> | undefined;
      if (contract) {
        expect(Object.keys(contract)).toEqual(['shape']);
      }
    }
    // E a economia é real: é esse o motivo do parâmetro existir.
    expect(JSON.stringify(light).length).toBeLessThan(JSON.stringify(full).length / 2);
  });
});

describe('validateCatalogBlock', () => {
  it('tipo inexistente: aponta vizinhos para a correção de grafia', () => {
    const result = validateCatalogBlock({ catalogType: 'bar-chart' });

    expect(result.valid).toBe(false);
    expect(result.issues[0].scope).toBe('catalogType');
    expect(result.issues[0].hint).toContain('bar_chart');
  });

  it('props fora do propsSchema viram um problema por caminho', () => {
    const result = validateCatalogBlock({
      catalogType: 'bar_chart',
      props: { orientation: 'diagonal', stacked: 'sim' },
    });

    expect(result.valid).toBe(false);
    const paths = result.issues.map((i) => i.path);
    expect(paths).toContain('/orientation');
    expect(paths).toContain('/stacked');
    for (const issue of result.issues) expect(issue.scope).toBe('props');
  });

  it('prop de lista recebendo string é rejeitada (o defeito do playground)', () => {
    const result = validateCatalogBlock({
      catalogType: 'bar_chart',
      props: { seriesColors: 'chart-2' },
    });

    expect(result.valid).toBe(false);
    expect(result.issues[0].path).toBe('/seriesColors');
    expect(result.issues[0].message).toMatch(/array/);
  });

  it('dado no shape errado: a dica mostra o formato esperado', () => {
    const result = validateCatalogBlock({
      catalogType: 'bar_chart',
      data: { points: [{ x: 'Jan', y: 1 }] },
    });

    expect(result.valid).toBe(false);
    expect(result.shape).toBe('series');
    expect(result.issues[0].hint).toContain('Formato esperado');
    expect(result.issues[0].hint).toContain('"x"');
  });

  it('bloco narrativo recusa `data` explicando o porquê', () => {
    const result = validateCatalogBlock({ catalogType: 'rich_text', data: [] });

    expect(result.valid).toBe(false);
    expect(result.shape).toBeNull();
    expect(result.issues[0].message).toMatch(/narrativo/);
  });

  it('tipo + props + dado corretos passam', () => {
    const result = validateCatalogBlock({
      catalogType: 'bar_chart',
      props: { orientation: 'horizontal', stacked: false, seriesColors: ['chart-2'] },
      data: [
        { x: 'Jan', y: 120 },
        { x: 'Fev', y: 90 },
      ],
    });

    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
