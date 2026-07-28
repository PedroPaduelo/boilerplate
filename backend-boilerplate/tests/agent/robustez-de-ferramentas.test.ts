/**
 * As quatro falhas de ferramenta que o usuário viu na trilha — e que agora
 * não deveriam mais acontecer.
 *
 * Todas foram colhidas das conversas reais gravadas no banco, não imaginadas.
 * A escolha em cada caso foi a mesma: em vez de pedir ao modelo que acerte,
 * fazer o sistema aceitar o que ele naturalmente escreve, ou dar a ele a
 * informação que faltava para não precisar chutar.
 */
import { coerceProps } from '../../src/lib/catalog';
import { applyTransform } from '../../src/modules/data/transform';
import { resumirErrosDeContrato } from '../../src/modules/data/executor';

describe('robustez das ferramentas do agente', () => {
  /**
   * 9 de 15 falhas de um dia. O agente escreve `query`; o schema pedia `sql`.
   */
  describe('run_query aceita `query` como sinônimo de `sql`', () => {
    // O schema mora no módulo do MCP; importá-lo puxaria o servidor inteiro.
    // O contrato testável aqui é o comportamento do transform do Zod, exercido
    // pelo teste de integração do MCP (tests/mcp.test.ts). Aqui fica registrado
    // o caso que originou a mudança, para quem vier depois entender o porquê.
    it('está documentado em connections.ts (runQueryArgs)', () => {
      expect(true).toBe(true);
    });
  });

  /**
   * `{"area": "true"}` — erro de notação, não de intenção.
   */
  describe('create_chart tolera booleano escrito como texto', () => {
    it('converte "true"/"false" para booleano de verdade', () => {
      const props = coerceProps('line_chart', {
        area: 'true',
        smooth: 'false',
        palette: 'multi',
      }) as Record<string, unknown>;

      expect(props.area).toBe(true);
      expect(props.smooth).toBe(false);
      expect(props.palette).toBe('multi');
    });

    it('não muta o objeto de quem chamou', () => {
      const original = { area: 'true' };
      coerceProps('line_chart', original);
      expect(original.area).toBe('true');
    });

    it('tipo desconhecido passa intacto em vez de explodir', () => {
      const props = { qualquer: 'coisa' };
      expect(coerceProps('tipo_que_nao_existe', props)).toEqual(props);
    });
  });

  /**
   * Toda série temporal quebrava: `date_trunc` volta como Date, e o contrato
   * de `series` só aceita string ou número.
   */
  describe('data no eixo x vira rótulo que o contrato aceita', () => {
    const resultado = (rows: Record<string, unknown>[]) => ({
      columns: [{ name: 'x', dataTypeID: 1114 }, { name: 'y', dataTypeID: 23 }],
      rows,
      rowCount: rows.length,
      truncated: false,
      durationMs: 1,
    });

    it('data à meia-noite vira o DIA (YYYY-MM-DD)', () => {
      const saida = applyTransform(
        'series',
        resultado([{ x: new Date('2026-07-23T00:00:00.000Z'), y: 1214 }]),
        undefined,
      ) as { x: unknown; y: unknown }[];

      expect(saida[0]?.x).toBe('2026-07-23');
      expect(saida[0]?.y).toBe(1214);
    });

    it('data com hora mantém o ISO (que ordena como o tempo)', () => {
      const saida = applyTransform(
        'series',
        resultado([{ x: new Date('2026-07-23T14:30:00.000Z'), y: 7 }]),
        undefined,
      ) as { x: unknown }[];

      expect(saida[0]?.x).toBe('2026-07-23T14:30:00.000Z');
    });

    it('vale também para o rótulo de categoria', () => {
      const saida = applyTransform(
        'categorical',
        {
          columns: [{ name: 'label', dataTypeID: 1082 }],
          rows: [{ label: new Date('2026-01-05T00:00:00.000Z'), value: 3 }],
          rowCount: 1,
          truncated: false,
          durationMs: 1,
        },
        undefined,
      ) as { label: unknown }[];

      expect(saida[0]?.label).toBe('2026-01-05');
    });

    it('string e número seguem intocados', () => {
      const saida = applyTransform(
        'series',
        resultado([
          { x: 'Julho', y: 1 },
          { x: 2026, y: 2 },
        ]),
        undefined,
      ) as { x: unknown }[];

      expect(saida.map((p) => p.x)).toEqual(['Julho', 2026]);
    });
  });

  /**
   * O mesmo erro repetido uma vez por linha entupia o contexto do agente.
   */
  describe('erro de contrato é resumido, não repetido', () => {
    it('agrega o mesmo problema em muitos itens numa linha só', () => {
      const bruto = Array.from({ length: 30 }, (_, i) => `/${i}/x must be string,number`).join(
        '; ',
      );

      const resumo = resumirErrosDeContrato(bruto);

      expect(resumo).toBe('x must be string,number (em 30 itens)');
    });

    it('problemas diferentes continuam todos visíveis', () => {
      const resumo = resumirErrosDeContrato(
        '/0/x must be string,number; /1/y must be number; /2/x must be string,number',
      );

      expect(resumo).toContain('x must be string,number (em 2 itens)');
      expect(resumo).toContain('y must be number');
    });

    it('erro único fica como está', () => {
      expect(resumirErrosDeContrato('/0/x must be string')).toBe('/0/x must be string');
    });
  });
});
