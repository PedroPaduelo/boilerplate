/**
 * O agente roda no servidor: sem um aviso por socket, o que ele cria só
 * aparece na tela depois de um F5. Estes testes travam QUANDO o aviso sai —
 * avisar demais causa refetch à toa; avisar de menos deixa a tela velha.
 */
const sendToUser = jest.fn();

jest.mock('@/socket/manager/socket-manager', () => ({
  socketManager: { sendToUser: (...a: unknown[]) => sendToUser(...a) },
}));

import {
  notifyArtifactChange,
  ARTIFACT_CHANGED_EVENT,
} from '@/modules/agent/tools/notify-artifact-change';

const USER = 'user-1';
const payloadEnviado = () => sendToUser.mock.calls[0]?.[2];

beforeEach(() => sendToUser.mockReset());

describe('notifyArtifactChange', () => {
  it('avisa quando o agente cria um gráfico, com o id no payload', () => {
    notifyArtifactChange(USER, 'create_chart', { chartId: 'chart_1' });

    expect(sendToUser).toHaveBeenCalledTimes(1);
    expect(sendToUser.mock.calls[0][0]).toBe(USER);
    expect(sendToUser.mock.calls[0][1]).toBe(ARTIFACT_CHANGED_EVENT);
    expect(payloadEnviado()).toMatchObject({
      kind: 'chart',
      tool: 'create_chart',
      chartId: 'chart_1',
    });
  });

  it('classifica dashboard e chart em espécies diferentes (caches distintos)', () => {
    notifyArtifactChange(USER, 'publish_dashboard', { dashboardId: 'dash_1' });
    expect(payloadEnviado()).toMatchObject({ kind: 'dashboard', dashboardId: 'dash_1' });
  });

  it('avisa também no add_chart_to_dashboard (muda os dois lados)', () => {
    notifyArtifactChange(USER, 'add_chart_to_dashboard', { dashboardId: 'd1' });
    expect(sendToUser).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['list_connections'],
    ['run_query'],
    ['get_connection_schema'],
    ['preview_chart_data'],
    ['activate_skill'],
  ])('NÃO avisa em tool de leitura: %s', (tool) => {
    notifyArtifactChange(USER, tool, { ok: true });
    expect(sendToUser).not.toHaveBeenCalled();
  });

  it('NÃO avisa quando a tool falhou (nada mudou de fato)', () => {
    // O handler do MCP devolve `{ error }` em vez de lançar.
    notifyArtifactChange(USER, 'create_chart', { error: 'contract_violation' });
    expect(sendToUser).not.toHaveBeenCalled();
  });

  it('não deixa falha de socket derrubar a execução da tool', () => {
    sendToUser.mockImplementation(() => {
      throw new Error('socket caiu');
    });
    // O trabalho do agente já foi feito e persistido: o aviso é um extra.
    expect(() => notifyArtifactChange(USER, 'create_chart', { chartId: 'c' })).not.toThrow();
  });

  it('aguenta resultado sem id (não inventa campo)', () => {
    notifyArtifactChange(USER, 'delete_chart', { deleted: true });
    expect(payloadEnviado()).toEqual({ kind: 'chart', tool: 'delete_chart' });
  });
});
