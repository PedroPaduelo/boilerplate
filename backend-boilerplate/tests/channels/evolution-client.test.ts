/**
 * Unit — EvolutionClient: HTTP client fino sobre a Evolution API.
 *
 * Cobre:
 *   1. URL/headers/body exatos em sucesso (POST /message/sendText/{instance}
 *      com headers apikey/Content-Type e body `{ number, text }`).
 *   2. Erro de rede (instance.post rejeita) → método NÃO propaga exceção,
 *      retorna `{ key: null }` e loga o erro.
 *   3. Erro 4xx/5xx da Evolution (AxiosError mockado) → mesmo fail-soft.
 *   4. Resposta da Evolution sem campo `key` → devolve `{ key: null }`.
 *   5. Quando as 3 envs NÃO estão setadas, o cliente é construído em modo
 *      "noop" e o sendText devolve `{ key: null }` SEM chamar axios.
 *
 * ISOLAMENTO: mockamos `@/lib/env` (em vez de mexer em `process.env`),
 * porque `src/lib/env.ts` roda `dotenv.config({ override: true })` no import
 * — ele RECARREGA o `.env` real (que tem EVOLUTION_* setados) e sobrescreve
 * qualquer `process.env` que o teste tentasse manipular. Mockar o módulo
 * de env dá controle total e determinístico dos valores por caso.
 *
 * Mockamos também `axios.create` para devolver uma instância com `post`
 * jest-spy (a chamada `axios.create({...}).post(...)` NÃO passa por
 * `axios.post` estático).
 */

const postMock = jest.fn();
const createMock = jest.fn().mockImplementation(() => ({ post: postMock }));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: (...args: unknown[]) => (createMock as (...a: unknown[]) => unknown)(...args),
    isAxiosError: (err: unknown) =>
      typeof err === 'object' &&
      err !== null &&
      (err as { isAxiosError?: boolean }).isAxiosError === true,
  },
  isAxiosError: (err: unknown) =>
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true,
}));

// Mock controlável do env — cada teste seta os valores via `mockEnv`.
const mockEnv: {
  EVOLUTION_API_URL?: string;
  EVOLUTION_INSTANCE?: string;
  EVOLUTION_APIKEY?: string;
} = {};
jest.mock('@/lib/env', () => ({
  get env() {
    return mockEnv;
  },
}));

import type { EvolutionClient as EvolutionClientType } from '@/modules/channels/evolution-client';

describe('channels/evolution-client — sendText', () => {
  let evolutionClient: EvolutionClientType;

  beforeEach(() => {
    postMock.mockReset();
    createMock.mockClear();
    mockEnv.EVOLUTION_API_URL = undefined;
    mockEnv.EVOLUTION_INSTANCE = undefined;
    mockEnv.EVOLUTION_APIKEY = undefined;
  });

  /** (Re)carrega o módulo cliente com o `mockEnv` corrente. */
  function loadClient(): EvolutionClientType {
    let client: EvolutionClientType;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@/modules/channels/evolution-client') as typeof import('@/modules/channels/evolution-client');
      client = mod.evolutionClient;
    });
    return client!;
  }

  it('POST com URL/headers/body EXATOS em sucesso → devolve { key: { id } }', async () => {
    mockEnv.EVOLUTION_API_URL = 'http://evo.local:8080';
    mockEnv.EVOLUTION_INSTANCE = 'palmas';
    mockEnv.EVOLUTION_APIKEY = 'my-secret-key';
    evolutionClient = loadClient();
    postMock.mockResolvedValueOnce({ data: { key: { id: 'wamid.123' } } });

    const result = await evolutionClient.sendText({ number: '5562999999999', text: 'oi' });

    expect(createMock).toHaveBeenCalledTimes(1);
    const config = createMock.mock.calls[0][0] as {
      baseURL?: string;
      headers?: Record<string, string>;
      timeout?: number;
    };
    expect(config.baseURL).toBe('http://evo.local:8080');
    expect(config.headers?.apikey).toBe('my-secret-key');
    expect(config.headers?.['Content-Type']).toBe('application/json');
    expect(config.timeout).toBe(10_000);

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, body] = postMock.mock.calls[0];
    expect(url).toBe('/message/sendText/palmas');
    expect(body).toEqual({ number: '5562999999999', text: 'oi' });
    expect(result).toEqual({ key: { id: 'wamid.123' } });
  });

  it('Erro de rede (instance.post rejeita) → { key: null } e NÃO propaga exceção', async () => {
    mockEnv.EVOLUTION_API_URL = 'http://evo.local:8080';
    mockEnv.EVOLUTION_INSTANCE = 'palmas';
    mockEnv.EVOLUTION_APIKEY = 'k';
    evolutionClient = loadClient();
    postMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await evolutionClient.sendText({ number: '5562999999999', text: 'oi' });
    expect(result).toEqual({ key: null });
  });

  it('Erro 4xx/5xx (AxiosError com response.status) → { key: null }', async () => {
    mockEnv.EVOLUTION_API_URL = 'http://evo.local:8080';
    mockEnv.EVOLUTION_INSTANCE = 'palmas';
    mockEnv.EVOLUTION_APIKEY = 'k';
    evolutionClient = loadClient();
    const axiosErr = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 500, data: { error: 'internal' } },
    });
    postMock.mockRejectedValueOnce(axiosErr);

    const result = await evolutionClient.sendText({ number: '5562999999999', text: 'oi' });
    expect(result).toEqual({ key: null });
  });

  it('Resposta da Evolution SEM campo `key` → { key: null }', async () => {
    mockEnv.EVOLUTION_API_URL = 'http://evo.local:8080';
    mockEnv.EVOLUTION_INSTANCE = 'palmas';
    mockEnv.EVOLUTION_APIKEY = 'k';
    evolutionClient = loadClient();
    postMock.mockResolvedValueOnce({ data: { status: 'PENDING', message: 'queued' } });

    const result = await evolutionClient.sendText({ number: '5562999999999', text: 'oi' });
    expect(result).toEqual({ key: null });
  });

  it('Sem EVOLUTION_API_URL → cliente noop, axios.create NÃO é chamado', async () => {
    // mockEnv já está vazio (beforeEach) → cliente noop.
    evolutionClient = loadClient();
    postMock.mockResolvedValueOnce({ data: { key: { id: 'should-not-be-called' } } });

    const result = await evolutionClient.sendText({ number: '5562999999999', text: 'oi' });
    expect(createMock).not.toHaveBeenCalled();
    expect(postMock).not.toHaveBeenCalled();
    expect(result).toEqual({ key: null });
  });

  it('Verifica que response.data.key.id string é preservado (caminho feliz)', async () => {
    mockEnv.EVOLUTION_API_URL = 'http://evo.local:8080';
    mockEnv.EVOLUTION_INSTANCE = 'palmas';
    mockEnv.EVOLUTION_APIKEY = 'k';
    evolutionClient = loadClient();
    postMock.mockResolvedValueOnce({ data: { key: { id: 'wamid.XYZ' } } });

    const result = await evolutionClient.sendText({ number: '5562999999999', text: 'oi' });
    expect(result.key?.id).toBe('wamid.XYZ');
  });

  it('Com env mas SEM instância → noop (não chama axios)', async () => {
    mockEnv.EVOLUTION_API_URL = 'http://evo.local:8080';
    mockEnv.EVOLUTION_APIKEY = 'k';
    // EVOLUTION_INSTANCE ausente
    evolutionClient = loadClient();
    postMock.mockResolvedValueOnce({ data: { key: { id: 'x' } } });

    const result = await evolutionClient.sendText({ number: '5562999999999', text: 'oi' });
    expect(postMock).not.toHaveBeenCalled();
    expect(result).toEqual({ key: null });
  });
});