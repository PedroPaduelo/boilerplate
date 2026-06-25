/**
 * Integração leve — POST /webhooks/evolution.
 *
 * Monta um Fastify só com a rota do webhook e mocka as dependências
 * pesadas (env helper, idempotência, conversation-link, agent service,
 * handler). O `payload.ts` (normalizador) é REAL — queremos exercitar
 * a extração de texto de verdade.
 *
 * Casos:
 *   - payload `conversation` válido → 200, conversa criada, Message USER
 *     persistida, handler disparado (setImmediate);
 *   - fromMe=true → 200 ignored, NADA persistido;
 *   - imageMessage → 200 ignored;
 *   - messageId repetido (markSeen=false) → 200 dedup;
 *   - sem env (isEvolutionEnabled=false) → 503;
 *   - secret errado → 401.
 */

// ---- mocks (declarados ANTES dos imports do SUT) ----------------------------
const isEvolutionEnabledMock = jest.fn(() => true);
const envMock: { CHANNELS_WEBHOOK_SECRET?: string } = {};
jest.mock('@/lib/env', () => ({
  get env() {
    return envMock;
  },
  isEvolutionEnabled: () => isEvolutionEnabledMock(),
}));

const markSeenMock = jest.fn();
jest.mock('@/modules/channels/idempotency', () => ({
  markSeen: (...a: unknown[]) => markSeenMock(...a),
}));

const getOrCreateMock = jest.fn();
jest.mock('@/modules/channels/conversation-link', () => ({
  getOrCreateWhatsappConversation: (...a: unknown[]) => getOrCreateMock(...a),
}));

const addMessageMock = jest.fn();
jest.mock('@/modules/agent/services/conversation', () => ({
  addMessage: (...a: unknown[]) => addMessageMock(...a),
}));

const processWhatsappMessageMock = jest.fn();
jest.mock('@/modules/channels/handler', () => ({
  processWhatsappMessage: (...a: unknown[]) => processWhatsappMessageMock(...a),
}));

import Fastify, { type FastifyInstance } from 'fastify';
import { webhookEvolutionRoute } from '@/modules/channels/routes/webhook-evolution';

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    event: 'MESSAGES_UPSERT',
    instance: 'palmas',
    data: {
      key: { remoteJid: '5562999999999@s.whatsapp.net', fromMe: false, id: 'msg-1' },
      pushName: 'Maria',
      message: { conversation: 'oi agente' },
      messageType: 'conversation',
      ...overrides,
    },
  };
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  await webhookEvolutionRoute(app);
  await app.ready();
  return app;
}

describe('POST /webhooks/evolution', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    isEvolutionEnabledMock.mockReturnValue(true);
    delete envMock.CHANNELS_WEBHOOK_SECRET;
    markSeenMock.mockReset().mockResolvedValue(true);
    getOrCreateMock
      .mockReset()
      .mockResolvedValue({ id: '1700000000000-5562999999999', userId: 'wa-sys', isNew: true });
    addMessageMock.mockReset().mockResolvedValue({ id: 'chatmsg-1' });
    processWhatsappMessageMock.mockReset().mockResolvedValue(undefined);
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('payload conversation válido → 200, conversa criada, Message USER, handler disparado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      payload: validPayload(),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.conversationId).toBe('1700000000000-5562999999999');
    expect(body.messageId).toBe('chatmsg-1');

    expect(getOrCreateMock).toHaveBeenCalledWith('5562999999999');
    expect(addMessageMock).toHaveBeenCalledWith('1700000000000-5562999999999', {
      role: 'user',
      content: 'oi agente',
    });
    // handler é fire-and-forget (setImmediate) — espera o tick
    await new Promise((r) => setImmediate(r));
    expect(processWhatsappMessageMock).toHaveBeenCalledTimes(1);
    const handlerArg = processWhatsappMessageMock.mock.calls[0][0];
    expect(handlerArg).toMatchObject({
      conversationId: '1700000000000-5562999999999',
      phoneNumber: '5562999999999',
      text: 'oi agente',
      messageId: 'msg-1',
      pushName: 'Maria',
    });
  });

  it('fromMe=true → 200 ignored, NADA persistido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      payload: validPayload({
        key: { remoteJid: '5562999999999@s.whatsapp.net', fromMe: true, id: 'msg-self' },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ignored).toBe('not_text_or_fromMe');
    expect(getOrCreateMock).not.toHaveBeenCalled();
    expect(addMessageMock).not.toHaveBeenCalled();
    expect(processWhatsappMessageMock).not.toHaveBeenCalled();
  });

  it('imageMessage → 200 ignored', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      payload: validPayload({
        messageType: 'imageMessage',
        message: { imageMessage: { caption: 'foto' } },
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ignored).toBe('not_text_or_fromMe');
    expect(addMessageMock).not.toHaveBeenCalled();
  });

  it('messageId repetido (markSeen=false) → 200 dedup, NADA persistido', async () => {
    markSeenMock.mockResolvedValueOnce(false);
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      payload: validPayload(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().dedup).toBe(true);
    expect(getOrCreateMock).not.toHaveBeenCalled();
    expect(addMessageMock).not.toHaveBeenCalled();
    expect(processWhatsappMessageMock).not.toHaveBeenCalled();
  });

  it('sem env (isEvolutionEnabled=false) → 503', async () => {
    isEvolutionEnabledMock.mockReturnValue(false);
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      payload: validPayload(),
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().code).toBe('channel_disabled');
    expect(markSeenMock).not.toHaveBeenCalled();
  });

  it('secret setado + header errado → 401', async () => {
    envMock.CHANNELS_WEBHOOK_SECRET = 'top-secret';
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      headers: { 'x-channel-secret': 'wrong' },
      payload: validPayload(),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('invalid_secret');
  });

  it('secret setado + header correto → 200', async () => {
    envMock.CHANNELS_WEBHOOK_SECRET = 'top-secret';
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      headers: { 'x-channel-secret': 'top-secret' },
      payload: validPayload(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('payload inválido (sem event) → 200 ignored (não 500)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/evolution',
      payload: { foo: 'bar' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ignored).toBe('not_text_or_fromMe');
  });
});