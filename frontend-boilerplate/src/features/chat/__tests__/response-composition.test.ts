/**
 * A linguagem de composição é o que permite a resposta contar uma história:
 * o gráfico aparece NO PONTO em que o texto fala dele, não empilhado no fim.
 *
 * Os casos aqui são os que quebram na vida real: modelo erra o número da marca,
 * repete a mesma marca, esquece de ancorar, ou a marca chega pela metade no
 * meio do streaming. Nenhum deles pode sujar a tela nem sumir com um gráfico.
 */
import { describe, expect, it } from 'vitest';
import { comporResposta, temGraficoAncorado } from '../lib/response-composition';

describe('comporResposta', () => {
  it('intercala texto e gráfico no ponto da marca', () => {
    const { segmentos, graficosSoltos } = comporResposta(
      '**Caíram 32% em julho.**\n\n[[grafico:1]]\n\nO que chama atenção:\n- queda concentrada no dia 23',
      1,
    );

    expect(segmentos).toEqual([
      { tipo: 'texto', conteudo: '**Caíram 32% em julho.**' },
      { tipo: 'grafico', indice: 0 },
      {
        tipo: 'texto',
        conteudo: 'O que chama atenção:\n- queda concentrada no dia 23',
      },
    ]);
    expect(graficosSoltos).toEqual([]);
  });

  it('sem marca nenhuma, tudo se comporta como antes: texto e gráficos ao fim', () => {
    const { segmentos, graficosSoltos } = comporResposta('Resposta simples.', 2);

    expect(segmentos).toEqual([{ tipo: 'texto', conteudo: 'Resposta simples.' }]);
    // Progressivo: quem não usa a linguagem não é penalizado.
    expect(graficosSoltos).toEqual([0, 1]);
  });

  it('ancora alguns e manda o resto para o fim', () => {
    const { segmentos, graficosSoltos } = comporResposta(
      'Olha o volume:\n\n[[grafico:2]]\n\nE o resto do painel:',
      3,
    );

    expect(segmentos[1]).toEqual({ tipo: 'grafico', indice: 1 });
    expect(graficosSoltos).toEqual([0, 2]);
  });

  it('marca apontando para gráfico inexistente é removida, não vira lixo na tela', () => {
    const { segmentos } = comporResposta('Antes [[grafico:9]] depois', 2);

    const texto = segmentos.map((s) => (s.tipo === 'texto' ? s.conteudo : '')).join(' ');
    expect(texto).not.toContain('[[');
    expect(texto).not.toContain('grafico');
    expect(segmentos.every((s) => s.tipo === 'texto')).toBe(true);
  });

  it('a mesma marca repetida desenha o gráfico uma vez só', () => {
    const { segmentos } = comporResposta('[[grafico:1]] e de novo [[grafico:1]]', 1);

    expect(segmentos.filter((s) => s.tipo === 'grafico')).toHaveLength(1);
  });

  it('durante o streaming, marca pela metade fica escondida até fechar', () => {
    // O texto chega em pedaços: este é o instante em que a marca está no meio.
    const meio = comporResposta('Veja o volume:\n\n[[grafi', 1, true);
    expect(meio.segmentos).toEqual([{ tipo: 'texto', conteudo: 'Veja o volume:' }]);

    // Fechou: o gráfico entra no lugar certo.
    const fim = comporResposta('Veja o volume:\n\n[[grafico:1]]', 1, true);
    expect(fim.segmentos[1]).toEqual({ tipo: 'grafico', indice: 0 });
  });

  it('aceita as variações que o modelo escreve na prática', () => {
    for (const marca of ['[[grafico:1]]', '[[gráfico:1]]', '[[ grafico : 1 ]]']) {
      const { segmentos } = comporResposta(`a\n\n${marca}\n\nb`, 1);
      expect(segmentos[1]).toEqual({ tipo: 'grafico', indice: 0 });
    }
  });

  it('não deixa buraco de espaçamento entre dois gráficos seguidos', () => {
    const { segmentos } = comporResposta('[[grafico:1]]\n\n[[grafico:2]]', 2);

    // Nada de segmento de texto vazio entre eles.
    expect(segmentos).toEqual([
      { tipo: 'grafico', indice: 0 },
      { tipo: 'grafico', indice: 1 },
    ]);
  });

  it('temGraficoAncorado distingue resposta narrada de resposta com anexo', () => {
    expect(temGraficoAncorado(comporResposta('a [[grafico:1]] b', 1))).toBe(true);
    expect(temGraficoAncorado(comporResposta('a b', 1))).toBe(false);
  });
});
