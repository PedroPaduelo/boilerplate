/**
 * Regressão do CONTÊINER da navegação (`NavSidebar`).
 *
 * O que este arquivo trava:
 *
 * 1. NA GAVETA, SÓ A LISTA. Quem desenha superfície, largura e sombra no mobile
 *    é o `AppShell` — repetir isso aqui daria duas molduras, uma dentro da
 *    outra, e um botão de recolher numa gaveta que não tem largura para
 *    recolher. É o próprio design system que avisa em qual dos dois estamos
 *    (`SideNavRenderContext`), e o teste garante que continuamos ouvindo.
 * 2. O BOTÃO DE RECOLHER é controlado por quem usa (o estado da forma mini
 *    persiste fora daqui) e muda de nome conforme a direção.
 * 3. O CAMPO FIXO SOME NA FORMA MINI: um input de texto em 88px não é
 *    utilizável, só ocupa a faixa.
 * 4. LISTA VAZIA MOSTRA O MOTIVO — uma coluna que simplesmente fica em branco
 *    lê como navegação quebrada.
 */
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SideNavRenderContext } from '@astryxdesign/core/SideNav';
import { renderWithProviders } from '@/test/render';
import { NavSidebar } from '@/shared/ui/nav-section';
import type { NavGroup } from '@/shared/ui/nav-section';

const GROUPS: NavGroup[] = [
  {
    subheader: 'Visão geral',
    items: [
      { title: 'Início', href: '/home' },
      { title: 'Dashboards', href: '/dashboards' },
    ],
  },
];

describe('coluna (modo padrão)', () => {
  it('desenha a superfície, a lista e o botão de recolher', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();

    renderWithProviders(
      <NavSidebar
        groups={GROUPS}
        aria-label="Navegação principal"
        isCollapsed={false}
        onCollapsedChange={onCollapsedChange}
        data-testid="nav-sidebar"
      />,
    );

    const container = screen.getByTestId('nav-sidebar');
    expect(container).toHaveClass('app-nav-sidebar');
    expect(container).not.toHaveClass('app-nav-sidebar--mini');
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Recolher navegação' }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it('o botão de recolher é filho DIRETO do contêiner — é o que reserva a faixa dele', () => {
    renderWithProviders(
      <NavSidebar
        groups={GROUPS}
        aria-label="Navegação principal"
        onCollapsedChange={vi.fn()}
        data-testid="nav-sidebar"
      />,
    );

    /*
     * O botão flutua na faixa de 24–48px da borda direita. Na origem essa faixa
     * é do bloco do logo (`referencia/sidebar.css:77-82`); aqui não há bloco de
     * logo, então a barra reserva o espaço com
     * `.app-nav-sidebar:has(> .app-nav-sidebar__toggle)`.
     *
     * O `>` é o ponto frágil: embrulhar o botão em qualquer `<div>` derruba a
     * reserva EM SILÊNCIO e o botão volta a pousar sobre o primeiro item e
     * sobre o "×" do campo de busca. Nenhuma outra ferramenta pega isso — o
     * CSS nem é carregado no jsdom —, então a relação pai/filho fica travada
     * aqui.
     */
    const container = screen.getByTestId('nav-sidebar');
    const toggle = screen.getByRole('button', { name: 'Recolher navegação' });
    expect(toggle.parentElement).toBe(container);
  });

  it('enquadra topo e rodapé na própria barra — o consumidor não paga margem', () => {
    renderWithProviders(
      <NavSidebar
        groups={GROUPS}
        aria-label="Navegação principal"
        topContent={<input aria-label="Filtrar" />}
        footer={<button type="button">Sair</button>}
        data-testid="nav-sidebar"
      />,
    );

    /*
     * As duas zonas têm invólucro PRÓPRIO, e é ele que carrega margem, linha e
     * centragem (ver `nav-section.css`). Sem isto cada tela que usa a barra
     * embrulha o conteúdo num contêiner com padding só para descolar das
     * bordas — e a geometria da navegação passa a morar em quem a consome.
     */
    expect(
      screen.getByLabelText('Filtrar').closest('.app-nav-sidebar__top'),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Sair' }).closest('.app-nav-sidebar__footer'),
    ).not.toBeNull();
  });

  it('recolhida: 88px de faixa, rótulo do botão invertido e sem conteúdo fixo', () => {
    renderWithProviders(
      <NavSidebar
        groups={GROUPS}
        aria-label="Navegação principal"
        isCollapsed
        onCollapsedChange={vi.fn()}
        topContent={<input aria-label="Filtrar" />}
        data-testid="nav-sidebar"
      />,
    );

    expect(screen.getByTestId('nav-sidebar')).toHaveClass('app-nav-sidebar--mini');
    expect(screen.getByRole('navigation')).toHaveClass('app-nav--mini');
    expect(
      screen.getByRole('button', { name: 'Expandir navegação' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Filtrar')).not.toBeInTheDocument();
  });

  it('sem `onCollapsedChange` não há botão — controle morto não entra na tela', () => {
    renderWithProviders(
      <NavSidebar
        groups={GROUPS}
        aria-label="Navegação principal"
        data-testid="nav-sidebar"
      />,
    );
    expect(screen.queryByRole('button', { name: /navegação/i })).not.toBeInTheDocument();
  });

  it('lista vazia mostra o conteúdo alternativo no lugar do nada', () => {
    renderWithProviders(
      <NavSidebar
        groups={[{ subheader: 'Visão geral', items: [] }]}
        aria-label="Navegação principal"
        emptyContent={<p>Nenhum item corresponde à busca.</p>}
      />,
    );

    expect(screen.getByText('Nenhum item corresponde à busca.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});

describe('gaveta (mobile)', () => {
  /*
   * O que a gaveta NÃO desenha é a CAIXA, não o conteúdo.
   *
   * Este caso já afirmou o contrário — que `topContent` e `footer` sumiam no
   * mobile. Estava errado, e o custo foi medido na integração: sem rodapé, o
   * menu da conta não existe no celular e não há como SAIR do sistema. O
   * `SideNav` que substituímos renderiza `{topContent}{children}{footer}` no
   * modo 'drawer-content' (`SideNav.tsx:471-489`) — tínhamos regredido em
   * relação a ele. Fora ficam superfície, largura fixa e botão de recolher.
   */
  it('mantém as três zonas — some a caixa, não o conteúdo', () => {
    renderWithProviders(
      <SideNavRenderContext.Provider value="drawer-content">
        <NavSidebar
          groups={GROUPS}
          aria-label="Navegação principal"
          isCollapsed
          onCollapsedChange={vi.fn()}
          topContent={<input aria-label="Filtrar" />}
          footer={<button type="button">Sair</button>}
          data-testid="nav-sidebar"
        />
      </SideNavRenderContext.Provider>,
    );

    const container = screen.getByTestId('nav-sidebar');
    expect(container).toHaveClass('app-nav-sidebar--plain');

    // As três zonas: topo, lista e rodapé.
    expect(screen.getByLabelText('Filtrar')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Dashboards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('não desenha a caixa: sem forma mini e sem botão de recolher', () => {
    renderWithProviders(
      <SideNavRenderContext.Provider value="drawer-content">
        <NavSidebar
          groups={GROUPS}
          aria-label="Navegação principal"
          isCollapsed
          onCollapsedChange={vi.fn()}
          data-testid="nav-sidebar"
        />
      </SideNavRenderContext.Provider>,
    );

    // `isCollapsed` da coluna não atravessa: numa gaveta de 288px não há o que
    // recolher, e o botão que faria isso também não existe aqui.
    expect(screen.getByTestId('nav-sidebar')).not.toHaveClass('app-nav-sidebar--mini');
    expect(screen.getByRole('navigation')).not.toHaveClass('app-nav--mini');
    expect(screen.queryByRole('button', { name: /navegação/i })).not.toBeInTheDocument();
  });
});
