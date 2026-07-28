/**
 * CARD de uma conexão — a célula da grade de `/connections`.
 *
 * Uma grade só se paga quando a célula carrega algo que a linha de tabela não
 * consegue. Aqui esse algo é a AÇÃO: a listagem vivia com um beco sem saída —
 * a coluna "Status" dizia "Não testado · Nunca testada" e não havia como
 * testar sem entrar na conexão (`useTestConnection` só era usado no
 * workbench). O card dá espaço para o "Testar" ao lado do próprio status, que
 * é a pergunta nº 1 de quem abre esta tela: "isso conecta?".
 *
 *   ┌────────────────────────────────────────┐
 *   │ 🗄  nome                          [⋯]  │  identidade + ações de gestão
 *   │    host:porta/banco                    │  endereço (o que de fato a identifica)
 *   │    descrição                           │  opcional — varia entre cards
 *   │  ● Conectado    · há 2 min             │  estado + frescor da evidência
 *   │  🌐 Organização · [Produção]           │  alcance (governança) + ambiente
 *   ├────────────────────────────────────────┤
 *   │ [⚡ Testar]                  [Inativa] │  ação real + flag de bloqueio
 *   └────────────────────────────────────────┘
 *
 * `ClickableCard` (e não `Card` + link no título) porque o card INTEIRO abre o
 * workbench — a mesma decisão do `ChartCard`. O `Button` e o `MoreMenu`
 * aninhados mantêm evento próprio: é o comportamento documentado do
 * componente.
 */
import {
  Building2,
  Database,
  Globe,
  Lock,
  Pencil,
  PlugZap,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import {
  connectionStatusView,
  environmentView,
  visibilityLabel,
} from '../lib/connection-presentation';
import type { Connection, ConnectionVisibility } from '../types';

/**
 * Alcance da conexão → ícone. O rótulo continua vindo de `visibilityLabel`
 * (fonte única, compartilhada com a tabela) — o ícone nunca aparece sozinho,
 * então quem lê rápido pega o cadeado e quem usa leitor de tela ouve a palavra.
 */
const VISIBILITY_ICON: Record<ConnectionVisibility, LucideIcon> = {
  PRIVATE: Lock,
  DEPARTMENT: Building2,
  ORG: Globe,
};

export interface ConnectionCardProps {
  connection: Connection;
  canManage: boolean;
  /** `true` só no card cuja conexão está sendo testada agora. */
  isTesting: boolean;
  onTest: (connection: Connection) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
}

export function ConnectionCard({
  connection,
  canManage,
  isTesting,
  onTest,
  onEdit,
  onDelete,
}: ConnectionCardProps) {
  const status = connectionStatusView(connection.status);
  const environment = environmentView(connection.environment);
  const VisibilityIcon = VISIBILITY_ICON[connection.visibility] ?? Globe;
  const endpoint = `${connection.host}:${connection.port}/${connection.database}`;
  // Mesma regra do workbench: barrar com explicação em vez de deixar clicar e
  // devolver erro do servidor.
  const inactiveReason = connection.isActive
    ? undefined
    : 'Conexão inativa — reative para usar.';

  return (
    <ClickableCard
      label={connection.name}
      href={`/connections/${connection.id}`}
      padding={0}
      data-testid="connection-card"
    >
      <VStack>
        <VStack gap={2} padding={3}>
          <HStack gap={2} justify="between" align="start">
            <HStack gap={2} vAlign="center">
              <Icon icon={Database} color="accent" />
              <VStack gap={0}>
                {/* Visualmente h3 (título de card), semanticamente h2: o h1 é
                    da topbar do shell e não há seção intermediária nesta tela,
                    então sem isto a hierarquia pularia h1 → h3. */}
                <Heading level={3} accessibilityLevel={2} maxLines={1}>
                  {connection.name}
                </Heading>
                <Text
                  type="code"
                  size="sm"
                  color="secondary"
                  maxLines={1}
                  hasTruncateTooltip
                >
                  {endpoint}
                </Text>
              </VStack>
            </HStack>
            {canManage ? (
              <MoreMenu
                label={`Ações de ${connection.name}`}
                size="sm"
                items={[
                  {
                    label: 'Editar conexão',
                    icon: Pencil,
                    onClick: () => onEdit(connection),
                  },
                  {
                    label: 'Excluir conexão',
                    icon: Trash2,
                    onClick: () => onDelete(connection),
                  },
                ]}
              />
            ) : null}
          </HStack>

          {connection.description ? (
            <Text type="supporting" color="secondary" maxLines={2}>
              {connection.description}
            </Text>
          ) : null}

          <HStack gap={2} justify="between" vAlign="center" wrap="wrap">
            <HStack gap={1.5} vAlign="center">
              <StatusDot
                variant={status.variant}
                label={status.label}
                aria-hidden="true"
              />
              <Text type="supporting">{status.label}</Text>
            </HStack>
            {connection.lastTestedAt ? (
              <Timestamp
                value={connection.lastTestedAt}
                format="relative"
                type="supporting"
                hasTooltip
              />
            ) : (
              <Text type="supporting" color="secondary">
                Nunca testada
              </Text>
            )}
          </HStack>

          <HStack gap={2} justify="between" vAlign="center" wrap="wrap">
            <HStack gap={1.5} vAlign="center">
              <Icon icon={VisibilityIcon} size="sm" color="secondary" />
              <Text type="supporting" color="secondary" maxLines={1}>
                {visibilityLabel(connection.visibility)}
              </Text>
            </HStack>
            <Badge variant={environment.variant} label={environment.label} />
          </HStack>
        </VStack>

        <Divider />

        <HStack gap={2} justify="between" vAlign="center" padding={2}>
          <Button
            label="Testar"
            size="sm"
            icon={<Icon icon={PlugZap} />}
            isLoading={isTesting}
            isDisabled={!connection.isActive}
            tooltip={inactiveReason ?? 'Verifica a conectividade agora'}
            onClick={() => onTest(connection)}
          />
          {connection.isActive ? null : <Badge variant="neutral" label="Inativa" />}
        </HStack>
      </VStack>
    </ClickableCard>
  );
}
