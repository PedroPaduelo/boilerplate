import { useLocation } from 'react-router-dom';
import { useSideNavRenderMode } from '@astryxdesign/core/SideNav';
import { NavSidebar, type NavGroup } from '@/shared/ui/nav-section';
import { useAuthStore } from '@/features/auth/store';
import { visibleNavGroups } from './nav-items';
import { UserMenu } from './user-menu';

interface AppSidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
}

/**
 * Rota ativa = a própria rota OU uma descendente dela — comparada por
 * SEGMENTO, não por prefixo de string.
 *
 * `pathname.startsWith(href)`, que era o critério anterior, acende "Gráficos"
 * em `/chartsomething` e "Chat" em `/chatbot`: `'/chartsomething'.startsWith(
 * '/charts')` é `true`. O menu apontando para a tela errada é o tipo de defeito
 * que ninguém reporta — a pessoa só desconfia da navegação. Exigir a barra
 * (`/charts/`) ou a igualdade resolve, e mantém o acender em sub-rotas
 * (`/dashboards/42` continua marcando "Dashboards").
 */
function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegação principal do app autenticado.
 *
 * Usa `@/shared/ui/nav-section` (a réplica da barra do AuditorIA) e não o
 * `SideNav` do Astryx: o DOM do design system não tem legenda de 2ª linha,
 * cotovelo de aninhamento nem o bloco de 56px com rótulo de 8,75px da forma
 * recolhida, e o CSS não alcança o StyleX para corrigir isso — a medição está
 * em `docs/design-system/sidebar/CONTRATO.md` §1.
 *
 * O que este arquivo faz é só TRADUZIR: pega os grupos de `nav-items.ts` (dados
 * + RBAC), calcula `active` (é ele quem conhece o roteador — a nav não importa
 * `useLocation` de propósito) e monta o `NavGroup[]` de apresentação. Estilo,
 * medidas e comportamento são todos de lá.
 *
 * Sem `header`: quem carrega a identidade do produto é o `TopNavHeading` do
 * shell. Repetir o nome aqui seria branding duplicado — anti-pattern explícito
 * do DS.
 */
export function AppSidebar({ isCollapsed, onCollapsedChange }: AppSidebarProps) {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role);

  /*
   * A forma mini é da COLUNA. Na gaveta do mobile ela não existe — a barra
   * ignora `isCollapsed` ali (`nav-sidebar.tsx:38-40`), e o rodapé precisa
   * seguir a mesma regra: sem isto, quem recolheu a barra no desktop abriria o
   * app no celular e veria um avatar solto numa gaveta de 288px, onde o nome
   * cabe folgado. Lemos a MESMA fonte de verdade que a barra lê.
   */
  const isDrawer = useSideNavRenderMode() !== 'default';

  const groups: NavGroup[] = visibleNavGroups(role).map((group) => ({
    subheader: group.subheader,
    items: group.items.map(({ href, label, icon: Icon }) => ({
      key: href,
      title: label,
      href,
      icon: <Icon />,
      active: isRouteActive(location.pathname, href),
    })),
  }));

  return (
    <NavSidebar
      groups={groups}
      aria-label="Navegação principal"
      isCollapsed={isCollapsed}
      onCollapsedChange={onCollapsedChange}
      /*
       * "…principal" no rótulo do botão porque no visualizador de dashboard há
       * DUAS barras recolhíveis na mesma tela (esta e a de abas do dashboard).
       * Dois botões chamados "Recolher navegação" deixariam o leitor de tela
       * sem como distingui-los — e é justamente por voz que a diferença some.
       */
      toggleLabel={
        isCollapsed ? 'Expandir navegação principal' : 'Recolher navegação principal'
      }
      /* Recolhida, o rodapé cabe em 88px só como avatar (o nome continua sendo
         o nome acessível do gatilho) — ver `user-menu.tsx`. Margem e linha de
         separação são da barra; aqui só se escolhe o conteúdo. */
      footer={<UserMenu isCompact={!isDrawer && isCollapsed} />}
    />
  );
}
