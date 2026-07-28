/**
 * CARD de um gráfico — a célula da grade de `/charts`.
 *
 * Anatomia (M3: container → mídia → headline → subhead → apoio → ações;
 * Superset: thumbnail + tipo da fonte + "modificado há…" + estrela + kebab),
 * traduzida para o que ESTE produto resolve — auditoria de dados:
 *
 *   ┌──────────────────────────────┐
 *   │  miniatura AO VIVO           │  o gráfico de verdade, com dados reais
 *   ├──────────────────────────────┤
 *   │  Título               [ ⋯ ]  │  headline + ações (menu independente)
 *   │  ● Publicado · Barras        │  estado da EVIDÊNCIA + tipo do bloco
 *   │  🔒 Departamento · há 2 dias │  alcance (governança) + frescor do dado
 *   └──────────────────────────────┘
 *
 * As três perguntas de auditoria que o card responde sem abrir nada: isto já é
 * evidência publicada ou ainda rascunho? quem enxerga? o dado é de quando?
 *
 * `ClickableCard` (e não `Card` + link no título) porque o card INTEIRO é o
 * alvo: um card com uma área clicável de 200px² e um link de 120px de largura
 * ensina o usuário a mirar. O `MoreMenu` aninhado continua com evento próprio
 * — é o comportamento documentado do componente.
 */
import { Building2, Globe, Lock, type LucideIcon } from 'lucide-react';
import type { DropdownMenuOption } from '@astryxdesign/core/DropdownMenu';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Divider } from '@astryxdesign/core/Divider';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { MoreMenu } from '@astryxdesign/core/MoreMenu';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Timestamp } from '@astryxdesign/core/Timestamp';
import type { Chart } from '../types';
import { ChartCardPreview } from './chart-card-preview';

/**
 * Alcance do gráfico → ícone + rótulo. O ícone é redundante com o texto de
 * propósito (nunca sozinho): quem lê rápido pega o cadeado, quem usa leitor de
 * tela ouve a palavra.
 */
const VISIBILITY_META: Record<string, { label: string; icon: LucideIcon }> = {
  PRIVATE: { label: 'Privado', icon: Lock },
  DEPARTMENT: { label: 'Departamento', icon: Building2 },
  ORG: { label: 'Organização', icon: Globe },
};

export interface ChartCardProps {
  chart: Chart;
  /** Tipo do bloco em linguagem de gente (ex.: "Barras"), com recuo pro `catalogType`. */
  typeLabel: string;
  /** Departamento ou origem ("Meu gráfico"), já resolvido pela listagem. */
  context: string;
  actions: DropdownMenuOption[];
  onPrefetch: () => void;
}

export function ChartCard({
  chart,
  typeLabel,
  context,
  actions,
  onPrefetch,
}: ChartCardProps) {
  const isPublished = chart.status === 'PUBLISHED';
  const statusLabel = isPublished ? 'Publicado' : 'Rascunho';
  const visibility = VISIBILITY_META[chart.visibility] ?? {
    label: chart.visibility,
    icon: Globe,
  };

  return (
    <ClickableCard
      // O nome acessível é o TÍTULO puro — igual ao link da tabela. Prefixar
      // com "Abrir…" faria a lista de links do leitor de tela virar uma coluna
      // de "Abrir, Abrir, Abrir" com o que importa no fim.
      label={chart.title}
      href={`/charts/${chart.id}`}
      padding={0}
      data-testid="chart-card"
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      <VStack>
        <ChartCardPreview chart={chart} />
        <Divider />

        <VStack gap={2} padding={3}>
          <HStack gap={2} justify="between" align="start">
            <VStack gap={0.5}>
              {/* h3 visual, h2 semântico — o h1 é da topbar e a grade não tem
                  seção intermediária (ver ConnectionCard). */}
              <Heading level={3} accessibilityLevel={2} maxLines={2}>
                {chart.title}
              </Heading>
              <Text type="supporting" color="secondary" maxLines={1}>
                {typeLabel}
              </Text>
            </VStack>
            {actions.length > 0 ? (
              <MoreMenu label={`Ações de ${chart.title}`} size="sm" items={actions} />
            ) : null}
          </HStack>

          <HStack gap={2} justify="between" vAlign="center" wrap="wrap">
            <HStack gap={1.5} vAlign="center">
              <StatusDot
                variant={isPublished ? 'success' : 'neutral'}
                label={statusLabel}
                aria-hidden="true"
              />
              <Text type="supporting">{statusLabel}</Text>
            </HStack>
            <Timestamp
              value={chart.updatedAt}
              format="auto"
              type="supporting"
              hasTooltip
            />
          </HStack>

          <HStack gap={1.5} vAlign="center" wrap="wrap">
            <Icon icon={visibility.icon} size="sm" color="secondary" />
            <Text type="supporting" color="secondary" maxLines={1}>
              {visibility.label} · {context}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </ClickableCard>
  );
}
