/**
 * Unit — handler do canal WhatsApp (`processWhatsappMessage`).
 *
 * Mocka TUDO ao redor (runAgent, services de conversa, evolutionClient,
 * prisma, system user, provider) e valida a orquestração:
 *   1. truncamento da resposta longa (>4000 → 4000 + " (continua...)")
 *      tanto no `addMessage` quanto no `sendText`;
 *   2. resposta vazia → "(sem resposta)";
 *   3. `sendText` lançando exceção → handler NÃO propaga (resiliência);
 *   4. identidade do actor: `getWhatsappSystemUserId` é resolvido (role
 *      ADMIN é constante) e o agente roda em nome do WhatsApp System user;
 *   5. `runAgent` lançando → persiste msg de erro, NÃO chama sendText.
 *
 * NOTA sobre o "actor passado pra runAgent" (Caso 4 do briefing): a
 * assinatura REAL de `runAgent` (src/modules/agent/agent/loop.ts) NÃO
 * tem parâmetro `actor` — só `{ model, tools, systemPrompt, convo, ... }`.
 * Então não há como asserir `runAgent` recebeu o actor. Em vez disso
 * validamos que o handler RESOLVE a identidade correta via
 * `getWhatsappSystemUserId` (mock) — provando que o agente representa o
 * WhatsApp System user. Tools={} é verificado no payload do runAgent.
 */

// --- mocks (antes dos imports do SUT) ---------------------------------------
const runAgentMock = jest.fn();
jest.mock('@/modules/agent/agent/loop', () => ({
  runAgent: (...a: unknown[]) => runAgentMock(...a),
}));

const loadHistoryMock = jest.fn();
const addMessageMock = jest.fn();
jest.mock('@/modules/agent/services/conversation', () => ({
  loadConversationHistory: (...a: unknown[]) => loadHistoryMock(...a),
  addMessage: (...a: unknown[]) => addMessageMock(...a),
}));

const providerFn = jest.fn(() => 'mock-model');
jest.mock('@/modules/agent/provider/anthropic', () => ({
  createAnthropicWithExtras: jest.fn(() => providerFn),
}));

const sendTextMock = jest.fn();
jest.mock('@/modules/channels/evolution-client', () => ({
  evolutionClient: { sendText: (...a: unknown[]) => sendTextMock(...a) },
}));

const conversationUpdateMock = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: { update: (...a: unknown[]) => conversationUpdateMock(...a) },
  },
}));

const getSystemUserIdMock = jest.fn();
jest.mock('@/lib/whatsapp-system', () => ({
  getWhatsappSystemUserId: (...a: unknown[]) => getSystemUserIdMock(...a),
  WHATSAPP_SYSTEM_USER_EMAIL: 'whatsapp-system@platform.internal',
}));

// env: garante ANTHROPIC_API_KEY setado pro caminho principal
jest.mock('@/lib/env', () => ({
  env: {
    ANTHROPIC_API_KEY: 'sk-test',
    AI_BASE_URL: '',
    AI_MODEL: 'claude-test',
    WEB_APP_URL: 'https://fe.test',
  },
}));

// Tools do MCP + skills: o handler agora dá tools reais ao agente. Mockamos o
// adapter/skills para isolar a orquestração do handler (não precisamos da
// árvore inteira de tools/services aqui — isso é coberto pelo mcp-list-share.test).
const buildMcpToolsMock = jest.fn((..._a: unknown[]) => ({
  list_dashboards: { __tool: 'list_dashboards' },
  list_charts: { __tool: 'list_charts' },
  create_dashboard_share_link: { __tool: 'create_dashboard_share_link' },
}));
jest.mock('@/modules/agent/tools/mcp-adapter', () => ({
  buildMcpToolsForAgent: (...a: unknown[]) => buildMcpToolsMock(...a),
}));

const loadAllSkillsMock = jest.fn(async (..._a: unknown[]) => [] as unknown[]);
jest.mock('@/modules/agent/skills/index', () => ({
  loadAllSkills: (...a: unknown[]) => loadAllSkillsMock(...a),
  renderSkillsIndex: () => '',
  createActivateSkillTool: () => ({ __tool: 'activate_skill' }),
}));

import { processWhatsappMessage } from '@/modules/channels/handler';

const SYSTEM_USER_ID = 'wa-system-user-id';

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    conversationId: 'conv-1',
    userId: SYSTEM_USER_ID,
    phoneNumber: '5562999999999',
    text: 'oi agente',
    messageId: 'inbound-1',
    pushName: 'Maria',
    ...overrides,
  };
}

describe('channels/handler — processWhatsappMessage', () => {
  beforeEach(() => {
    runAgentMock.mockReset();
    loadHistoryMock.mockReset().mockResolvedValue([{ role: 'user', content: 'oi agente' }]);
    addMessageMock.mockReset().mockResolvedValue({ id: 'assistant-msg-1' });
    sendTextMock.mockReset().mockResolvedValue({ key: { id: 'wamid.1' } });
    conversationUpdateMock.mockReset().mockResolvedValue({});
    getSystemUserIdMock.mockReset().mockResolvedValue(SYSTEM_USER_ID);
    providerFn.mockClear();
    buildMcpToolsMock.mockClear();
    loadAllSkillsMock.mockClear();
  });

  it('Caso 1: resposta longa (5000 chars) → trunca a 4000 + " (continua...)" no addMessage e sendText', async () => {
    const longText = 'a'.repeat(5000);
    runAgentMock.mockResolvedValueOnce({ text: longText, usage: { inputTokens: 10, outputTokens: 20 } });

    await processWhatsappMessage(baseInput());

    const expected = 'a'.repeat(4000) + ' (continua...)';
    // addMessage(conversationId, { role: 'assistant', content, ... })
    expect(addMessageMock).toHaveBeenCalledWith('conv-1', expect.objectContaining({
      role: 'assistant',
      content: expected,
    }));
    expect(sendTextMock).toHaveBeenCalledWith({ number: '5562999999999', text: expected });
  });

  it('Caso 2: resposta vazia → "(sem resposta)"', async () => {
    runAgentMock.mockResolvedValueOnce({ text: '' });

    await processWhatsappMessage(baseInput());

    expect(addMessageMock).toHaveBeenCalledWith('conv-1', expect.objectContaining({
      content: '(sem resposta)',
    }));
    expect(sendTextMock).toHaveBeenCalledWith({ number: '5562999999999', text: '(sem resposta)' });
  });

  it('Caso 3: sendText lança exceção → handler NÃO propaga', async () => {
    runAgentMock.mockResolvedValueOnce({ text: 'resposta normal' });
    sendTextMock.mockRejectedValueOnce(new Error('boom'));

    // não deve rejeitar
    await expect(processWhatsappMessage(baseInput())).resolves.toBeUndefined();
    // a mensagem do assistente foi persistida ANTES do sendText
    expect(addMessageMock).toHaveBeenCalledWith('conv-1', expect.objectContaining({
      content: 'resposta normal',
    }));
  });

  it('Caso 4: actor resolvido e runAgent recebe tools REAIS do MCP + activate_skill (maxSteps=15)', async () => {
    runAgentMock.mockResolvedValueOnce({ text: 'ok' });

    await processWhatsappMessage(baseInput());

    expect(getSystemUserIdMock).toHaveBeenCalled();
    // o adapter foi chamado com o actor do WhatsApp System (role ADMIN)
    expect(buildMcpToolsMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: SYSTEM_USER_ID, role: 'ADMIN' }),
    );
    // runAgent recebeu as tools do MCP + a tool activate_skill, e o systemPrompt
    const runArg = runAgentMock.mock.calls[0][0];
    expect(runArg.tools).toEqual(
      expect.objectContaining({
        list_dashboards: expect.anything(),
        list_charts: expect.anything(),
        create_dashboard_share_link: expect.anything(),
        activate_skill: expect.anything(),
      }),
    );
    expect(typeof runArg.systemPrompt).toBe('string');
    expect(runArg.maxSteps).toBe(15);
  });

  it('Caso 5: runAgent lança → persiste msg de erro, NÃO chama sendText', async () => {
    runAgentMock.mockRejectedValueOnce(new Error('LLM timeout'));

    await expect(processWhatsappMessage(baseInput())).resolves.toBeUndefined();

    expect(addMessageMock).toHaveBeenCalledWith('conv-1', expect.objectContaining({
      role: 'assistant',
      content: expect.stringContaining('erro'),
    }));
    expect(sendTextMock).not.toHaveBeenCalled();
  });

  it('atualiza metadata da conversa com rastro do último reply', async () => {
    runAgentMock.mockResolvedValueOnce({ text: 'resposta' });

    await processWhatsappMessage(baseInput());

    expect(conversationUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            source: 'whatsapp',
            phoneNumber: '5562999999999',
            lastInboundMessageId: 'inbound-1',
            lastAssistantMessageId: 'assistant-msg-1',
            pushName: 'Maria',
          }),
        }),
      }),
    );
  });

  it('texto exatamente em 4000 chars NÃO é truncado', async () => {
    const exact = 'b'.repeat(4000);
    runAgentMock.mockResolvedValueOnce({ text: exact });

    await processWhatsappMessage(baseInput());

    expect(sendTextMock).toHaveBeenCalledWith({ number: '5562999999999', text: exact });
  });

  it('sendText retornando { key: null } NÃO quebra o handler (loga warn)', async () => {
    runAgentMock.mockResolvedValueOnce({ text: 'resposta' });
    sendTextMock.mockResolvedValueOnce({ key: null });

    await expect(processWhatsappMessage(baseInput())).resolves.toBeUndefined();
    expect(sendTextMock).toHaveBeenCalled();
  });
});