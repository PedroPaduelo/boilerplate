/**
 * A FRONTEIRA entre os blocos de texto do modelo.
 *
 * O sintoma que estes testes travam foi colhido de uma resposta real gravada no
 * banco: `…seus gráficos e dashboards.Assumi que "listi" = listar`. São duas
 * frases de momentos diferentes — uma escrita antes de chamar a ferramenta,
 * outra depois de ver o resultado — que a concatenação crua dos deltas emendou
 * sem nem um espaço no meio.
 *
 * A regra sob teste é só a da fronteira, e é pura: dado o texto acumulado, o
 * próximo delta e se houve ferramenta entre os dois, qual separador entra.
 * Nada aqui precisa de agente, socket, Redis ou banco.
 */
import { separadorDeBloco } from '@/modules/agent/services/run-agent-background';

describe('texto contínuo NÃO é tocado', () => {
  it('sem ferramenta no meio, a emenda é intencional (o modelo digitando)', () => {
    expect(separadorDeBloco('As mensagens caíram', ' 32%', false)).toBe('');
  });

  it('nem quando o texto anterior termina em ponto final', () => {
    // Sem ferramenta no meio, ponto final é só pontuação: o modelo continua a
    // escrever o mesmo parágrafo.
    expect(separadorDeBloco('Pronto.', ' Vamos ao resultado', false)).toBe('');
  });
});

describe('depois de uma ferramenta, começa parágrafo novo', () => {
  it('emenda que gerou o "dashboards.Assumi" ganha a quebra dupla', () => {
    expect(separadorDeBloco('…seus gráficos e dashboards.', 'Assumi que', true)).toBe('\n\n');
  });

  it('o resultado é um parágrafo separado, não uma frase grudada', () => {
    const antes = '…seus gráficos e dashboards.';
    const delta = 'Assumi que "listi" = listar';
    const texto = antes + separadorDeBloco(antes, delta, true) + delta;
    expect(texto).toBe('…seus gráficos e dashboards.\n\nAssumi que "listi" = listar');
    expect(texto).not.toContain('dashboards.Assumi');
  });
});

describe('devolve o mínimo necessário (sem empilhar linha em branco)', () => {
  it('primeiro bloco do turno não tem o que separar', () => {
    expect(separadorDeBloco('', 'A resposta começa aqui', true)).toBe('');
  });

  it('bloco anterior terminado em UMA quebra só precisa da segunda', () => {
    expect(separadorDeBloco('- item da lista\n', 'Conclusão', true)).toBe('\n');
  });

  it('bloco anterior já terminado em parágrafo não ganha nada', () => {
    expect(separadorDeBloco('Parágrafo fechado.\n\n', 'Novo parágrafo', true)).toBe('');
  });

  it('delta que já abre linha nova é respeitado como o modelo escreveu', () => {
    expect(separadorDeBloco('Texto anterior.', '\n\n## Título', true)).toBe('');
  });
});
