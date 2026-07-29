/**
 * Regressão da LISTA de navegação (`NavSection`).
 *
 * O que este arquivo trava:
 *
 * 1. OS DOIS NÍVEIS SÃO ELEMENTOS DIFERENTES — item com filhos é `<button>`
 *    que abre/fecha (`aria-expanded` + `aria-controls`); folha com `href` é
 *    link de verdade. Trocar um pelo outro quebra ⌘/Ctrl+clique ou promete
 *    navegação que não existe.
 * 2. `open` ≠ `active` — o pai de uma sub-rota ativa nasce ABERTO, e não
 *    ativo. É a regra que decide a cor (verde só na rota raiz) e o defeito
 *    mais fácil de reintroduzir.
 * 3. O SUBHEADER COLAPSA O GRUPO — ele é botão, não decoração.
 * 4. DESABILITADO NÃO DISPARA NADA — o `pointer-events: none` do CSS não
 *    existe no jsdom (nem no clique por teclado), então a guarda é de código.
 * 5. A FORMA MINI É OUTRA COISA — sem subheaders, com o rótulo curto.
 *
 * As consultas são por PAPEL acessível. As poucas asserções de classe são
 * legítimas aqui: `app-nav__item--root`/`--sub` e `is-active`/`is-open` são
 * contrato público entre o JSX e o `nav-section.css` (CONTRATO §3.1) — não
 * nomes gerados, como os do StyleX.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { NavSection } from '@/shared/ui/nav-section';
import type { NavGroup } from '@/shared/ui/nav-section';

const ICON = <svg data-testid="icone-inicio" />;

function groups(overrides: Partial<NavGroup>[] = []): NavGroup[] {
  const base: NavGroup[] = [
    {
      subheader: 'Visão geral',
      items: [
        { title: 'Início', href: '/home', icon: ICON, caption: 'Painel de entrada' },
        {
          title: 'Atividade Fiscal',
          icon: ICON,
          children: [
            { title: 'Parametrização', href: '/fiscal/parametros' },
            { title: 'Execução', href: '/fiscal/execucao' },
          ],
        },
      ],
    },
  ];
  return base.map((group, index) => ({ ...group, ...overrides[index] }));
}

function renderNav(value: NavGroup[] = groups()) {
  return renderWithProviders(
    <NavSection groups={value} aria-label="Navegação principal" />,
  );
}

describe('estrutura e papéis', () => {
  it('a região se anuncia com o rótulo recebido', () => {
    renderNav();
    expect(
      screen.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeInTheDocument();
  });

  it('item raiz com filhos é botão que controla o bloco; folha com href é link', async () => {
    const user = userEvent.setup();
    renderNav();

    const ramo = screen.getByRole('button', { name: /Atividade Fiscal/ });
    expect(ramo).toHaveClass('app-nav__item--root');
    expect(ramo).toHaveAttribute('aria-expanded', 'false');

    // `aria-controls` tem de apontar para um bloco que EXISTE — a ligação
    // item ↔ filhos é o que o leitor de tela usa para navegar entre eles.
    const alvo = ramo.getAttribute('aria-controls');
    expect(alvo).toBeTruthy();
    expect(document.getElementById(String(alvo))).not.toBeNull();

    await user.click(ramo);

    const filho = screen.getByRole('link', { name: 'Execução' });
    expect(filho).toHaveClass('app-nav__item--sub');
    expect(filho).toHaveAttribute('href', '/fiscal/execucao');

    // A folha do primeiro nível continua sendo link (ela navega).
    expect(screen.getByRole('link', { name: /Início/ })).toHaveClass(
      'app-nav__item--root',
    );
  });

  it('o bloco de filhos é um `group` com o nome do pai, e os filhos vivem dentro dele', async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole('button', { name: /Atividade Fiscal/ }));

    /*
     * Sem papel, o bloco é uma `<div>` anônima e o leitor de tela lê os filhos
     * como irmãos dos itens de cima — some a informação que o recuo e a linha
     * vertical passam a quem enxerga. `getByRole('group', { name })` é também
     * o contrato que o `SideNavItem` do Astryx cumpre hoje e do qual as telas
     * que estão migrando já dependem.
     */
    const grupo = screen.getByRole('group', { name: 'Atividade Fiscal' });
    expect(grupo).toHaveClass('app-nav__children');
    // O `aria-controls` do pai aponta para ESTE bloco (uma coisa só, não duas).
    expect(screen.getByRole('button', { name: /Atividade Fiscal/ })).toHaveAttribute(
      'aria-controls',
      grupo.id,
    );

    // E o filho é buscável DENTRO do grupo, que é como o consumidor consulta.
    expect(within(grupo).getByRole('link', { name: 'Execução' })).toBeInTheDocument();
  });

  it('o corpo de um GRUPO não vira `group` — quem rotula ali é o subheader', () => {
    renderNav();
    // Um `group` em volta da seção duplicaria o rótulo e inventaria um nível
    // de aninhamento que não existe na tela.
    expect(screen.queryByRole('group', { name: 'Visão geral' })).not.toBeInTheDocument();
  });

  it('a legenda é a 2ª linha do item, com o texto completo na dica', () => {
    renderNav();
    const legenda = screen.getByText('Painel de entrada');
    expect(legenda).toHaveClass('app-nav__caption');
    expect(legenda).toHaveAttribute('title', 'Painel de entrada');
  });
});

describe('abertura dos ramos', () => {
  it('clicar num item com filhos alterna `aria-expanded` e o estado do bloco', async () => {
    const user = userEvent.setup();
    renderNav();

    const ramo = screen.getByRole('button', { name: /Atividade Fiscal/ });
    const bloco = document.getElementById(String(ramo.getAttribute('aria-controls')));
    expect(bloco).toHaveAttribute('data-state', 'closed');

    await user.click(ramo);
    expect(ramo).toHaveAttribute('aria-expanded', 'true');
    expect(bloco).toHaveAttribute('data-state', 'open');

    await user.click(ramo);
    expect(ramo).toHaveAttribute('aria-expanded', 'false');
    expect(bloco).toHaveAttribute('data-state', 'closed');
  });

  it('ramo com descendente ativo NASCE aberto — e fica `is-open`, não `is-active`', () => {
    renderNav(
      groups([
        {
          items: [
            { title: 'Início', href: '/home', icon: ICON },
            {
              title: 'Atividade Fiscal',
              icon: ICON,
              children: [
                { title: 'Parametrização', href: '/fiscal/parametros' },
                { title: 'Execução', href: '/fiscal/execucao', active: true },
              ],
            },
          ],
        },
      ]),
    );

    const ramo = screen.getByRole('button', { name: /Atividade Fiscal/ });
    expect(ramo).toHaveAttribute('aria-expanded', 'true');
    // O pai NÃO é a rota atual: cinza (`is-open`), nunca verde (`is-active`).
    expect(ramo).toHaveClass('is-open');
    expect(ramo).not.toHaveClass('is-active');
  });

  it('a rota atual se anuncia com `aria-current="page"`', () => {
    renderNav(
      groups([
        {
          items: [
            { title: 'Início', href: '/home', icon: ICON, active: true },
            { title: 'Gráficos', href: '/charts', icon: ICON },
          ],
        },
      ]),
    );

    const atual = screen.getByRole('link', { name: /Início/ });
    expect(atual).toHaveAttribute('aria-current', 'page');
    expect(atual).toHaveClass('is-active');
    expect(screen.getByRole('link', { name: /Gráficos/ })).not.toHaveAttribute(
      'aria-current',
    );
  });
});

describe('subheader', () => {
  it('colapsa o grupo inteiro', async () => {
    const user = userEvent.setup();
    renderNav();

    const rotulo = screen.getByRole('button', { name: 'Visão geral' });
    expect(rotulo).toHaveAttribute('aria-expanded', 'true');

    const corpo = document.getElementById(String(rotulo.getAttribute('aria-controls')));
    expect(corpo).toHaveAttribute('data-state', 'open');

    await user.click(rotulo);
    expect(rotulo).toHaveAttribute('aria-expanded', 'false');
    expect(corpo).toHaveAttribute('data-state', 'closed');
  });

  it('grupo com `defaultCollapsed` começa fechado', () => {
    renderNav(groups([{ defaultCollapsed: true }]));
    expect(screen.getByRole('button', { name: 'Visão geral' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

describe('item desabilitado', () => {
  it('não dispara o clique e se anuncia como desabilitado', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderNav([
      {
        subheader: 'Visão geral',
        items: [
          { title: 'Usuários', href: '/users', icon: ICON, disabled: true, onClick },
        ],
      },
    ]);

    const item = screen.getByRole('link', { name: /Usuários/ });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    // Fora da ordem de tabulação: alcançável por Tab mas inerte seria pior que
    // não estar lá — o teclado ficaria preso num item que não faz nada.
    expect(item).toHaveAttribute('tabindex', '-1');

    await user.click(item);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('forma mini', () => {
  it('esconde os subheaders e mantém o rótulo curto do item', () => {
    renderWithProviders(
      <NavSection groups={groups()} isMini aria-label="Navegação principal" />,
    );

    expect(screen.queryByRole('button', { name: 'Visão geral' })).not.toBeInTheDocument();
    expect(screen.queryByText('Visão geral')).not.toBeInTheDocument();

    // O bloco de 56px continua nomeando o item — recolhida a nav é uma coluna
    // de ícone + rótulo de 8,75px, não uma faixa de ícones mudos.
    const item = screen.getByRole('link', { name: 'Início' });
    expect(item).toHaveClass('app-nav__item--root');
    expect(screen.getByRole('navigation')).toHaveClass('app-nav--mini');
  });

  it('a legenda vira ícone: some da 2ª linha', () => {
    renderWithProviders(
      <NavSection groups={groups()} isMini aria-label="Navegação principal" />,
    );
    expect(screen.queryByText('Painel de entrada')).not.toBeInTheDocument();
  });

  it('filhos não expandem para baixo — não há bloco aninhado na faixa', () => {
    renderWithProviders(
      <NavSection groups={groups()} isMini aria-label="Navegação principal" />,
    );
    expect(screen.queryByRole('link', { name: 'Execução' })).not.toBeInTheDocument();
    expect(document.querySelector('.app-nav__children')).toBeNull();
  });

  it('o ramo abre um painel FLUTUANTE, fora da faixa que o recortaria', () => {
    renderWithProviders(
      <NavSection groups={groups()} isMini aria-label="Navegação principal" />,
    );

    const ramo = screen.getByRole('button', { name: /Atividade Fiscal/ });
    expect(ramo).toHaveAttribute('aria-expanded', 'false');

    /*
     * `fireEvent.click` e não `userEvent.click`: aqui interessa o caminho SEM
     * ponteiro — é exatamente o que o Enter num `<button>` produz. Na origem o
     * painel abre só no hover (`usePopoverHover`), o que deixa os filhos
     * inalcançáveis para quem navega por teclado com a barra recolhida; abrir
     * também no clique é a correção.
     */
    fireEvent.click(ramo);
    expect(ramo).toHaveAttribute('aria-expanded', 'true');

    // Mesmo contrato da forma expandida: o aninhamento é o mesmo, só muda o
    // desenho — então o painel também é um `group` com o nome do pai.
    const painel = screen.getByRole('group', { name: 'Atividade Fiscal' });
    expect(painel).toHaveClass('app-nav__dropdown-paper');
    expect(ramo).toHaveAttribute('aria-controls', painel.id);
    // Renderizado em portal: dentro do `<nav>` de 88px, a área rolável
    // (`overflow-x: hidden`) cortaria o painel na borda.
    expect(painel?.closest('nav')).toBeNull();
    expect(screen.getByRole('link', { name: 'Execução' })).toHaveClass(
      'app-nav__item--sub',
    );
  });
});
