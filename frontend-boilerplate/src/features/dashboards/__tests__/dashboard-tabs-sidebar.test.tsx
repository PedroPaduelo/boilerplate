import { describe, it, expect } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { DashboardTabsSidebar } from '../components/viewer/dashboard-tabs-sidebar';
import {
  filterTabs,
  groupTabs,
  neighborTabId,
  nestTabs,
  type ResolvedDashTab,
} from '../lib/dashboard-tabs';

/**
 * Navegação de abas do visualizador.
 *
 * O que estes testes protegem: o dashboard é montado pelo AGENTE, e é ele quem
 * declara ícone, descrição e grupo das abas. Se a barra ignorar esses campos, o
 * agente não tem como enriquecer nada — a tela volta a ser uma lista plana de
 * rótulos, que foi o problema que motivou o desenho.
 */

function tab(overrides: Partial<ResolvedDashTab> = {}): ResolvedDashTab {
  return {
    id: 'tab_1',
    title: 'Visão geral',
    rows: [],
    isImplicit: false,
    ...overrides,
  };
}

/** Linha com N blocos — só o que a contagem da barra precisa. */
function rowWith(blocks: number) {
  return { id: `row_${blocks}`, blocks: Array.from({ length: blocks }, () => ({})) };
}

describe('groupTabs', () => {
  it('agrupa por `group` preservando a ordem de declaração', () => {
    const grupos = groupTabs([
      tab({ id: 'a', title: 'IPTU', group: 'Arrecadação' }),
      tab({ id: 'b', title: 'Autos', group: 'Fiscalização' }),
      tab({ id: 'c', title: 'ISS', group: 'Arrecadação' }),
    ]);

    expect(grupos.map((g) => g.title)).toEqual(['Arrecadação', 'Fiscalização']);
    expect(grupos[0].tabs.map((t) => t.id)).toEqual(['a', 'c']);
    expect(grupos[1].tabs.map((t) => t.id)).toEqual(['b']);
  });

  it('abas sem grupo ficam numa seção SEM título (não inventa "Outros")', () => {
    const grupos = groupTabs([tab({ id: 'a' }), tab({ id: 'b' })]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].title).toBeUndefined();
    expect(grupos[0].tabs).toHaveLength(2);
  });

  it('mistura agrupadas e soltas sem perder nenhuma aba', () => {
    const grupos = groupTabs([
      tab({ id: 'solta1' }),
      tab({ id: 'agrupada', group: 'Arrecadação' }),
      tab({ id: 'solta2' }),
    ]);

    const ids = grupos.flatMap((g) => g.tabs.map((t) => t.id));
    expect(ids).toEqual(['solta1', 'agrupada', 'solta2']);
  });
});

describe('DashboardTabsSidebar', () => {
  const hrefForTab = (id: string) => `/dashboards/d1/view?tab=${id}`;

  it('renderiza cada aba como LINK para a própria aba', () => {
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'tab_a', title: 'Visão geral' }),
          tab({ id: 'tab_b', title: 'Detalhe' }),
        ]}
        activeTabId="tab_a"
        hrefForTab={hrefForTab}
      />,
    );

    // Link (e não botão): é o que dá ⌘+clique, "copiar endereço" e histórico.
    expect(screen.getByRole('link', { name: /Visão geral/ })).toHaveAttribute(
      'href',
      '/dashboards/d1/view?tab=tab_a',
    );
    expect(screen.getByRole('link', { name: /Detalhe/ })).toHaveAttribute(
      'href',
      '/dashboards/d1/view?tab=tab_b',
    );
  });

  it('marca a aba ativa como página atual', () => {
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'tab_a', title: 'Visão geral' }),
          tab({ id: 'tab_b', title: 'Detalhe' }),
        ]}
        activeTabId="tab_b"
        hrefForTab={hrefForTab}
      />,
    );

    expect(screen.getByRole('link', { name: /Detalhe/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /Visão geral/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('desenha os GRUPOS declarados pelo agente como seções tituladas', () => {
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'a', title: 'IPTU', group: 'Arrecadação' }),
          tab({ id: 'b', title: 'ISS', group: 'Arrecadação' }),
          tab({ id: 'c', title: 'Autos', group: 'Fiscalização' }),
        ]}
        activeTabId="a"
        hrefForTab={hrefForTab}
      />,
    );

    // O título do grupo precisa estar VISÍVEL: é ele que quebra a lista longa
    // em blocos e dá a hierarquia que o dashboard declarou.
    expect(screen.getByText('Arrecadação')).toBeInTheDocument();
    expect(screen.getByText('Fiscalização')).toBeInTheDocument();
  });

  it('mostra a CONTAGEM de blocos de cada aba (peso da aba, de relance)', () => {
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'a', title: 'Cheia', rows: [rowWith(3), rowWith(2)] }),
          tab({ id: 'b', title: 'Vazia', rows: [] }),
        ]}
        activeTabId="a"
        hrefForTab={hrefForTab}
      />,
    );

    expect(
      within(screen.getByRole('link', { name: /Cheia/ })).getByText('5'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /Vazia/ })).getByText('0'),
    ).toBeInTheDocument();
  });

  it('oferece recolher a navegação (telão/notebook)', () => {
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[tab({ id: 'a', title: 'A' }), tab({ id: 'b', title: 'B' })]}
        activeTabId="a"
        hrefForTab={hrefForTab}
      />,
    );

    // Nome acessível vindo do catálogo pt-BR do DS — o mesmo que o usuário ouve.
    expect(
      screen.getByRole('button', { name: /Recolher barra lateral/i }),
    ).toBeInTheDocument();
  });

  it('aba SEM ícone/grupo continua renderizando (dashboard antigo não quebra)', () => {
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[tab({ id: 'a', title: 'Só o rótulo' })]}
        activeTabId="a"
        hrefForTab={hrefForTab}
      />,
    );

    expect(screen.getByRole('link', { name: /Só o rótulo/ })).toBeInTheDocument();
  });

  it('SUB-ABA (level 2) vira item aninhado da aba anterior', () => {
    // Hierarquia precisa ser VISÍVEL, não implícita: aninhar de verdade (em vez
    // de só indentar com padding) é o que dá o comportamento do design system —
    // recolhida, a aba-pai vira um popover com as filhas dentro.
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'pai', title: 'Cobrança' }),
          tab({ id: 'filha', title: 'Por bairro', level: 2 }),
        ]}
        activeTabId="pai"
        hrefForTab={hrefForTab}
      />,
    );

    // O design system agrupa os filhos numa região rotulada pelo pai — é essa
    // relação (e não um recuo de padding) que um leitor de tela consegue
    // anunciar como "dentro de Cobrança".
    const grupo = screen.getByRole('group', { name: 'Cobrança' });
    expect(within(grupo).getByRole('link', { name: /Por bairro/ })).toBeInTheDocument();
  });
});

/**
 * MUITAS ABAS — o caso que motivou a busca. Abaixo do limiar a barra não deve
 * ganhar um controle a mais: até ~8 itens o olho varre mais rápido do que a mão
 * digita, e um campo permanente competiria com os próprios itens.
 */
describe('DashboardTabsSidebar — busca', () => {
  const hrefForTab = (id: string) => `/dashboards/d1/view?tab=${id}`;
  const many = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      tab({ id: `t${i}`, title: `Aba ${i}`, group: i % 2 === 0 ? 'Par' : 'Ímpar' }),
    );

  it('NÃO aparece com poucas abas', () => {
    renderWithProviders(
      <DashboardTabsSidebar tabs={many(3)} activeTabId="t0" hrefForTab={hrefForTab} />,
    );

    expect(screen.queryByPlaceholderText('Filtrar abas…')).not.toBeInTheDocument();
  });

  it('aparece a partir do limiar e filtra a lista', async () => {
    const tabs = [
      ...many(8),
      tab({ id: 'protesto', title: 'Protestos', group: 'Cobrança' }),
    ];
    renderWithProviders(
      <DashboardTabsSidebar tabs={tabs} activeTabId="t0" hrefForTab={hrefForTab} />,
    );

    const campo = screen.getByPlaceholderText('Filtrar abas…');
    fireEvent.change(campo, { target: { value: 'protesto' } });

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Protestos/ })).toBeInTheDocument(),
    );
    expect(screen.queryByRole('link', { name: /^Aba 0/ })).not.toBeInTheDocument();
  });

  it('busca sem resultado EXPLICA — lista vazia sem texto parece bug', async () => {
    renderWithProviders(
      <DashboardTabsSidebar tabs={many(9)} activeTabId="t0" hrefForTab={hrefForTab} />,
    );

    fireEvent.change(screen.getByPlaceholderText('Filtrar abas…'), {
      target: { value: 'zzzz' },
    });

    await waitFor(() =>
      expect(screen.getByText(/Nenhuma aba corresponde a/)).toBeInTheDocument(),
    );
  });
});

describe('filterTabs', () => {
  it('casa título, descrição e grupo — quem procura lembra do ASSUNTO', () => {
    const tabs = [
      tab({ id: 'a', title: 'IPTU' }),
      tab({ id: 'b', title: 'Autos', description: 'Protestos em cartório' }),
      tab({ id: 'c', title: 'ISS', group: 'Arrecadação' }),
    ];

    expect(filterTabs(tabs, 'protesto').map((t) => t.id)).toEqual(['b']);
    expect(filterTabs(tabs, 'arrecad').map((t) => t.id)).toEqual(['c']);
  });

  it('ignora acento e caixa (ninguém digita "Fiscalização" com til)', () => {
    const tabs = [tab({ id: 'a', title: 'Fiscalização' })];
    expect(filterTabs(tabs, 'FISCALIZACAO')).toHaveLength(1);
  });

  it('termo vazio devolve tudo (não some com a navegação)', () => {
    const tabs = [tab({ id: 'a' }), tab({ id: 'b' })];
    expect(filterTabs(tabs, '   ')).toHaveLength(2);
  });
});

describe('nestTabs', () => {
  it('sub-aba órfã (sem pai antes dela) sobe a primeiro nível em vez de sumir', () => {
    // Acontece de verdade quando o filtro esconde o pai. Perder uma aba é
    // sempre pior que mostrá-la um nível acima do pretendido.
    const nested = nestTabs([tab({ id: 'sozinha', level: 2 })]);
    expect(nested).toHaveLength(1);
    expect(nested[0].tab.id).toBe('sozinha');
    expect(nested[0].children).toHaveLength(0);
  });
});

describe('neighborTabId (atalho de teclado)', () => {
  const tabs = [tab({ id: 'a' }), tab({ id: 'b' }), tab({ id: 'c' })];

  it('anda para os lados', () => {
    expect(neighborTabId(tabs, 'b', 'next')).toBe('c');
    expect(neighborTabId(tabs, 'b', 'previous')).toBe('a');
  });

  it('NÃO dá a volta nas bordas', () => {
    // Ciclo faz a pessoa passar do fim para o começo sem perceber e reler o que
    // já viu — parar na borda é o comportamento de qualquer lista de sistema.
    expect(neighborTabId(tabs, 'c', 'next')).toBeUndefined();
    expect(neighborTabId(tabs, 'a', 'previous')).toBeUndefined();
  });
});
