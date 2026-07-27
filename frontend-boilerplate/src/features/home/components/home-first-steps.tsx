/**
 * Primeiros passos — o vazio da Visão geral.
 *
 * Conta nova não tem "recentes" para mostrar; mostrar duas listas vazias seria
 * anunciar que não há nada a fazer. Este bloco troca o vazio por um caminho: do
 * banco conectado à resposta publicada, três passos, cada um com a sua ação.
 *
 * O passo já cumprido não some (ele mostra o progresso), mas troca o CTA por um
 * selo de concluído. Ação que o papel do usuário não permite simplesmente não
 * aparece — RBAC é decidido pela página e chega aqui como booleano.
 */
import { Database, MessageSquare, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { VStack } from '@astryxdesign/core/Stack';
import { Heading, Text } from '@astryxdesign/core/Text';

export interface HomeFirstStepsProps {
  hasConnection: boolean;
  hasChart: boolean;
  hasDashboard: boolean;
  /** RBAC `artifacts:manage`: sem ela, não há o que criar aqui. */
  canManageArtifacts: boolean;
  /** RBAC `connections:manage`: quem só usa conexões não cadastra banco. */
  canManageConnections: boolean;
  isCreatingDashboard: boolean;
  onCreateDashboard: () => void;
}

const DONE = <Badge variant="success" label="Concluído" />;

export function HomeFirstSteps({
  hasConnection,
  hasChart,
  hasDashboard,
  canManageArtifacts,
  canManageConnections,
  isCreatingDashboard,
  onCreateDashboard,
}: HomeFirstStepsProps) {
  const connectAction: ReactNode = canManageConnections ? (
    <Button
      size="sm"
      label="Conectar banco"
      icon={<Icon icon={Database} />}
      href="/connections"
    />
  ) : undefined;

  const askAction: ReactNode = canManageArtifacts ? (
    <Button
      size="sm"
      label="Abrir o agente"
      icon={<Icon icon={MessageSquare} />}
      href="/chat"
    />
  ) : undefined;

  // Criar dashboard é o único destino que depende do id devolvido pela
  // mutação — por isso `onClick`, e não `href`.
  const buildAction: ReactNode = canManageArtifacts ? (
    <Button
      size="sm"
      label="Criar dashboard"
      icon={<Icon icon={Plus} />}
      isLoading={isCreatingDashboard}
      onClick={onCreateDashboard}
    />
  ) : undefined;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Text type="supporting">Comece por aqui</Text>
          <Heading level={3}>Três passos para o primeiro insight</Heading>
          <Text color="secondary">
            Do banco conectado à resposta publicada — leva poucos minutos.
          </Text>
        </VStack>

        <List listStyle="decimal" hasDividers>
          <ListItem
            label="Conecte um banco"
            description="Aponte o auditorIA para um PostgreSQL. Ele lê o schema sozinho — você não precisa mapear tabela por tabela."
            endContent={hasConnection ? DONE : connectAction}
          />
          <ListItem
            label="Pergunte em português"
            description="“Quais lançamentos fogem do padrão neste trimestre?” O agente escreve o SQL, executa e devolve o resultado já em gráfico."
            endContent={hasChart ? DONE : askAction}
          />
          <ListItem
            label="Monte e publique"
            description="Junte os gráficos que importam em um dashboard e compartilhe por link público ou com o departamento."
            endContent={hasDashboard ? DONE : buildAction}
          />
        </List>
      </VStack>
    </Card>
  );
}
