/**
 * O contrato comum (`PLANO.md` §4) visto pela TELA DE PROPRIEDADES: o painel
 * oferece as mesmas quatro coisas para todo bloco do catálogo — cabeçalho
 * (título, subtítulo, descrição, estado vazio), dados, variáveis de
 * interpolação e os cinco estados.
 *
 * Estes testes travam o que era fácil de perder: o painel do bloco NARRATIVO
 * (sem `dataContract`) ganhar as mesmas abas, e os campos novos chegarem ao
 * bloco que o `BlockRenderer` desenha.
 */
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { getCatalogEntryByType } from '../../../lib/catalog-entries';
import { BlockPlayground } from '../block-playground';
import { PlaygroundWrapperPanel } from '../playground-wrapper-panel';
import { buildPreviewBlock, buildPreviewResult } from '../playground-helpers';
import { availableVariables } from '../playground-scope';
import type { PlaygroundConfig } from '../types';

const CONFIG: PlaygroundConfig = {
  props: {},
  title: 'Faturamento',
  subtitle: '',
  description: '',
  emptyMessage: '',
  query: '',
  durationMs: '',
  takeaways: [],
  showSql: true,
  previewState: 'success',
};

const DATA = [
  { label: 'Jan', value: 10 },
  { label: 'Fev', value: 30 },
];

/** Bloco narrativo (sem `dataContract`) — o caso que antes ficava de fora. */
function narrativeEntry() {
  const entry = getCatalogEntryByType('rich_text');
  if (!entry) throw new Error('bloco `rich_text` não está registrado');
  return entry;
}

/** Bloco de gráfico com contrato de dados. */
function chartEntry() {
  const entry = getCatalogEntryByType('bar_chart');
  if (!entry) throw new Error('bloco `bar_chart` não está registrado');
  return entry;
}

describe('campos do cabeçalho chegam ao bloco', () => {
  it('descrição e mensagem de vazio viram campos do bloco', () => {
    const block = buildPreviewBlock(
      'bar_chart',
      {
        ...CONFIG,
        description: 'Receita por mês, sem impostos.',
        emptyMessage: 'Nenhum lançamento em {{rotuloMaximo}}.',
      },
      false,
    );

    expect(block.description).toBe('Receita por mês, sem impostos.');
    expect(block.emptyMessage).toBe('Nenhum lançamento em {{rotuloMaximo}}.');
  });

  it('campo vazio não vira chave no bloco (o padrão da moldura continua valendo)', () => {
    const block = buildPreviewBlock('bar_chart', CONFIG, false);

    expect('description' in block).toBe(false);
    expect('emptyMessage' in block).toBe(false);
  });
});

describe('estados do preview', () => {
  it('carregando e erro viram o resultado que o motor traduz', () => {
    const entry = chartEntry();

    expect(buildPreviewResult(entry, DATA, false, '', 'loading')?.state).toBe('running');
    expect(buildPreviewResult(entry, DATA, false, '', 'error')?.state).toBe('error');
  });

  it('vazio é sucesso SEM linhas — é assim que o bloco fica vazio de verdade', () => {
    const result = buildPreviewResult(chartEntry(), DATA, false, '', 'empty');

    expect(result?.state).toBe('success');
    expect(result?.data).toEqual([]);
  });

  it('bloco sem contrato também recebe o dado (é o que alimenta as variáveis)', () => {
    const result = buildPreviewResult(narrativeEntry(), { total: 7 }, false, '');

    expect(result?.state).toBe('success');
    expect(result?.data).toEqual({ total: 7 });
  });

  it('JSON quebrado não vira resultado — o preview pausa em vez de mentir', () => {
    expect(buildPreviewResult(chartEntry(), undefined, true, '')).toBeUndefined();
  });
});

describe('variáveis disponíveis', () => {
  it('lista o vocabulário comum com o valor já resolvido', () => {
    const variables = availableVariables(DATA);
    const keys = variables.map((v) => v.key);

    expect(keys).toContain('total');
    expect(keys).toContain('maximo');
    expect(keys).toContain('rotuloMaximo');
    expect(variables.find((v) => v.key === 'total')?.preview).toBe('40');
    expect(variables.find((v) => v.key === 'rotuloMaximo')?.preview).toBe('Fev');
  });

  it('sem dado, não há variável a oferecer', () => {
    expect(availableVariables(undefined)).toEqual([]);
  });
});

describe('painel de cabeçalho', () => {
  function renderPanel(onPatch = vi.fn()) {
    renderWithProviders(
      <PlaygroundWrapperPanel
        config={CONFIG}
        onPatch={onPatch}
        titlePlaceholder="Gráfico de colunas"
        isTitleRequired={false}
        isLive={false}
        data={DATA}
        badgeLabel="Gráfico de colunas"
      />,
    );
    return onPatch;
  }

  it('oferece os quatro campos de texto e o seletor de estado', () => {
    renderPanel();

    expect(screen.getByLabelText(/^Título/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Subtítulo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Descrição/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mensagem de estado vazio/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Pré-visualizar o bloco como/)).toBeInTheDocument();
  });

  it('clicar numa variável insere {{chave}} no campo em foco', async () => {
    const onPatch = renderPanel();

    // Sem tocar em nada, o destino é o título (o primeiro campo).
    await userEvent.click(screen.getByRole('button', { name: /\{\{total\}\}/ }));
    expect(onPatch).toHaveBeenCalledWith({ title: 'Faturamento {{total}}' });

    // Depois de focar outro campo, a inserção segue o foco.
    await userEvent.click(screen.getByLabelText(/^Descrição/));
    await userEvent.click(screen.getByRole('button', { name: /\{\{maximo\}\}/ }));
    expect(onPatch).toHaveBeenLastCalledWith({ description: '{{maximo}}' });
  });
});

describe('bloco narrativo tem o mesmo painel', () => {
  it('a aba "Dados" existe e aceita JSON livre para as variáveis', async () => {
    renderWithProviders(<BlockPlayground entry={narrativeEntry()} variant="page" />);

    await userEvent.click(screen.getByRole('button', { name: 'Dados' }));

    expect(screen.getByLabelText(/^JSON dos dados/)).toBeInTheDocument();
    expect(screen.getByText(/não é validado/i)).toBeInTheDocument();
  });

  it('o JSON livre já abre com exemplo, então as variáveis aparecem de cara', async () => {
    renderWithProviders(<BlockPlayground entry={narrativeEntry()} variant="page" />);

    await userEvent.click(screen.getByRole('button', { name: 'Dados' }));

    expect(screen.getAllByText('{{total}}').length).toBeGreaterThan(0);
  });

  it('a aba "Cabeçalho" traz descrição, estado vazio e o seletor de estados', async () => {
    renderWithProviders(<BlockPlayground entry={narrativeEntry()} variant="page" />);

    await userEvent.click(screen.getByRole('button', { name: 'Cabeçalho' }));

    expect(screen.getByLabelText(/^Descrição/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mensagem de estado vazio/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Pré-visualizar o bloco como/)).toBeInTheDocument();
  });

  it('“sem permissão” é desenhado pela moldura, mesmo sem contrato de dados', async () => {
    renderWithProviders(<BlockPlayground entry={narrativeEntry()} variant="page" />);

    await userEvent.click(screen.getByRole('button', { name: 'Cabeçalho' }));
    await userEvent.click(screen.getByLabelText(/^Pré-visualizar o bloco como/));
    await userEvent.click(await screen.findByRole('option', { name: 'Sem permissão' }));

    expect(
      await screen.findByText('Sem permissão para ver estes dados'),
    ).toBeInTheDocument();
  });
});

describe('do painel ao bloco', () => {
  it('a mensagem de estado vazio escrita no painel é a que o bloco mostra', async () => {
    renderWithProviders(<BlockPlayground entry={chartEntry()} variant="page" />);

    await userEvent.click(screen.getByRole('button', { name: 'Cabeçalho' }));
    await userEvent.type(screen.getByLabelText(/^Mensagem de estado vazio/), 'Nada aqui');
    await userEvent.click(screen.getByLabelText(/^Pré-visualizar o bloco como/));
    await userEvent.click(await screen.findByRole('option', { name: 'Vazio' }));

    // O estado vazio da moldura anuncia a mensagem como título — por papel, e
    // não por texto, porque o mesmo texto também está no campo do formulário.
    expect(await screen.findByRole('heading', { name: 'Nada aqui' })).toBeInTheDocument();
  });
});
