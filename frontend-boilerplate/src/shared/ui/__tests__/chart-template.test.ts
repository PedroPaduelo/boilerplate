/**
 * Regressão do CONTRATO COMUM de texto: Markdown + `{{variavel}}` a partir dos
 * dados do bloco.
 *
 * O que este arquivo trava:
 * 1. VOCABULÁRIO ÚNICO — `{{total}}`, `{{maximo}}`, `{{rotuloMaximo}}` e cia.
 *    significam a MESMA coisa em qualquer shape (série, categórico, escalar,
 *    tabela). Sem isso, dois cards do mesmo painel divergem.
 * 2. FALHA VISÍVEL — variável inexistente NÃO some: fica no texto e é
 *    reportada, para quem configura o bloco ver o campo errado na hora.
 * 3. SEM XSS — o markdown dos campos passa pelo sanitizador.
 */
import { describe, expect, it } from 'vitest';
import {
  buildChartScope,
  hasVariables,
  interpolate,
  interpolateText,
  readPath,
} from '../charts/chart-template';
import { chartPlainText, chartTextHtml } from '../charts/chart-text-html';

const SERIES = [
  { x: 'Jan', y: 10, series: 'Receita' },
  { x: 'Fev', y: 40, series: 'Receita' },
  { x: 'Mar', y: 25, series: 'Receita' },
];

const CATEGORICAL = [
  { label: 'Norte', value: 40 },
  { label: 'Sul', value: 60 },
];

describe('escopo derivado dos dados', () => {
  it('deriva o mesmo vocabulário para série e para categórico', () => {
    const series = buildChartScope(SERIES);
    expect(series.total).toBe(75);
    expect(series.maximo).toBe(40);
    expect(series.rotuloMaximo).toBe('Fev');
    expect(series.minimo).toBe(10);
    expect(series.contagem).toBe(3);
    expect(series.series).toBe('Receita');

    const categorical = buildChartScope(CATEGORICAL);
    expect(categorical.total).toBe(100);
    expect(categorical.rotuloMaximo).toBe('Sul');
    expect(categorical.maxLabel).toBe('Sul');
  });

  it('expõe o escalar como valor e total', () => {
    const scope = buildChartScope({ value: 1234, unit: 'BRL', label: 'Arrecadação' });
    expect(scope.valor).toBe(1234);
    expect(scope.total).toBe(1234);
    expect(scope.unidade).toBe('BRL');
    expect(scope.label).toBe('Arrecadação');
  });

  it('conta as linhas de uma tabela e mantém o acesso por caminho', () => {
    const scope = buildChartScope({
      columns: [{ key: 'municipio', label: 'Município' }],
      rows: [{ municipio: 'Recife', value: 3 }],
    });
    expect(scope.contagem).toBe(1);
    expect(readPath(scope, 'linhas.0.municipio')).toBe('Recife');
  });

  it('deixa o bloco sobrescrever o que só ele sabe', () => {
    const scope = buildChartScope(CATEGORICAL, { total: 'cem por cento' });
    expect(scope.total).toBe('cem por cento');
  });
});

describe('interpolação', () => {
  it('substitui variáveis e formata números em PT-BR', () => {
    const scope = buildChartScope(CATEGORICAL);
    expect(interpolateText('Total: {{total}}', scope)).toBe('Total: 100');
    expect(interpolateText('Maior: {{rotuloMaximo}}', scope)).toBe('Maior: Sul');
  });

  it('aplica o formatador pedido no pipe', () => {
    const scope = buildChartScope({ value: 2609946157 });
    expect(interpolateText('{{valor|compactBRL}}', scope)).toContain('bi');
    // `Intl` separa com espaço RÍGIDO — comparar com espaço comum falharia.
    expect(interpolateText('{{valor|compactNumber}}', scope)).toMatch(/^2,61\s?bi$/);
  });

  it('não formata número pequeno sem pipe — ano continua ano', () => {
    expect(interpolateText('{{ano}}', { ano: 2026 })).toBe('2026');
    expect(interpolateText('{{total}}', { total: 2609946157 })).toBe('2.609.946.157');
  });

  it('preserva e reporta a variável que não existe — nunca some em silêncio', () => {
    const result = interpolate('Olá {{naoExiste}}', buildChartScope(SERIES));
    expect(result.text).toBe('Olá {{naoExiste}}');
    expect(result.missing).toEqual(['naoExiste']);
  });

  it('reconhece quando há algo a interpolar', () => {
    expect(hasVariables('Sem variável')).toBe(false);
    expect(hasVariables('Com {{total}}')).toBe(true);
  });
});

describe('markdown dos campos de texto', () => {
  it('renderiza ênfase inline e interpola no mesmo passe', () => {
    const html = chartTextHtml('**{{total}}** processos', buildChartScope(CATEGORICAL));
    expect(html).toBe('<strong>100</strong> processos');
  });

  it('marca visualmente a variável órfã', () => {
    const html = chartTextHtml('{{fantasma}}', {});
    expect(html).toContain('chart-md__missing');
  });

  it('não deixa passar script nem handler inline', () => {
    const html = chartTextHtml('<script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
  });

  it('devolve texto puro para onde HTML não entra (aria-label, SVG)', () => {
    const plain = chartPlainText('**Total** de [processos](http://x): {{total}}', {
      total: 12,
    });
    expect(plain).toBe('Total de processos: 12');
  });
});
