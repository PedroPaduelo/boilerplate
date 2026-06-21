import * as React from "react"
import {
  DollarSign,
  Users,
  Activity,
  CreditCard,
  LayoutDashboard,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  Zap,
  Flame,
  TrendingUp,
  CalendarDays,
} from "lucide-react"

import {
  Button,
  Badge,
  AnimatedTooltip,
  GitHubContributions,
  TableFluid,
  TableFluidHeader,
  TableFluidBody,
  TableFluidRow,
  TableFluidHead,
  TableFluidCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tree,
  TOCMinimap,
  KpiCard,
  StatTile,
  ActivityFeed,
  DashboardSidebarNav,
  DashboardTopbar,
  UpgradeCard,
  Section,
  SectionHeader,
} from "@/components/ui"
import type { ContributionDay } from "@/components/ui/github-contributions"
import type { AnimatedTooltipItem } from "@/components/ui/animated-tooltip-types"
import type { DashboardSidebarNavItem } from "@/components/ui/dashboard-sidebar-nav"

/* -------------------------------------------------------------------------- */
/*                                   dados                                     */
/* -------------------------------------------------------------------------- */

type Kpi = {
  label: string
  value: number
  prefix?: string
  suffix?: string
  delta: number
  icon: React.ComponentType<{ className?: string }>
}

const KPIS: Kpi[] = [
  {
    label: "Receita mensal",
    value: 48290,
    prefix: "$",
    delta: 12.4,
    icon: DollarSign,
  },
  {
    label: "Usuários ativos",
    value: 12840,
    delta: 8.1,
    icon: Users,
  },
  {
    label: "Taxa de conversão",
    value: 4,
    suffix: ".7%",
    delta: 1.9,
    icon: Activity,
  },
  {
    label: "Assinaturas",
    value: 1320,
    delta: -2.3,
    icon: CreditCard,
  },
]

type CustomerRow = {
  id: string
  name: string
  email: string
  plan: "Free" | "Pro" | "Enterprise"
  status: "Ativo" | "Pendente" | "Cancelado"
  mrr: number
  seed: string
}

const CUSTOMERS: CustomerRow[] = [
  {
    id: "INV-1042",
    name: "Aurora Vale",
    email: "aurora@northwind.io",
    plan: "Enterprise",
    status: "Ativo",
    mrr: 1200,
    seed: "aurora",
  },
  {
    id: "INV-1043",
    name: "Caleb Monroe",
    email: "caleb@monroe.dev",
    plan: "Pro",
    status: "Ativo",
    mrr: 290,
    seed: "caleb",
  },
  {
    id: "INV-1044",
    name: "Dahlia Reyes",
    email: "dahlia@reyes.studio",
    plan: "Pro",
    status: "Pendente",
    mrr: 290,
    seed: "dahlia",
  },
  {
    id: "INV-1045",
    name: "Elias Brandt",
    email: "elias@brandt.co",
    plan: "Free",
    status: "Cancelado",
    mrr: 0,
    seed: "elias",
  },
  {
    id: "INV-1046",
    name: "Mira Sandoval",
    email: "mira@sandoval.app",
    plan: "Enterprise",
    status: "Ativo",
    mrr: 1500,
    seed: "mira",
  },
]

type ChannelRow = {
  channel: string
  visitors: number
  signups: number
  rate: string
}

const CHANNELS: ChannelRow[] = [
  { channel: "Busca orgânica", visitors: 18420, signups: 842, rate: "4.6%" },
  { channel: "Indicação", visitors: 9210, signups: 612, rate: "6.6%" },
  { channel: "Social", visitors: 7640, signups: 318, rate: "4.2%" },
  { channel: "E-mail", visitors: 4120, signups: 286, rate: "6.9%" },
  { channel: "Direto", visitors: 3380, signups: 121, rate: "3.6%" },
]

/* Heatmap de atividade — gerado de forma determinística (sem aleatoriedade). */
function buildContributions(weeks: number): ContributionDay[] {
  const days: ContributionDay[] = []
  const total = weeks * 7
  const start = new Date("2025-01-06T00:00:00")
  for (let i = 0; i < total; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const iso = date.toISOString().slice(0, 10)
    // padrão suave: ondas semanais + tendência crescente, fins de semana mais fracos
    const dow = date.getDay()
    const weekend = dow === 0 || dow === 6
    const base = Math.round(
      (Math.sin(i / 5) + 1) * 4 + (i / total) * 6 + (weekend ? -2 : 1)
    )
    days.push({ date: iso, count: Math.max(0, base) })
  }
  return days
}

const CONTRIBUTIONS = buildContributions(30)

/* Resumos rápidos exibidos acima do heatmap (números animados). */
type ActivityStat = {
  label: string
  value: number
  prefix?: string
  suffix?: string
  icon: React.ComponentType<{ className?: string }>
}

const ACTIVITY_STATS: ActivityStat[] = [
  { label: "Eventos hoje", value: 348, icon: Zap },
  { label: "Sequência ativa", value: 14, suffix: " dias", icon: Flame },
  { label: "Pico semanal", value: 1290, icon: TrendingUp },
  { label: "Total no período", value: 18640, icon: CalendarDays },
]

/* Membros ativos agora — exibidos com AnimatedTooltip no header da seção. */
const ACTIVE_MEMBERS: AnimatedTooltipItem[] = [
  {
    id: 1,
    name: "Aurora Vale",
    designation: "Produto",
    image: "https://picsum.photos/seed/aurora/64/64",
  },
  {
    id: 2,
    name: "Caleb Monroe",
    designation: "Engenharia",
    image: "https://picsum.photos/seed/caleb/64/64",
  },
  {
    id: 3,
    name: "Dahlia Reyes",
    designation: "Design",
    image: "https://picsum.photos/seed/dahlia/64/64",
  },
  {
    id: 4,
    name: "Mira Sandoval",
    designation: "Sucesso",
    image: "https://picsum.photos/seed/mira/64/64",
  },
  {
    id: 5,
    name: "Theo Nakamura",
    designation: "Dados",
    image: "https://picsum.photos/seed/theo/64/64",
  },
]

/* Feed de atividade recente — eventos determinísticos da equipe. */
type ActivityKind = "deploy" | "ticket" | "membro" | "billing" | "comentário"

type ActivityEvent = {
  id: string
  name: string
  seed: string
  action: string
  kind: ActivityKind
  time: string
}

const ACTIVITY_FEED: ActivityEvent[] = [
  {
    id: "evt-1",
    name: "Caleb Monroe",
    seed: "caleb",
    action: "publicou um deploy em produção",
    kind: "deploy",
    time: "há 5 min",
  },
  {
    id: "evt-2",
    name: "Dahlia Reyes",
    seed: "dahlia",
    action: "fechou o ticket nº 1042",
    kind: "ticket",
    time: "há 22 min",
  },
  {
    id: "evt-3",
    name: "Aurora Vale",
    seed: "aurora",
    action: "convidou um novo membro para a equipe",
    kind: "membro",
    time: "há 1 h",
  },
  {
    id: "evt-4",
    name: "Mira Sandoval",
    seed: "mira",
    action: "atualizou o plano para Enterprise",
    kind: "billing",
    time: "há 3 h",
  },
  {
    id: "evt-5",
    name: "Theo Nakamura",
    seed: "theo",
    action: "comentou no relatório semanal",
    kind: "comentário",
    time: "há 5 h",
  },
  {
    id: "evt-6",
    name: "Caleb Monroe",
    seed: "caleb",
    action: "fez merge da branch feature/auth",
    kind: "deploy",
    time: "há 8 h",
  },
]

const NAV: DashboardSidebarNavItem[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "analytics", label: "Análises", icon: BarChart3 },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "settings", label: "Configurações", icon: Settings },
]

/* Árvore de arquivos do projeto exibida na sidebar. */
const PROJECT_FILES = [
  "src/app/layout.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/dashboard/settings.tsx",
  "src/components/kpi-card.tsx",
  "src/components/data-table.tsx",
  "src/lib/api.ts",
  "src/lib/utils.ts",
  "package.json",
]

/* Índice de navegação das seções do dashboard. */
const TOC_ITEMS = [
  { id: "section-kpis", label: "KPIs" },
  { id: "section-activity", label: "Atividade" },
  { id: "section-breakdown", label: "Detalhamento" },
]

/* -------------------------------------------------------------------------- */
/*                              helpers de dados                               */
/* -------------------------------------------------------------------------- */

function planVariant(plan: CustomerRow["plan"]) {
  if (plan === "Enterprise") return "default" as const
  if (plan === "Pro") return "secondary" as const
  return "outline" as const
}

function statusVariant(status: CustomerRow["status"]) {
  if (status === "Ativo") return "default" as const
  if (status === "Pendente") return "secondary" as const
  return "destructive" as const
}

function eventKindVariant(kind: ActivityKind) {
  if (kind === "deploy") return "default" as const
  if (kind === "ticket") return "secondary" as const
  if (kind === "billing") return "destructive" as const
  return "outline" as const
}

function eventKindLabel(kind: ActivityKind) {
  if (kind === "deploy") return "Deploy"
  if (kind === "ticket") return "Ticket"
  if (kind === "membro") return "Equipe"
  if (kind === "billing") return "Cobrança"
  return "Comentário"
}

/* -------------------------------------------------------------------------- */
/*                                 composição                                  */
/* -------------------------------------------------------------------------- */

export function SaasDashboard() {
  const [activeNav, setActiveNav] = React.useState("overview")

  return (
    <div className="flex min-h-[40vh] w-full overflow-hidden rounded-xl border border-border/60 bg-background text-foreground">
      {/* Sidebar */}
      <DashboardSidebarNav
        className="hidden lg:flex"
        items={NAV}
        activeId={activeNav}
        onSelect={setActiveNav}
        brand={
          <>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              W
            </span>
            <span className="text-sm font-semibold tracking-tight">Nimbus</span>
          </>
        }
        footer={
          <>
            <UpgradeCard
              title="Plano Pro"
              description="7 dias restantes no teste."
              cta={{ label: "Fazer upgrade" }}
            />

            {/* Árvore de arquivos do projeto */}
            <div className="mt-4">
              <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                Arquivos do projeto
              </p>
              <Tree
                data={PROJECT_FILES}
                initialExpansion="open"
                density="compact"
                style={
                  { "--trees-height": "220px" } as React.CSSProperties &
                    Record<`--${string}`, string>
                }
              />
            </div>
          </>
        }
      />

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <DashboardTopbar
          title="Visão geral"
          titleAdornment={
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Tempo real
            </Badge>
          }
          search={
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 sm:inline-flex"
            >
              <Search className="size-4" />
              Buscar
            </Button>
          }
          actions={
            <>
              <Button variant="ghost" size="icon" aria-label="Notificações">
                <Bell className="size-4" />
              </Button>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Novo relatório
              </Button>
            </>
          }
        />

        {/* Body */}
        <div className="flex flex-col gap-6 p-4 sm:p-6">
          {/* Índice de navegação das seções */}
          <TOCMinimap
            items={TOC_ITEMS}
            orientation="horizontal"
            showProgress={false}
            className="flex-wrap rounded-lg border border-border/60 bg-card/40 px-3 py-2"
          />

          {/* KPIs */}
          <Section index={0} id="section-kpis">
            <SectionHeader
              eyebrow="Desempenho"
              title="Indicadores principais"
              description="Métricas-chave do negócio comparadas ao mês anterior."
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {KPIS.map((kpi) => (
                <KpiCard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  prefix={kpi.prefix}
                  suffix={kpi.suffix}
                  delta={kpi.delta}
                  icon={kpi.icon}
                  hint="vs. mês anterior"
                />
              ))}
            </div>
          </Section>

          {/* Heatmap de atividade */}
          <Section
            index={1}
            id="section-activity"
            className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <SectionHeader
              eyebrow="Engajamento"
              title={
                <span className="inline-flex items-center gap-2">
                  Atividade da equipe
                  <Badge variant="outline">Heatmap</Badge>
                </span>
              }
              description="Eventos de produto nas últimas 30 semanas."
              actions={
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    Ativos agora
                  </span>
                  <AnimatedTooltip items={ACTIVE_MEMBERS} />
                </div>
              }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Coluna principal — resumos + heatmap */}
              <div className="flex flex-col gap-4 lg:col-span-2">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {ACTIVITY_STATS.map((stat) => (
                    <StatTile
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      icon={stat.icon}
                    />
                  ))}
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <GitHubContributions
                    data={CONTRIBUTIONS}
                    weeks={30}
                    colorScale="green"
                  />
                </div>
              </div>

              {/* Coluna lateral — feed de atividade recente */}
              <div className="flex flex-col rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">
                    Atividade recente
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    Ao vivo
                  </Badge>
                </div>
                <ActivityFeed
                  items={ACTIVITY_FEED.map((event) => ({
                    id: event.id,
                    name: event.name,
                    action: event.action,
                    time: event.time,
                    avatar: `https://picsum.photos/seed/${event.seed}/64/64`,
                    badge: {
                      label: eventKindLabel(event.kind),
                      variant: eventKindVariant(event.kind),
                    },
                  }))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full justify-center"
                >
                  Ver tudo
                </Button>
              </div>
            </div>
          </Section>

          {/* Tabelas com abas */}
          <Section
            index={2}
            id="section-breakdown"
            className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <Tabs defaultValue="customers">
              <SectionHeader
                eyebrow="Relatórios"
                title="Detalhamento"
                description="Alterne entre clientes e canais de aquisição."
                actions={
                  <TabsList>
                    <TabsTrigger value="customers">Clientes</TabsTrigger>
                    <TabsTrigger value="channels">Canais</TabsTrigger>
                  </TabsList>
                }
              />

              <TabsContent value="customers" className="mt-4">
                <TableFluid>
                  <TableFluidHeader>
                    <TableFluidRow>
                      <TableFluidHead>Cliente</TableFluidHead>
                      <TableFluidHead className="hidden sm:table-cell">
                        Plano
                      </TableFluidHead>
                      <TableFluidHead>Status</TableFluidHead>
                      <TableFluidHead className="text-right">MRR</TableFluidHead>
                    </TableFluidRow>
                  </TableFluidHeader>
                  <TableFluidBody>
                    {CUSTOMERS.map((row, i) => (
                      <TableFluidRow key={row.id} index={i}>
                        <TableFluidCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://picsum.photos/seed/${row.seed}/64/64`}
                              alt={row.name}
                              className="size-8 rounded-full object-cover"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {row.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {row.email}
                              </p>
                            </div>
                          </div>
                        </TableFluidCell>
                        <TableFluidCell className="hidden sm:table-cell">
                          <Badge variant={planVariant(row.plan)}>
                            {row.plan}
                          </Badge>
                        </TableFluidCell>
                        <TableFluidCell>
                          <Badge variant={statusVariant(row.status)}>
                            {row.status}
                          </Badge>
                        </TableFluidCell>
                        <TableFluidCell className="text-right font-medium tabular-nums text-foreground">
                          ${row.mrr.toLocaleString()}
                        </TableFluidCell>
                      </TableFluidRow>
                    ))}
                  </TableFluidBody>
                </TableFluid>
              </TabsContent>

              <TabsContent value="channels" className="mt-4">
                <TableFluid>
                  <TableFluidHeader>
                    <TableFluidRow>
                      <TableFluidHead>Canal</TableFluidHead>
                      <TableFluidHead className="text-right">
                        Visitantes
                      </TableFluidHead>
                      <TableFluidHead className="text-right">
                        Cadastros
                      </TableFluidHead>
                      <TableFluidHead className="text-right">
                        Conversão
                      </TableFluidHead>
                    </TableFluidRow>
                  </TableFluidHeader>
                  <TableFluidBody>
                    {CHANNELS.map((row, i) => (
                      <TableFluidRow key={row.channel} index={i}>
                        <TableFluidCell className="font-medium text-foreground">
                          {row.channel}
                        </TableFluidCell>
                        <TableFluidCell className="text-right tabular-nums">
                          {row.visitors.toLocaleString()}
                        </TableFluidCell>
                        <TableFluidCell className="text-right tabular-nums">
                          {row.signups.toLocaleString()}
                        </TableFluidCell>
                        <TableFluidCell className="text-right font-medium tabular-nums text-foreground">
                          {row.rate}
                        </TableFluidCell>
                      </TableFluidRow>
                    ))}
                  </TableFluidBody>
                </TableFluid>
              </TabsContent>
            </Tabs>
          </Section>
        </div>
      </div>
    </div>
  )
}
