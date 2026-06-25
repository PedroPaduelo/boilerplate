/**
 * Unit — normalizador do payload MESSAGES_UPSERT da Evolution API v2.
 *
 * Cobre `extractTextMessage` (Zod + extração de texto + casos ignorados)
 * e o schema `evolutionUpsertSchema` (forma do envelope). Esses testes
 * validam que o webhook NÃO processa mídia, NÃO responde mensagem própria,
 * e tolera variações de payload (campos extras, pushName faltando, etc).
 */

import { evolutionUpsertSchema, extractTextMessage } from '@/modules/channels/payload';

const basePayload = {
  event: 'MESSAGES_UPSERT' as const,
  instance: 'palmas',
  data: {
    key: {
      remoteJid: '5562999999999@s.whatsapp.net',
      fromMe: false,
      id: '3EB0ABCD1234',
    },
    pushName: 'João da Silva',
    message: { conversation: 'oi, tudo bem?' },
    messageType: 'conversation',
  },
};

describe('channels/payload — extractTextMessage', () => {
  it('extrai texto de uma mensagem `conversation` válida', () => {
    const out = extractTextMessage(basePayload);
    expect(out).toEqual({
      messageId: '3EB0ABCD1234',
      phoneNumber: '5562999999999',
      pushName: 'João da Silva',
      text: 'oi, tudo bem?',
    });
  });

  it('extrai texto de uma mensagem `extendedTextMessage` válida', () => {
    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        messageType: 'extendedTextMessage',
        message: { extendedTextMessage: { text: 'Olá, preciso de ajuda' } },
      },
    };
    const out = extractTextMessage(payload);
    expect(out?.text).toBe('Olá, preciso de ajuda');
    expect(out?.phoneNumber).toBe('5562999999999');
  });

  it('IGNORA mensagem `fromMe=true` (eco da própria Evolution)', () => {
    const payload = {
      ...basePayload,
      data: { ...basePayload.data, key: { ...basePayload.data.key, fromMe: true } },
    };
    expect(extractTextMessage(payload)).toBeNull();
  });

  it('IGNORA tipo de mídia (imageMessage, audioMessage, ...)', () => {
    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        messageType: 'imageMessage',
        message: { imageMessage: { caption: 'olha essa foto' } },
      },
    };
    expect(extractTextMessage(payload)).toBeNull();
  });

  it('IGNORA payload sem texto após trim', () => {
    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        message: { conversation: '   \n  \t  ' },
        messageType: 'conversation',
      },
    };
    expect(extractTextMessage(payload)).toBeNull();
  });

  it('FALHA em payload fora do schema (evento diferente) → null', () => {
    const payload = { ...basePayload, event: 'MESSAGES_UPDATE' };
    expect(extractTextMessage(payload)).toBeNull();
  });

  it('FALHA quando falta `event` → null', () => {
    const { event: _event, ...rest } = basePayload;
    void _event;
    expect(extractTextMessage(rest)).toBeNull();
  });

  it('TOLERA pushName ausente (devolve null no campo)', () => {
    const payload = {
      ...basePayload,
      data: { ...basePayload.data },
    };
    delete (payload.data as Record<string, unknown>).pushName;
    const out = extractTextMessage(payload);
    expect(out?.pushName).toBeNull();
  });

  it('extrai phoneNumber só com dígitos (ignora domínio @s.whatsapp.net)', () => {
    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        key: { ...basePayload.data.key, remoteJid: '+55 62 99999-9999@s.whatsapp.net' },
      },
    };
    const out = extractTextMessage(payload);
    expect(out?.phoneNumber).toBe('5562999999999');
  });

  it('devolve null quando remoteJid não tem dígitos antes do @', () => {
    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        key: { ...basePayload.data.key, remoteJid: 'grupo-fake-uuid@g.us' },
      },
    };
    expect(extractTextMessage(payload)).toBeNull();
  });

  it('extendedTextMessage sem campo `text` → null', () => {
    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        messageType: 'extendedTextMessage',
        message: { extendedTextMessage: { contextInfo: {} } },
      },
    };
    expect(extractTextMessage(payload)).toBeNull();
  });
});

describe('channels/payload — evolutionUpsertSchema (forma do envelope)', () => {
  it('aceita o payload mínimo válido', () => {
    const r = evolutionUpsertSchema.safeParse(basePayload);
    expect(r.success).toBe(true);
  });

  it('aceita campos extras no `data` (zod não estrito)', () => {
    const payload = {
      ...basePayload,
      data: { ...basePayload.data, extraField: 'whatever' },
    };
    const r = evolutionUpsertSchema.safeParse(payload);
    expect(r.success).toBe(true);
  });

  it('rejeita evento diferente de MESSAGES_UPSERT', () => {
    const payload = { ...basePayload, event: 'CONNECTION_UPDATE' };
    const r = evolutionUpsertSchema.safeParse(payload);
    expect(r.success).toBe(false);
  });

  it('rejeita quando falta `data.key.fromMe`', () => {
    const payload = {
      ...basePayload,
      data: {
        ...basePayload.data,
        key: { remoteJid: 'x', id: 'y' },
      },
    };
    const r = evolutionUpsertSchema.safeParse(payload);
    expect(r.success).toBe(false);
  });
});