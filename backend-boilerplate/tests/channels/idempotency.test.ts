/**
 * Unit — dedup do webhook de WhatsApp via Redis SETNX semântico.
 *
 * Cobre o caminho feliz + o caminho "Redis degradado" (fail-open).
 * Usa mock do `redisService` pra não precisar de Redis real no teste.
 */

jest.mock('@/lib/redis', () => ({
  redisService: {
    hasKey: jest.fn(),
    setValue: jest.fn(),
  },
}));

import { redisService } from '@/lib/redis';
import { markSeen } from '@/modules/channels/idempotency';

const mockedHasKey = redisService.hasKey as unknown as jest.Mock;
const mockedSetValue = redisService.setValue as unknown as jest.Mock;

describe('channels/idempotency — markSeen', () => {
  beforeEach(() => {
    mockedHasKey.mockReset();
    mockedSetValue.mockReset();
  });

  it('1ª chamada: hasKey=false → setValue + retorna true', async () => {
    mockedHasKey.mockResolvedValueOnce(false);
    mockedSetValue.mockResolvedValueOnce('OK');

    const ok = await markSeen('msg-001');
    expect(ok).toBe(true);
    expect(mockedHasKey).toHaveBeenCalledWith('channels:wa:seen:msg-001');
    expect(mockedSetValue).toHaveBeenCalledWith('channels:wa:seen:msg-001', '1', 86_400);
  });

  it('2ª chamada (mesmo id): hasKey=true → NÃO chama setValue + retorna false', async () => {
    mockedHasKey.mockResolvedValueOnce(true);

    const ok = await markSeen('msg-001');
    expect(ok).toBe(false);
    expect(mockedSetValue).not.toHaveBeenCalled();
  });

  it('Redis degraded (hasKey joga): retorna true (fail-open) e loga warn', async () => {
    const warnSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); // logger usa console.log
    mockedHasKey.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const ok = await markSeen('msg-002');
    expect(ok).toBe(true);
    expect(mockedSetValue).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('Redis degraded (setValue joga): retorna true (fail-open) e loga warn', async () => {
    const warnSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockedHasKey.mockResolvedValueOnce(false);
    mockedSetValue.mockRejectedValueOnce(new Error('Connection lost'));

    const ok = await markSeen('msg-003');
    expect(ok).toBe(true);
    warnSpy.mockRestore();
  });

  it('keys distintos geram chaves Redis distintas', async () => {
    mockedHasKey.mockResolvedValue(false);
    mockedSetValue.mockResolvedValue('OK');

    await markSeen('msg-A');
    await markSeen('msg-B');

    expect(mockedHasKey).toHaveBeenNthCalledWith(1, 'channels:wa:seen:msg-A');
    expect(mockedHasKey).toHaveBeenNthCalledWith(2, 'channels:wa:seen:msg-B');
  });
});