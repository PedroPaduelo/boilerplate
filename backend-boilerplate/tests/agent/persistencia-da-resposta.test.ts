/**
 * A RESPOSTA NÃO PODE SE PERDER NA GRAVAÇÃO.
 *
 * Relato de produção: o agente terminava de responder e a resposta sumia da
 * tela — sobrava a pergunta do usuário sozinha. O fim do turno faz a tela
 * recarregar o histórico; se a resposta não chegou ao banco, o que volta é uma
 * conversa em que ninguém respondeu.
 *
 * E a gravação tinha como falhar por um motivo que não é culpa da resposta:
 * `toolData` carrega o resultado das ferramentas e os gráficos — dados vindos
 * do banco do CLIENTE. Um `\u0000` no meio de um texto consultado é recusado
 * pelo JSONB do Postgres e derruba o INSERT inteiro, levando junto a análise
 * que o usuário acabou de ler.
 *
 * A regra sob teste: a evidência é sacrificável, a resposta não.
 */
import { persistirResposta } from '@/modules/agent/services/run-agent-background';

const RESPOSTA = {
  role: 'assistant' as const,
  content: 'Foram 128 notas em julho, 32% abaixo de junho.',
  toolData: { steps: [{ toolCallId: 't1', toolName: 'run_query' }] },
  tokensIn: 900,
  tokensOut: 120,
};

describe('persistência da resposta do turno', () => {
  it('grava a resposta com a trilha quando o banco aceita', async () => {
    const gravadas: unknown[] = [];

    await persistirResposta(RESPOSTA, {
      gravar: async (mensagem) => gravadas.push(mensagem),
    });

    expect(gravadas).toEqual([RESPOSTA]);
  });

  it('trilha recusada: a resposta é regravada SEM ela, em vez de se perder', async () => {
    const gravadas: any[] = [];
    const perdas: unknown[] = [];

    await persistirResposta(RESPOSTA, {
      gravar: async (mensagem) => {
        // Como o Postgres reage a `\u0000` dentro de um campo JSONB.
        if (mensagem.toolData !== undefined) {
          throw new Error('unsupported Unicode escape sequence');
        }
        gravadas.push(mensagem);
      },
      aoPerderTrilha: (err) => perdas.push(err),
    });

    expect(gravadas).toHaveLength(1);
    expect(gravadas[0]).toMatchObject({
      role: 'assistant',
      content: RESPOSTA.content,
      // Tokens continuam gravados: o rodapé de consumo não depende da trilha.
      tokensIn: 900,
      tokensOut: 120,
    });
    expect(gravadas[0].toolData).toBeUndefined();
    // A perda é registrada — some da tela, não do log de quem opera.
    expect(perdas).toHaveLength(1);
  });

  it('banco fora do ar propaga o erro em vez de fingir que gravou', async () => {
    // Sem trilha para descartar, não há segunda tentativa que ajude: quem chama
    // precisa saber que a mensagem não entrou (hoje, virar log de erro).
    await expect(
      persistirResposta(
        { role: 'assistant', content: 'oi' },
        {
          gravar: async () => {
            throw new Error('connection refused');
          },
        },
      ),
    ).rejects.toThrow('connection refused');
  });

  it('se nem sem a trilha o banco aceitar, o erro sobe', async () => {
    await expect(
      persistirResposta(RESPOSTA, {
        gravar: async () => {
          throw new Error('disk full');
        },
      }),
    ).rejects.toThrow('disk full');
  });
});
