/**
 * A separação entre a RESPOSTA e o BASTIDOR.
 *
 * O modelo escreve enquanto trabalha ("vou conferir o schema", "o contrato pede
 * x como string, vou ajustar a query"). Isso ia inteiro para o corpo da
 * mensagem: a primeira linha que o usuário lia era `DATE_TRUNC está vindo como
 * string ISO`, antes da análise que ele pediu.
 *
 * O corte é a FRONTEIRA DE FERRAMENTA, não o parágrafo. A distinção não é
 * teórica: a primeira versão cortava por parágrafo e comeu uma análise inteira
 * em produção — o modelo escreveu conclusão, gráfico e bullets em parágrafos
 * separados, e só o último ("posso cruzar as recebidas…") sobrou como resposta.
 * Os dois casos produzem `\n\n` no texto; só a posição da ferramenta distingue.
 */
import {
  separarRespostaDoBastidor,
  MINIMO_DE_RESPOSTA,
} from '../../src/modules/agent/services/run-agent-background';

const ANALISE =
  'As mensagens caíram **32% em julho** (18.412 contra 27.030 em junho), e a ' +
  'queda está concentrada em um único canal, o de atendimento.';

describe('separarRespostaDoBastidor', () => {
  it('tira o raciocínio anterior à ferramenta e o guarda como bastidor', () => {
    const trabalho = 'Vou conferir o schema antes de montar a consulta.\n\n';
    const texto = trabalho + ANALISE;

    const { resposta, bastidor } = separarRespostaDoBastidor(texto, [trabalho.length]);

    expect(resposta).toBe(ANALISE);
    expect(bastidor).toEqual(['Vou conferir o schema antes de montar a consulta.']);
  });

  /**
   * O caso que quebrou em produção: uma resposta bem escrita TEM parágrafos.
   * Nenhum deles pode ser confundido com bastidor.
   */
  it('parágrafos da resposta NÃO são bastidor', () => {
    const texto = [
      '## Mensagens por dia',
      '**As recebidas explodiram a partir de 23/07.**',
      '[[grafico:1]]',
      '- Antes de 23/07 o volume era estável e baixo.',
      'Posso cruzar as recebidas por contato para ver quem disparou o volume.',
    ].join('\n\n');

    // Sem ferramenta no meio da escrita: nada a separar.
    const { resposta, bastidor } = separarRespostaDoBastidor(texto, []);

    expect(resposta).toBe(texto);
    expect(bastidor).toEqual([]);
    expect(resposta).toContain('[[grafico:1]]');
    expect(resposta).toContain('explodiram');
  });

  it('turno sem ferramenta nenhuma fica intocado', () => {
    const { resposta, bastidor } = separarRespostaDoBastidor(ANALISE, []);

    expect(resposta).toBe(ANALISE);
    expect(bastidor).toEqual([]);
  });

  it('resposta curta demais devolve o texto inteiro (salvaguarda)', () => {
    const trabalho = 'Consultando os dados.\n\n';
    const texto = `${trabalho}Pronto!`;

    const { resposta, bastidor } = separarRespostaDoBastidor(texto, [trabalho.length]);

    expect(resposta).toContain('Consultando os dados.');
    expect(resposta).toContain('Pronto!');
    expect(bastidor).toEqual([]);
  });

  it('vale a ÚLTIMA fronteira quando houve várias ferramentas', () => {
    const a = 'Primeiro vou listar as conexões.\n\n';
    const b = 'Agora vou ler as colunas.\n\n';
    const texto = a + b + ANALISE;

    const { resposta, bastidor } = separarRespostaDoBastidor(texto, [
      a.length,
      a.length + b.length,
    ]);

    expect(resposta).toBe(ANALISE);
    expect(bastidor).toHaveLength(2);
  });

  it('o limiar é o tamanho da resposta, não a quantidade de blocos', () => {
    const trabalho = 'nota\n\n';
    const curto = 'a'.repeat(MINIMO_DE_RESPOSTA - 1);
    const longo = 'b'.repeat(MINIMO_DE_RESPOSTA);

    expect(separarRespostaDoBastidor(trabalho + curto, [trabalho.length]).bastidor).toEqual(
      [],
    );
    expect(separarRespostaDoBastidor(trabalho + longo, [trabalho.length]).bastidor).toEqual(
      ['nota'],
    );
  });

  it('fronteira inválida não quebra nem descarta texto', () => {
    expect(separarRespostaDoBastidor(ANALISE, [0]).resposta).toBe(ANALISE);
    expect(separarRespostaDoBastidor(ANALISE, [9999]).resposta).toBe(ANALISE);
    expect(separarRespostaDoBastidor('', [5])).toEqual({ resposta: '', bastidor: [] });
  });
});
