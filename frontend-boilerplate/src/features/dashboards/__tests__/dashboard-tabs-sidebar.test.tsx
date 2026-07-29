import { describe, it, expect, beforeEach } from 'vitest';
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

/**
 * A barra passou a GUARDAR a escolha de recolher (`localStorage`), então o
 * estado deixou de morrer com o componente: sem esta limpeza, um caso que
 * recolhe a barra faz o seguinte nascer recolhido — e recolhida a barra não
 * desenha o campo de busca, o que quebraria um teste que não tem nada a ver.
 */
beforeEach(() => {
  window.localStorage.clear();
});

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

    // …e o número NÃO entra no nome acessível: quem ouve a barra continua
    // ouvindo "Cheia", não "Cheia 5" (que não diz nada sem ver a coluna).
    expect(screen.getByRole('link', { name: 'Cheia' })).toBeInTheDocument();
  });

  it('oferece recolher a navegação (telão/notebook)', () => {
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[tab({ id: 'a', title: 'A' }), tab({ id: 'b', title: 'B' })]}
        activeTabId="a"
        hrefForTab={hrefForTab}
      />,
    );

    // O nome é o MESMO que o catálogo pt-BR do design system dava ao controle
    // equivalente, agora escrito por nós (`toggleLabel`): trocá-lo mudaria o
    // que o usuário ouve sem ganho nenhum.
    expect(
      screen.getByRole('button', { name: /Recolher barra lateral/i }),
    ).toBeInTheDocument();
  });

  it('a escolha de recolher SOBREVIVE ao recarregar (fica no localStorage)', () => {
    // Antes era `useState`: quem trabalhava com a barra recolhida a via voltar
    // inteira a cada F5 e a cada troca de dashboard. A barra do app já guardava
    // a dela (`sidebar:collapsed`); esta guarda a sua, em chave própria.
    const tabs = [tab({ id: 'a', title: 'A' }), tab({ id: 'b', title: 'B' })];
    const { unmount } = renderWithProviders(
      <DashboardTabsSidebar tabs={tabs} activeTabId="a" hrefForTab={hrefForTab} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Recolher barra lateral/i }));
    expect(
      screen.getByRole('button', { name: /Expandir barra lateral/i }),
    ).toBeInTheDocument();

    unmount();
    renderWithProviders(
      <DashboardTabsSidebar tabs={tabs} activeTabId="a" hrefForTab={hrefForTab} />,
    );

    expect(
      screen.getByRole('button', { name: /Expandir barra lateral/i }),
    ).toBeInTheDocument();
  });

  it('a DESCRIÇÃO da aba fica disponível no hover, no próprio item', () => {
    // Deixou de ser um `Tooltip` nosso e passou a ser a dica do item (o `title`
    // nativo que a nav aplica com o campo `description`). O que não pode mudar
    // é o fato: dá para saber o que a aba responde ANTES de clicar.
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'a', title: 'Autos', description: 'Protestos em cartório' }),
          tab({ id: 'b', title: 'IPTU' }),
        ]}
        activeTabId="a"
        hrefForTab={hrefForTab}
      />,
    );

    expect(screen.getByRole('link', { name: 'Autos' })).toHaveAttribute(
      'title',
      'Protestos em cartório',
    );
  });

  it('DIVISOR declarado pela aba entra ANTES dela, no mesmo grupo', () => {
    // Serve para separar um bloco de itens sem inventar um título de seção que
    // ninguém pediu — por isso o separador é irmão do item, não um grupo novo.
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'a', title: 'Antes' }),
          tab({ id: 'b', title: 'Depois', divider: true }),
        ]}
        activeTabId="a"
        hrefForTab={hrefForTab}
      />,
    );

    const separador = screen.getByRole('separator');
    const depois = screen.getByRole('link', { name: 'Depois' });

    expect(separador.parentElement).toBe(depois.closest('li')?.parentElement);
    expect(
      separador.compareDocumentPosition(depois) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

    // A nav agrupa os filhos numa região rotulada pelo pai — é essa relação (e
    // não um recuo de padding) que um leitor de tela consegue anunciar como
    // "dentro de Cobrança".
    const grupo = screen.getByRole('group', { name: 'Cobrança' });
    expect(within(grupo).getByRole('link', { name: /Por bairro/ })).toBeInTheDocument();
  });

  it('aba-pai COM blocos continua alcançável: o link dela mora dentro do ramo', () => {
    /*
     * A nav própria não deixa um item com filhos navegar: clicar nele abre e
     * fecha o ramo (CONTRATO §3). Num menu de app isso está certo — "Atividade
     * Fiscal" é uma pasta. Aqui não: toda aba tem conteúdo, e uma aba-pai virada
     * botão esconderia as linhas dela da barra inteira. Por isso ela entra
     * também como o PRIMEIRO item do próprio ramo, e é esse link que carrega o
     * endereço e o `aria-current`.
     */
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'pai', title: 'Cobrança', rows: [rowWith(3)] }),
          tab({ id: 'filha', title: 'Por bairro', level: 2, rows: [rowWith(1)] }),
        ]}
        activeTabId="pai"
        hrefForTab={hrefForTab}
      />,
    );

    // O ramo nasce ABERTO porque a aba atual está dentro dele — quem chega por
    // link direto precisa ver onde está.
    expect(screen.getByRole('button', { name: 'Cobrança' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    const grupo = screen.getByRole('group', { name: 'Cobrança' });
    const link = within(grupo).getByRole('link', { name: 'Cobrança' });
    expect(link).toHaveAttribute('href', '/dashboards/d1/view?tab=pai');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(within(grupo).getByRole('link', { name: 'Por bairro' })).toBeInTheDocument();
  });

  it('aba-pai SEM blocos não ganha link para uma tela vazia', () => {
    // Aba que só agrupa não vira caminho para lugar nenhum: o ramo é o item, e
    // é ele que se anuncia como a página atual quando a aba ativa é essa.
    renderWithProviders(
      <DashboardTabsSidebar
        tabs={[
          tab({ id: 'pai', title: 'Cobrança' }),
          tab({ id: 'filha', title: 'Por bairro', level: 2, rows: [rowWith(1)] }),
        ]}
        activeTabId="pai"
        hrefForTab={hrefForTab}
      />,
    );

    expect(screen.queryByRole('link', { name: 'Cobrança' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cobrança' })).toHaveAttribute(
      'aria-current',
      'page',
    );
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

  it('o topo fixo leva SÓ o campo — a faixa do botão é reservada pela BARRA', () => {
    /*
     * Fronteira de responsabilidade, e ela já foi cruzada uma vez: como o botão
     * de recolher flutua sobre os primeiros 48px da coluna, houve uma versão
     * desta tela que reservava a faixa aqui, com um espaçador dentro do
     * `topContent`. O lugar certo é a barra — a faixa é do botão, e o botão é
     * dela (`nav-section.css`: `:has(> .app-nav-sidebar__toggle)`), que também
     * dá os 16px em volta do bloco fixo.
     *
     * Este caso trava o lado de cá: quem for resolver uma sobreposição futura
     * empilhando caixas no `topContent` quebra aqui e vai olhar o componente.
     * A geometria em si é CSS e está medida no Chrome pelo dono do componente;
     * jsdom não calcula layout e não teria como afirmá-la.
     */
    renderWithProviders(
      <DashboardTabsSidebar tabs={many(9)} activeTabId="t0" hrefForTab={hrefForTab} />,
    );

    const topo = document.querySelector('.app-nav-sidebar__top');
    expect(topo).not.toBeNull();
    expect(
      within(topo as HTMLElement).getByPlaceholderText('Filtrar abas…'),
    ).toBeInTheDocument();
    expect(topo?.children).toHaveLength(1);
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
