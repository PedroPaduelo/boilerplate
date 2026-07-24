/**
 * Visão geral — a nova tela inicial (`/home`).
 *
 * Antes a raiz redirecionava direto para `/dashboards`: quem entrava caía numa
 * lista (às vezes vazia) sem contexto do que a plataforma faz nem do que fazer
 * a seguir. Esta tela responde três perguntas em uma olhada:
 *   1. Como está meu ambiente?  → KPIs
 *   2. O que eu faço agora?     → ações rápidas / primeiros passos
 *   3. Onde eu estava?          → artefatos recentes
 *
 * Tudo é derivado de dados REAIS (listagens já existentes); nada é mockado.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  CheckCircle2,
  Circle,
  Database,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
} from 'lucide-react';

import { Button, Section, SectionHeader, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/features/auth/store';
import { hasPermission } from '@/shared/lib/rbac';
import { cn, formatDate } from '@/shared/lib/utils';

import { useCharts } from '@/features/charts/hooks';
import { useConnections } from '@/features/connections/hooks';
import { useCreateDashboard, useDashboards } from '@/features/dashboards/hooks';

/** Saudação por faixa de horário — dá um tom humano sem ser infantil. */
function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

interface RecentItem {
  id: string;
  title: string;
  updatedAt: string;
  status: string;
}

/**
 * Célula de estatística da faixa superior. Número grande em fonte tabular
 * (alinha entre colunas), rótulo discreto e a linha inteira clicável para a
 * listagem correspondente — o número é um atalho, não só um enfeite.
 */
function Stat({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: 'default' | 'warning';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        <span className="mt-1.5 truncate text-xs text-muted-foreground">
          {label}
          {hint ? (
            <>
              {' · '}
              <span className={tone === 'warning' ? 'text-chart-3' : undefined}>
                {hint}
              </span>
            </>
          ) : null}
        </span>
      </span>
      <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/** Lista compacta de artefatos recentes (dashboards ou gráficos). */
function RecentList({
  items,
  isLoading,
  emptyLabel,
  onOpen,
}: {
  items: RecentItem[];
  isLoading: boolean;
  emptyLabel: string;
  onOpen: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground">
                Atualizado em {formatDate(item.updatedAt)}
              </span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                item.status === 'PUBLISHED'
                  ? 'bg-chart-2/10 text-chart-2'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {item.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Um passo do checklist de primeiros passos. */
function Step({
  done,
  title,
  description,
  action,
}: {
  done: boolean;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
      {done ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-chart-2" />
      ) : (
        <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/50" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="space-y-1">
          <p
            className={cn(
              'text-sm font-medium',
              done ? 'text-muted-foreground line-through' : 'text-foreground',
            )}
          >
            {title}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {!done && action ? <div>{action}</div> : null}
      </div>
    </li>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const canManageArtifacts = hasPermission(role, 'artifacts:manage');
  const canUseConnections = hasPermission(role, 'connections:use');
  const canManageConnections = hasPermission(role, 'connections:manage');

  // Listas curtas: a Home mostra os 5 mais recentes; o `total` de cada
  // resposta alimenta os KPIs sem precisar de endpoint de contagem.
  const dashboardsQuery = useDashboards({ page: 1, pageSize: 5 });
  const chartsQuery = useCharts({ page: 1, pageSize: 5 });
  const connectionsQuery = useConnections(
    { pageSize: 100 },
    { enabled: canUseConnections },
  );

  const create = useCreateDashboard();
  const handleCreateDashboard = () =>
    create.mutate(undefined, {
      onSuccess: (created) => navigate(`/dashboards/${created.id}/edit`),
    });

  const recentDashboards = useMemo(
    () =>
      [...(dashboardsQuery.data?.dashboards ?? [])]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [dashboardsQuery.data],
  );

  const recentCharts = useMemo(
    () =>
      [...(chartsQuery.data?.charts ?? [])]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    [chartsQuery.data],
  );

  const totalDashboards = dashboardsQuery.data?.total ?? 0;
  const totalCharts = chartsQuery.data?.total ?? 0;
  const connections = connectionsQuery.data?.connections ?? [];
  const totalConnections = connections.length;
  const healthyConnections = connections.filter((c) =>
    ['OK', 'ACTIVE', 'CONNECTED'].includes((c.status ?? '').toUpperCase()),
  ).length;

  const isLoadingCounts = dashboardsQuery.isLoading || chartsQuery.isLoading;

  // Conta "nova" = ainda não produziu nada. Nesse caso os primeiros passos
  // substituem os recentes (que estariam vazios de qualquer forma).
  const isFirstRun = !isLoadingCounts && totalDashboards === 0 && totalCharts === 0;

  return (
    <div className="flex flex-col gap-8">
      {/* ---------------------------------------------------------------- */}
      {/* Cabeçalho + ações rápidas                                        */}
      {/* ---------------------------------------------------------------- */}
      <Section index={0}>
        <SectionHeader
          className="mb-0"
          eyebrow="Visão geral"
          title={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'que bom te ver'}`}
          description="Seu ponto de partida: o estado do ambiente, o que ficou pendente e um atalho para perguntar aos seus dados."
          actions={
            canManageArtifacts ? (
              <>
                <Button onClick={() => navigate('/chat')} className="gap-2">
                  <Sparkles className="size-4" />
                  Perguntar ao agente
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCreateDashboard}
                  disabled={create.isPending}
                  className="gap-2"
                >
                  {create.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Novo dashboard
                </Button>
              </>
            ) : undefined
          }
        />
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* KPIs do ambiente                                                  */}
      {/* ---------------------------------------------------------------- */}
      <Section index={1}>
        {isLoadingCounts ? (
          <Skeleton className="h-[5.5rem] w-full rounded-xl" />
        ) : (
          /* Faixa de estatísticas em vez de três cards grandes e coloridos.
             A grade de "stat cards, cada um com seu ícone colorido" é o
             padrão que datou as dashboards: cor vira decoração e o olho
             perde a referência. Aqui é UM bloco, divisores hairline, um
             único accent — e a cor fica reservada para status. */
          <div className="grid grid-cols-1 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Stat
              label="Dashboards"
              value={String(totalDashboards)}
              icon={LayoutDashboard}
              onClick={() => navigate('/dashboards')}
            />
            <Stat
              label="Gráficos"
              value={String(totalCharts)}
              icon={BarChart3}
              onClick={() => navigate('/charts')}
            />
            {canUseConnections ? (
              <Stat
                label="Conexões"
                value={
                  connectionsQuery.isLoading
                    ? '—'
                    : `${healthyConnections}/${totalConnections}`
                }
                icon={Database}
                hint={
                  totalConnections === 0
                    ? 'nenhuma cadastrada'
                    : `${healthyConnections === totalConnections ? 'todas' : healthyConnections} respondendo`
                }
                tone={
                  totalConnections > 0 && healthyConnections === 0 ? 'warning' : 'default'
                }
                onClick={() => navigate('/connections')}
              />
            ) : null}
          </div>
        )}
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* Primeiros passos (conta nova) OU artefatos recentes               */}
      {/* ---------------------------------------------------------------- */}
      {isFirstRun ? (
        <Section index={2}>
          <SectionHeader
            eyebrow="Comece por aqui"
            title="Três passos para o primeiro insight"
            description="Do banco conectado à resposta publicada — leva poucos minutos."
          />
          <ol className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Step
              done={totalConnections > 0}
              title="1. Conecte um banco"
              description="Aponte o auditorIA para um PostgreSQL. Ele lê o schema sozinho — você não precisa mapear tabela por tabela."
              action={
                canManageConnections ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/connections')}
                    className="gap-2"
                  >
                    <Database className="size-4" />
                    Conectar banco
                  </Button>
                ) : undefined
              }
            />
            <Step
              done={totalCharts > 0}
              title="2. Pergunte em português"
              description="“Quais lançamentos fogem do padrão neste trimestre?” O agente escreve o SQL, executa e mostra o resultado já em gráfico."
              action={
                canManageArtifacts ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/chat')}
                    className="gap-2"
                  >
                    <MessageSquare className="size-4" />
                    Abrir o agente
                  </Button>
                ) : undefined
              }
            />
            <Step
              done={totalDashboards > 0}
              title="3. Monte e publique"
              description="Junte os gráficos que importam em um dashboard e compartilhe por link público ou com o departamento."
              action={
                canManageArtifacts ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCreateDashboard}
                    disabled={create.isPending}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Criar dashboard
                  </Button>
                ) : undefined
              }
            />
          </ol>
        </Section>
      ) : (
        <Section index={2}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <LayoutDashboard className="size-4 text-muted-foreground" />
                  Dashboards recentes
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboards')}
                  className="gap-1 text-xs"
                >
                  Ver todos
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
              <RecentList
                items={recentDashboards}
                isLoading={dashboardsQuery.isLoading}
                emptyLabel="Nenhum dashboard ainda."
                onOpen={(id) => navigate(`/dashboards/${id}`)}
              />
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  Gráficos recentes
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/charts')}
                  className="gap-1 text-xs"
                >
                  Ver todos
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
              <RecentList
                items={recentCharts}
                isLoading={chartsQuery.isLoading}
                emptyLabel="Nenhum gráfico ainda."
                onOpen={(id) => navigate(`/charts/${id}`)}
              />
            </div>
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Atalho para o catálogo                                            */}
      {/* ---------------------------------------------------------------- */}
      <Section index={3}>
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-card/40 p-5 text-left transition hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Blocks className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-foreground">
              Explore o catálogo de componentes
            </span>
            <span className="text-xs text-muted-foreground">
              Veja com dados de exemplo todos os blocos que você — e o agente — podem usar
              para montar um painel.
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Section>
    </div>
  );
}
