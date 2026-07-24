/**
 * Command Palette (⌘K / Ctrl+K).
 *
 * Por que existe: o público do auditorIA é técnico (analistas, auditores) e
 * trabalha em sessões longas. Navegar por cliques na sidebar para achar um
 * dashboard entre dezenas é lento. A paleta dá acesso a QUALQUER lugar do
 * produto — navegação, artefatos por nome e ações — sem tirar as mãos do
 * teclado. É o padrão consagrado por Linear, Raycast e Vercel.
 *
 * Tudo o que aparece aqui vem das listagens já carregadas pelo TanStack Query
 * (dados de "referência", com staleTime longo), então abrir a paleta não
 * dispara rede na maioria das vezes.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Database,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Users as UsersIcon,
} from 'lucide-react';

import { useTheme } from '@/components/theme/use-theme';
import { useAuthStore } from '@/features/auth/store';
import { useCharts } from '@/features/charts/hooks';
import { useConnections } from '@/features/connections/hooks';
import { useCreateDashboard, useDashboards } from '@/features/dashboards/hooks';
import { hasAnyRole, hasPermission } from '@/shared/lib/rbac';
import { cn } from '@/shared/lib/utils';

/** Limite de itens por seção — a paleta é para navegar rápido, não paginar. */
const MAX_PER_SECTION = 6;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const role = useAuthStore((s) => s.user?.role);
  const canManage = hasPermission(role, 'artifacts:manage');
  const canUseConnections = hasPermission(role, 'connections:use');
  const isAdmin = hasAnyRole(role, ['ADMIN']);

  // ⌘K / Ctrl+K abre; a própria paleta trata Esc para fechar.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Só busca artefatos quando a paleta está aberta — nada de rede à toa.
  const { data: dashboardsData } = useDashboards({ page: 1, pageSize: 50 });
  const { data: chartsData } = useCharts({ page: 1, pageSize: 50 });
  const { data: connectionsData } = useConnections(
    { pageSize: 50 },
    { enabled: canUseConnections },
  );

  const create = useCreateDashboard();

  /** Fecha a paleta e limpa a busca antes de executar a ação. */
  const run = useCallback((action: () => void) => {
    setOpen(false);
    setSearch('');
    action();
  }, []);

  const dashboards = useMemo(
    () => (dashboardsData?.dashboards ?? []).slice(0, MAX_PER_SECTION),
    [dashboardsData],
  );
  const charts = useMemo(
    () => (chartsData?.charts ?? []).slice(0, MAX_PER_SECTION),
    [chartsData],
  );
  const connections = useMemo(
    () => (connectionsData?.connections ?? []).slice(0, MAX_PER_SECTION),
    [connectionsData],
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Paleta de comandos"
      shouldFilter
      // `contentClassName` = Dialog.Content do Radix (é ele que recebe
      // data-state e, portanto, as animações e o posicionamento).
      contentClassName={cn(
        'fixed left-1/2 top-[18%] z-50 w-[92vw] max-w-xl -translate-x-1/2',
        'overflow-hidden rounded-xl border border-border bg-popover shadow-2xl',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        'duration-150',
      )}
      overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0"
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Buscar dashboards, gráficos, conexões ou ações…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
          ESC
        </kbd>
      </div>

      <Command.List className="max-h-[min(60vh,24rem)] overflow-y-auto overscroll-contain p-2">
        <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
          Nada encontrado para “{search}”.
        </Command.Empty>

        {/* ---------------------------------------------------------------- */}
        <Group heading="Ações">
          {canManage && (
            <Item
              icon={Sparkles}
              value="Perguntar ao agente chat IA pergunta consulta"
              onSelect={() => run(() => navigate('/chat'))}
            >
              Perguntar ao agente
            </Item>
          )}
          {canManage && (
            <Item
              icon={Plus}
              onSelect={() =>
                run(() =>
                  create.mutate(undefined, {
                    onSuccess: (d) => navigate(`/dashboards/${d.id}/edit`),
                  }),
                )
              }
            >
              Criar novo dashboard
            </Item>
          )}
          <Item
            icon={resolvedTheme === 'dark' ? Sun : Moon}
            onSelect={() =>
              run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))
            }
          >
            {resolvedTheme === 'dark'
              ? 'Mudar para tema claro'
              : 'Mudar para tema escuro'}
          </Item>
        </Group>

        {/* ---------------------------------------------------------------- */}
        <Group heading="Ir para">
          <Item icon={LayoutDashboard} onSelect={() => run(() => navigate('/home'))}>
            Visão geral
          </Item>
          <Item
            icon={LayoutDashboard}
            onSelect={() => run(() => navigate('/dashboards'))}
          >
            Dashboards
          </Item>
          <Item icon={BarChart3} onSelect={() => run(() => navigate('/charts'))}>
            Gráficos
          </Item>
          <Item icon={Blocks} onSelect={() => run(() => navigate('/catalog'))}>
            Catálogo de componentes
          </Item>
          {canUseConnections && (
            <Item icon={Database} onSelect={() => run(() => navigate('/connections'))}>
              Conexões
            </Item>
          )}
          {isAdmin && (
            <Item icon={UsersIcon} onSelect={() => run(() => navigate('/users'))}>
              Usuários
            </Item>
          )}
        </Group>

        {/* ---------------------------------------------------------------- */}
        {dashboards.length > 0 && (
          <Group heading="Dashboards">
            {dashboards.map((d) => (
              <Item
                key={d.id}
                icon={LayoutDashboard}
                value={d.title}
                onSelect={() => run(() => navigate(`/dashboards/${d.id}`))}
                shortcut={d.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
              >
                {d.title}
              </Item>
            ))}
          </Group>
        )}

        {charts.length > 0 && (
          <Group heading="Gráficos">
            {charts.map((c) => (
              <Item
                key={c.id}
                icon={BarChart3}
                value={c.title}
                onSelect={() => run(() => navigate(`/charts/${c.id}`))}
                shortcut={c.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
              >
                {c.title}
              </Item>
            ))}
          </Group>
        )}

        {connections.length > 0 && (
          <Group heading="Conexões">
            {connections.map((c) => (
              <Item
                key={c.id}
                icon={Database}
                value={c.name}
                onSelect={() => run(() => navigate(`/connections/${c.id}`))}
                shortcut={c.database}
              >
                {c.name}
              </Item>
            ))}
          </Group>
        )}
      </Command.List>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          navegar
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          abrir
        </span>
      </div>
    </Command.Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Primitivos de apresentação                                                  */
/* -------------------------------------------------------------------------- */

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className={cn(
        'px-1 py-1',
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
        '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold',
        '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest',
        '[&_[cmdk-group-heading]]:text-muted-foreground',
      )}
    >
      {children}
    </Command.Group>
  );
}

function Item({
  icon: Icon,
  children,
  onSelect,
  shortcut,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSelect: () => void;
  shortcut?: string;
  /**
   * Texto usado no RANKING da busca. Sem isto o cmdk pontua pelo textContent
   * inteiro do item — que inclui o rótulo lateral ("Publicado", nome do banco)
   * e polui o score: buscar "demons" trazia "Catálogo de componentes" à frente
   * de "Painel de Demonstração".
   */
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm',
        'text-foreground/90 transition-colors',
        // cmdk marca o item ativo (teclado ou mouse) com data-selected
        'data-[selected=true]:bg-accent data-[selected=true]:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground group-data-[selected=true]:text-primary" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
          {shortcut}
        </span>
      ) : null}
      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px] leading-none">
      {children}
    </kbd>
  );
}
