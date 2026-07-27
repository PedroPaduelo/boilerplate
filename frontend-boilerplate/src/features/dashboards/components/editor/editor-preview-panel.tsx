/**
 * Coluna de PRÉ-VISUALIZAÇÃO do editor: reusa o `DashboardRenderer` (o mesmo da
 * tela real) para que o que se vê aqui seja exatamente o que o consumidor verá.
 *
 * O alternador é um `SegmentedControl` porque são modos mutuamente exclusivos
 * de UMA coisa (a versão exibida), não navegação. O segmento "Versão publicada"
 * fica desabilitado enquanto não houver publicação — e o motivo vai em texto de
 * apoio, não em tooltip: controle desabilitado engole os eventos de hover que
 * um Tooltip externo precisa (o DS proíbe esse embrulho explicitamente).
 */
import { Eye } from 'lucide-react';
import type { DashboardDataPayload, DashboardLayout } from '@dashboards/contracts';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, Section, VStack } from '@astryxdesign/core/Layout';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { DashboardRenderer } from '@/shared/render-engine';
import type { ApiMode } from '@/shared/lib/query-keys';

export interface EditorPreviewPanelProps {
  mode: ApiMode;
  onModeChange: (mode: ApiMode) => void;
  layout: DashboardLayout;
  data: DashboardDataPayload | undefined;
  /** Há uma versão publicada para comparar. */
  isPublished: boolean;
  /** Há edição local ainda não salva (os DADOS do preview vêm do salvo). */
  hasUnsavedChanges: boolean;
}

/** Um aviso por vez, do mais acionável para o mais informativo. */
function previewHint(
  mode: ApiMode,
  isPublished: boolean,
  hasUnsavedChanges: boolean,
): string | null {
  if (mode === 'draft' && hasUnsavedChanges) {
    return 'Os dados do preview refletem o rascunho salvo. Salve para atualizá-los.';
  }
  if (!isPublished) {
    return 'Publique o dashboard para comparar com a versão publicada.';
  }
  return null;
}

export function EditorPreviewPanel({
  mode,
  onModeChange,
  layout,
  data,
  isPublished,
  hasUnsavedChanges,
}: EditorPreviewPanelProps) {
  const hint = previewHint(mode, isPublished, hasUnsavedChanges);
  const isEmpty = layout.rows.length === 0;

  return (
    <VStack gap={3}>
      <Toolbar
        label="Pré-visualização do dashboard"
        size="sm"
        dividers={['bottom']}
        startContent={
          <HStack gap={2} vAlign="center">
            <Icon icon={Eye} size="sm" />
            <Text type="label">Pré-visualização</Text>
          </HStack>
        }
        endContent={
          <SegmentedControl
            label="Versão exibida na pré-visualização"
            size="sm"
            value={mode}
            onChange={(value) => onModeChange(value as ApiMode)}
          >
            <SegmentedControlItem value="draft" label="Dev (rascunho)" />
            <SegmentedControlItem
              value="published"
              label="Versão publicada"
              isDisabled={!isPublished}
            />
          </SegmentedControl>
        }
      />

      {hint ? <Text type="supporting">{hint}</Text> : null}

      <Section variant="muted" padding={4}>
        {isEmpty ? (
          <EmptyState
            isCompact
            headingLevel={4}
            icon={<Icon icon={Eye} size="lg" />}
            title="Nada para pré-visualizar"
            description="Adicione uma linha e um bloco na coluna de edição para ver o resultado aqui."
          />
        ) : (
          <DashboardRenderer layout={layout} data={data} />
        )}
      </Section>
    </VStack>
  );
}
