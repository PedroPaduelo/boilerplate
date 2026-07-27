/**
 * Faixa de indicadores do ambiente: dashboards, gráficos e conexões saudáveis.
 *
 * É UMA faixa com divisores — não três cards coloridos. A grade de "stat cards",
 * cada um com seu ícone colorido, é o padrão que datou os painéis: a cor vira
 * decoração, o olho perde a referência e sobra a pergunta "o verde quer dizer o
 * quê?". Aqui o agrupamento vem do container + hairline, e a COR fica reservada
 * para STATUS (o ponto das conexões).
 *
 * Cada célula é um link para a listagem correspondente: o número é porta de
 * entrada, não enfeite. Navegação por `href` — o `LinkProvider` do shell
 * converte para client-side.
 */
import { Fragment, type ReactNode } from 'react';
import { BarChart3, Database, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { Item } from '@astryxdesign/core/Item';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, StackItem } from '@astryxdesign/core/Stack';
import { StatusDot, type StatusDotVariant } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';

export interface HomeStatsProps {
  totalDashboards: number;
  totalCharts: number;
  totalConnections: number;
  healthyConnections: number;
  /** RBAC (`connections:use`): sem a permissão a célula de conexões não existe. */
  canUseConnections: boolean;
  isLoading: boolean;
  isLoadingConnections: boolean;
  /** Listagem de conexões falhou: a célula não pode AFIRMAR nada sobre elas. */
  hasConnectionsError: boolean;
}

interface StatCell {
  key: string;
  icon: LucideIcon;
  value: string;
  label: string;
  href: string;
  endContent?: ReactNode;
}

interface ConnectionHealth {
  variant: StatusDotVariant;
  label: string;
}

/**
 * Saúde do conjunto de conexões. O ponto colorido nunca fala sozinho: o texto
 * ao lado é quem nomeia o estado (e é o que o leitor de tela anuncia).
 *
 * Consulta falhou → NÃO dizemos "nenhuma cadastrada". Zero e desconhecido são
 * fatos diferentes, e afirmar o primeiro quando o caso é o segundo faz quem tem
 * 12 conexões concluir que perdeu tudo. Aqui a célula assume a ignorância.
 */
function connectionHealth(
  healthy: number,
  total: number,
  hasError: boolean,
): ConnectionHealth {
  if (hasError) return { variant: 'warning', label: 'não foi possível verificar' };
  if (total === 0) return { variant: 'neutral', label: 'nenhuma cadastrada' };
  if (healthy === total) return { variant: 'success', label: 'todas respondendo' };
  if (healthy === 0) return { variant: 'error', label: 'nenhuma respondendo' };
  return { variant: 'warning', label: `${total - healthy} sem resposta` };
}

export function HomeStats({
  totalDashboards,
  totalCharts,
  totalConnections,
  healthyConnections,
  canUseConnections,
  isLoading,
  isLoadingConnections,
  hasConnectionsError,
}: HomeStatsProps) {
  if (isLoading) {
    return <HomeStatsSkeleton cells={canUseConnections ? 3 : 2} />;
  }

  const cells: StatCell[] = [
    {
      key: 'dashboards',
      icon: LayoutDashboard,
      value: String(totalDashboards),
      label: 'Dashboards',
      href: '/dashboards',
    },
    {
      key: 'charts',
      icon: BarChart3,
      value: String(totalCharts),
      label: 'Gráficos',
      href: '/charts',
    },
  ];

  if (canUseConnections) {
    const health = connectionHealth(
      healthyConnections,
      totalConnections,
      hasConnectionsError,
    );
    // Sem número quando não sabemos: "—" é honesto, "0" seria mentira.
    const isUnknown = isLoadingConnections || hasConnectionsError;
    cells.push({
      key: 'connections',
      icon: Database,
      value: isUnknown
        ? '—'
        : totalConnections === 0
          ? '0'
          : `${healthyConnections}/${totalConnections}`,
      label: 'Conexões',
      // A célula segue clicável: /connections é onde o usuário resolve.
      href: '/connections',
      endContent: isLoadingConnections ? null : (
        <HStack gap={1.5} vAlign="center">
          <StatusDot variant={health.variant} label={health.label} aria-hidden="true" />
          <Text type="supporting">{health.label}</Text>
        </HStack>
      ),
    });
  }

  return (
    <Card padding={0}>
      <HStack wrap="wrap">
        {cells.map((cell, index) => (
          <Fragment key={cell.key}>
            {index > 0 ? <Divider orientation="vertical" /> : null}
            <StackItem size="fill">
              <Item
                density="spacious"
                href={cell.href}
                startContent={<Icon icon={cell.icon} color="secondary" />}
                label={
                  <Text type="display-3" hasTabularNumbers>
                    {cell.value}
                  </Text>
                }
                description={cell.label}
                endContent={cell.endContent}
              />
            </StackItem>
          </Fragment>
        ))}
      </HStack>
    </Card>
  );
}

/**
 * Carregando: a MESMA silhueta da faixa (mesmo container, mesmos divisores,
 * mesmas células). Espaço reservado no formato certo evita o salto de layout
 * quando os números chegam — e nunca deixa a tela em branco.
 */
function HomeStatsSkeleton({ cells }: { cells: number }) {
  return (
    <Card padding={0}>
      <HStack wrap="wrap" role="status" aria-label="Carregando indicadores">
        {Array.from({ length: cells }).map((_, index) => (
          <Fragment key={index}>
            {index > 0 ? <Divider orientation="vertical" /> : null}
            <StackItem size="fill">
              <Item
                density="spacious"
                startContent={
                  <Skeleton width={20} height={20} radius={2} index={index} />
                }
                label={<Skeleton width={64} height={28} radius={2} index={index} />}
                description={<Skeleton width={96} height={12} radius={1} index={index} />}
              />
            </StackItem>
          </Fragment>
        ))}
      </HStack>
    </Card>
  );
}
