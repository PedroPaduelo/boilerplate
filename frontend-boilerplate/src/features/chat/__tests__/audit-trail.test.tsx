/**
 * A trilha de auditoria na tela.
 *
 * O que estes testes travam é a PROMESSA do produto: a resposta do agente vem
 * acompanhada da prova. Se o SQL sumir, se a amostra truncada deixar de se
 * declarar, se um erro virar uma linha muda ou se apagar um dashboard parecer
 * igual a um SELECT, a auditoria deixou de existir mesmo com a tela "montando".
 *
 * Tudo é consultado por PAPEL ACESSÍVEL: as classes do DS são hashes do StyleX
 * e mudam a cada build.
 */
import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { AuditTrail } from '../components/audit-trail';
import type { AuditStep, ChatMessageTrail } from '../model';

const SQL = 'SELECT count(*) FROM notas WHERE ano = 2026';

const queryStep: AuditStep = {
  toolCallId: 't1',
  toolName: 'run_query',
  title: 'Executando consulta',
  target: 'notas',
  summary: '128 linhas',
  status: 'ok',
  durationMs: 340,
  sql: SQL,
  connectionName: 'teste · Postgres',
  rowCount: 128,
  preview: {
    columns: ['mes', 'total'],
    rows: [
      ['jan', 10],
      ['fev', 20],
    ],
    totalRows: 128,
  },
};

function trailOf(...steps: AuditStep[]): ChatMessageTrail {
  return { steps, artifacts: [] };
}

/** Abre a linha do passo (o `resultDetail` do DS só monta quando expandido). */
async function expandStep(name: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name }));
}

describe('AuditTrail', () => {
  it('sem passos e sem fase em andamento, não ocupa espaço na resposta', () => {
    renderWithProviders(<AuditTrail trail={trailOf()} />);

    expect(screen.queryByText(/Trilha de auditoria/)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a linha fechada já diz o quê, sobre o quê e quanto demorou', () => {
    renderWithProviders(<AuditTrail trail={trailOf(queryStep)} />);

    const row = screen.getByRole('button', { name: /Executando consulta/ });
    expect(row).toHaveAccessibleName(/notas/);
    expect(row).toHaveAccessibleName(/128 linhas/);
    // Duração em português, não "340ms".
    expect(row).toHaveAccessibleName(/340 ms/);
  });

  it('anuncia a fase corrente enquanto o agente trabalha', () => {
    renderWithProviders(
      <AuditTrail
        trail={trailOf()}
        isStreaming
        phaseLabel="Consultando teste · Postgres"
      />,
    );

    expect(screen.getByText('Consultando teste · Postgres')).toBeInTheDocument();
  });

  it('expandir o passo revela o SQL executado', async () => {
    renderWithProviders(<AuditTrail trail={trailOf(queryStep)} />);
    await expandStep(/Executando consulta/);

    // O `CodeBlock` expõe o trecho como um grupo rotulado pela linguagem.
    const code = screen.getByRole('group', { name: 'sql' });

    // Comparação pelo `textContent` concatenado, e não por `getByText`: o
    // realce de sintaxe quebra a query em vários `<span>` (uma palavra-chave,
    // um identificador, um número…), então não existe UM nó de texto com a
    // query inteira. O que precisa ser verdade é que o SQL executado está
    // legível na tela, inteiro e sem reticências — é isso que se afirma aqui.
    expect(code.textContent?.replace(/\s+/g, ' ').trim()).toContain(SQL);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('expandir o passo revela a conexão e a contagem de linhas', async () => {
    renderWithProviders(<AuditTrail trail={trailOf(queryStep)} />);
    await expandStep(/Executando consulta/);

    expect(screen.getByText('Conexão')).toBeInTheDocument();
    expect(screen.getByText('teste · Postgres')).toBeInTheDocument();
    expect(screen.getByText('Linhas retornadas')).toBeInTheDocument();
  });

  it('a amostra truncada avisa quantas linhas está mostrando', async () => {
    renderWithProviders(<AuditTrail trail={trailOf(queryStep)} />);
    await expandStep(/Executando consulta/);

    expect(screen.getByRole('columnheader', { name: 'mes' })).toBeInTheDocument();
    expect(screen.getByText('Amostra: mostrando 2 de 128 linhas.')).toBeInTheDocument();
  });

  it('a amostra completa não finge que foi cortada', async () => {
    const completo: AuditStep = {
      ...queryStep,
      rowCount: 2,
      preview: { columns: ['mes'], rows: [['jan'], ['fev']] },
    };
    renderWithProviders(<AuditTrail trail={trailOf(completo)} />);
    await expandStep(/Executando consulta/);

    expect(screen.getByText('Amostra completa: 2 linhas.')).toBeInTheDocument();
  });

  it('o passo que falhou mostra a mensagem de erro, e não só um ícone', async () => {
    const falhou: AuditStep = {
      toolCallId: 't2',
      toolName: 'run_query',
      title: 'Executando consulta',
      status: 'error',
      durationMs: 12,
      errorMessage: 'relation "notas" does not exist',
    };
    renderWithProviders(<AuditTrail trail={trailOf(falhou)} />);
    await expandStep(/Executando consulta/);

    const alerta = screen.getByRole('alert');
    expect(
      within(alerta).getByText('relation "notas" does not exist'),
    ).toBeInTheDocument();
  });

  it('o passo destrutivo se distingue de uma leitura', () => {
    const apagou: AuditStep = {
      toolCallId: 't3',
      toolName: 'delete_dashboard',
      title: 'Excluindo dashboard',
      target: 'Vendas 2026',
      status: 'ok',
      durationMs: 90,
      isDestructive: true,
    };
    renderWithProviders(<AuditTrail trail={trailOf(queryStep, apagou)} />);

    // O selo entra no nome acessível da linha: quem usa leitor de tela também
    // ouve que aquele passo apagou algo.
    expect(
      screen.getByRole('button', { name: /Excluindo dashboard/ }),
    ).toHaveAccessibleName(/Ação destrutiva/);
    expect(
      screen.getByRole('button', { name: /Executando consulta/ }),
    ).not.toHaveAccessibleName(/Ação destrutiva/);
  });

  it('passo sem evidência nenhuma não vira uma linha que abre para o vazio', () => {
    const seco: AuditStep = {
      toolCallId: 't4',
      toolName: 'list_connections',
      title: 'Buscando conexões',
      status: 'ok',
    };
    renderWithProviders(<AuditTrail trail={trailOf(seco)} />);

    expect(screen.queryByRole('button', { name: /Buscando conexões/ })).toBeNull();
    expect(screen.getByText('Buscando conexões')).toBeInTheDocument();
  });
});
