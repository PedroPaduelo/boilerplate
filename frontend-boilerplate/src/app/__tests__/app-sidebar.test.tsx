/**
 * Contrato da NAVEGAÇÃO PRINCIPAL.
 *
 * O que este arquivo trava (e por que cada coisa importa):
 *
 *  1. **Os grupos existem e têm rótulo.** O menu deixou de ser uma lista corrida
 *     e passou a ser "Visão geral / Dados / Gerenciamento" — se o rótulo sumir,
 *     a lista volta a ser um monte de itens sem hierarquia e ninguém percebe no
 *     diff.
 *  2. **A rota atual acende — e só ela.** O critério é por SEGMENTO: o antigo
 *     `startsWith` acendia "Gráficos" em `/chartsomething`.
 *  3. **RBAC esconde item E grupo.** Item invisível é metade do trabalho: o
 *     grupo que ficou vazio não pode deixar o rótulo órfão na tela.
 *  4. **O recolher é controlado por quem monta** (o estado persiste no shell),
 *     então o botão só pode avisar — nunca decidir sozinho.
 *  5. **O rodapé sobrevive aos 88px**: o nome do usuário sai da tela, mas
 *     continua sendo o nome acessível do controle.
 *
 * jsdom não calcula layout — nada aqui mede pixel. O que se verifica é o
 * contrato observável: papéis, nomes acessíveis e `aria-current`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SideNavRenderContext } from '@astryxdesign/core/SideNav';
import { renderWithProviders } from '@/test/render';
import type { Role } from '@/shared/lib/rbac';
import { useAuthStore } from '@/features/auth/store';
import { AppSidebar } from '../app-sidebar';

function setUser(role: Role) {
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'ana@auditoria.com',
      name: 'Ana Souza',
      role,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    token: 'tok',
    isAuthenticated: true,
    isHydrated: true,
  });
}

interface MontarOptions {
  role?: Role;
  route?: string;
  isCollapsed?: boolean;
  /** Monta como o `AppShell` monta no celular: dentro da gaveta. */
  isDrawer?: boolean;
}

function montar({
  role = 'ADMIN',
  route = '/dashboards',
  isCollapsed = false,
  isDrawer = false,
}: MontarOptions = {}) {
  setUser(role);
  const onCollapsedChange = vi.fn();
  const sidebar = (
    <AppSidebar isCollapsed={isCollapsed} onCollapsedChange={onCollapsedChange} />
  );
  const result = renderWithProviders(
    isDrawer ? (
      // É o próprio design system que avisa em qual caixa a navegação está
      // (`SideNavRenderContext`); no app quem provê é o `AppShell`.
      <SideNavRenderContext.Provider value="drawer-content">
        {sidebar}
      </SideNavRenderContext.Provider>
    ) : (
      sidebar
    ),
    { route },
  );
  return { ...result, onCollapsedChange };
}

// Zera a sessão entre casos: papel vazado de um teste para o outro faria o
// menu mudar de tamanho sem que o caso peça — e a falha apareceria no vizinho.
beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

describe('AppSidebar — grupos', () => {
  it('renderiza os três grupos com o rótulo visível e os itens dentro', () => {
    montar({ role: 'ADMIN' });

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();

    // O rótulo é um BOTÃO (colapsa o grupo) — o texto vai em caixa alta pelo
    // CSS, então o conteúdo do DOM continua legível como está escrito.
    for (const rotulo of ['Visão geral', 'Dados', 'Gerenciamento']) {
      expect(screen.getByRole('button', { name: rotulo })).toBeVisible();
    }

    for (const item of [
      'Início',
      'Dashboards',
      'Gráficos',
      'Conexões',
      'Catálogo',
      'Chat',
      'Usuários',
    ]) {
      expect(screen.getByRole('link', { name: item })).toBeVisible();
    }
  });

  it('cada item leva para a sua rota (é link de verdade, não botão)', () => {
    montar({ role: 'ADMIN' });

    expect(screen.getByRole('link', { name: 'Conexões' })).toHaveAttribute(
      'href',
      '/connections',
    );
    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute(
      'href',
      '/users',
    );
  });
});

describe('AppSidebar — rota ativa', () => {
  it('marca a rota atual com aria-current="page" e deixa as outras em paz', () => {
    montar({ role: 'ADMIN', route: '/charts' });

    expect(screen.getByRole('link', { name: 'Gráficos' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Dashboards' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('sub-rota mantém o item aceso (`/dashboards/42` → Dashboards)', () => {
    montar({ role: 'ADMIN', route: '/dashboards/42' });

    expect(screen.getByRole('link', { name: 'Dashboards' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('prefixo de STRING não acende: `/chartsomething` não é `/charts`', () => {
    montar({ role: 'ADMIN', route: '/chartsomething' });

    expect(screen.getByRole('link', { name: 'Gráficos' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});

describe('AppSidebar — RBAC', () => {
  it('VIEWER não vê "Usuários" (papel ADMIN) nem "Chat"/"Conexões"', () => {
    montar({ role: 'VIEWER' });

    expect(screen.queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Chat' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Conexões' })).not.toBeInTheDocument();

    // …e o que ele PODE ver continua lá.
    expect(screen.getByRole('link', { name: 'Dashboards' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Catálogo' })).toBeVisible();
  });

  it('grupo que perdeu todos os itens NÃO deixa rótulo órfão na tela', () => {
    montar({ role: 'VIEWER' });

    // "Gerenciamento" = Chat + Usuários; nenhum dos dois sobrevive ao VIEWER.
    expect(
      screen.queryByRole('button', { name: 'Gerenciamento' }),
    ).not.toBeInTheDocument();
    // "Dados" fica só com Catálogo — grupo com item continua rotulado.
    expect(screen.getByRole('button', { name: 'Dados' })).toBeVisible();
  });

  it('ANALYST vê "Chat" mas não "Usuários"', () => {
    montar({ role: 'ANALYST' });

    expect(screen.getByRole('link', { name: 'Chat' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument();
  });
});

describe('AppSidebar — recolher', () => {
  it('o botão avisa quem controla o estado, em vez de decidir sozinho', async () => {
    const user = userEvent.setup();
    const { onCollapsedChange } = montar({ role: 'ADMIN' });

    await user.click(
      screen.getByRole('button', { name: 'Recolher navegação principal' }),
    );

    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it('recolhida, o botão passa a oferecer o caminho de volta', () => {
    montar({ role: 'ADMIN', isCollapsed: true });

    expect(
      screen.getByRole('button', { name: 'Expandir navegação principal' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Recolher navegação principal' }),
    ).not.toBeInTheDocument();
  });
});

describe('AppSidebar — rodapé da conta', () => {
  it('expandida: o nome do usuário aparece no gatilho', () => {
    montar({ role: 'ADMIN' });

    expect(screen.getByRole('button', { name: /Ana Souza/ })).toBeVisible();
  });

  it('recolhida (88px): só o avatar, mas o nome continua sendo o nome acessível', () => {
    montar({ role: 'ADMIN', isCollapsed: true });

    const gatilho = screen.getByRole('button', { name: /Ana Souza/ });
    expect(gatilho).toBeVisible();
    expect(gatilho).toHaveAttribute('aria-haspopup', 'menu');
    // O texto sai da tela; o nome sobrevive como rótulo do controle.
    expect(gatilho).not.toHaveTextContent('Ana Souza');
  });

  /*
   * O caminho de SAIR do sistema no celular.
   *
   * A gaveta leva as mesmas zonas da coluna — some a caixa, não o conteúdo.
   * Este caso existe porque o inverso já aconteceu: com o rodapé fora da
   * gaveta, o menu da conta desaparecia no celular e não havia como encerrar a
   * sessão. Nada disso quebra em tempo de compilação; só some da tela.
   */
  it('na gaveta do celular o menu da conta continua no rodapé', () => {
    montar({ role: 'ADMIN', isDrawer: true });

    expect(screen.getByRole('button', { name: /Ana Souza/ })).toBeInTheDocument();
  });

  it('a forma compacta é da COLUNA: na gaveta o nome volta, mesmo recolhido', () => {
    // `isCollapsed` vem persistido do desktop; numa gaveta de 288px ele não
    // significa nada — a barra o ignora e o rodapé tem de ignorar junto.
    montar({ role: 'ADMIN', isCollapsed: true, isDrawer: true });

    expect(screen.getByRole('button', { name: /Ana Souza/ })).toHaveTextContent(
      'Ana Souza',
    );
  });
});
