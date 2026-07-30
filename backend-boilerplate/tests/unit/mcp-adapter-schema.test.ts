/**
 * O SCHEMA que o agente enxerga de cada ferramenta.
 *
 * O bug: o adapter ignorava o `inputSchema` da tool e anunciava TODAS elas como
 * um objeto sem campo nenhum (`z.object({}).passthrough()`). O modelo não tinha
 * como saber que `run_query` recebe `sql`/`connectionId` — sobrava a descrição
 * em prosa, e ele adivinhava a forma. Na trilha real isso apareceu como
 * `run_query` chamada com `{}` quatro vezes seguidas, campos com nome errado e
 * arrays empacotados.
 *
 * Um schema vazio não quebra teste nenhum e não aparece em log: só sai caro em
 * passos perdidos no meio da conversa. Por isso ele é verificado aqui.
 */
import { buildMcpToolsForAgent } from '@/modules/agent/tools/mcp-adapter';
import type { ActorContext } from '@/lib/rbac';

const ACTOR: ActorContext = { userId: 'u1', role: 'ADMIN', departmentIds: [] };

/** O JSON Schema que vai para o modelo (o SDK guarda em `.jsonSchema`). */
function schemaOf(tool: unknown): Record<string, unknown> {
  const t = tool as { inputSchema?: { jsonSchema?: unknown } };
  return (t.inputSchema?.jsonSchema ?? t.inputSchema ?? {}) as Record<string, unknown>;
}

describe('mcp-adapter — schema entregue ao modelo', () => {
  const tools = buildMcpToolsForAgent(ACTOR);

  it('NENHUMA ferramenta é anunciada sem campos', () => {
    const vazias = Object.entries(tools)
      .filter(([, tool]) => {
        const props = schemaOf(tool).properties as Record<string, unknown> | undefined;
        return !props || Object.keys(props).length === 0;
      })
      .map(([nome]) => nome);

    expect(vazias).toEqual([]);
  });

  it('`run_query` declara `sql` e `connectionId` como obrigatórios', () => {
    const schema = schemaOf(tools.run_query);
    const props = schema.properties as Record<string, { type?: string }>;

    expect(schema.required).toEqual(expect.arrayContaining(['connectionId', 'sql']));
    expect(props.sql?.type).toBe('string');
    expect(props.maxRows?.type).toBe('integer');
  });

  it('todo schema tem `type: object` — a Anthropic recusa a tool sem isso', () => {
    // Foi este detalhe que motivou o schema vazio original: sem `type`, a API
    // rejeita a ferramenta e o chat inteiro para de funcionar.
    for (const [nome, tool] of Object.entries(tools)) {
      expect({ nome, type: schemaOf(tool).type }).toEqual({ nome, type: 'object' });
    }
  });

  it('preserva as descrições dos campos (é o que ensina o formato ao modelo)', () => {
    const props = schemaOf(tools.create_chart).properties as Record<
      string,
      { description?: string }
    >;
    const comDescricao = Object.values(props).filter((p) => p?.description);

    expect(comDescricao.length).toBeGreaterThan(0);
  });
});
