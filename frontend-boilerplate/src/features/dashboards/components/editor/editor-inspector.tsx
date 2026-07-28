/**
 * O INSPETOR: o painel que mostra as propriedades do que está selecionado.
 *
 * Um painel só, com três conteúdos possíveis (dashboard, linha, bloco), em vez
 * de três listas empilhadas na página. O ganho não é de espaço, é de ATENÇÃO:
 * no editor antigo todos os formulários de todos os blocos ficavam abertos ao
 * mesmo tempo — 19 campos e 84 botões numa tela, para um dashboard de 9 blocos.
 * Aqui, o que está na tela é o que a pessoa acabou de clicar.
 *
 * É o mesmo desenho da barra lateral do editor de dashboards do Grafana ("as
 * opções disponíveis mudam conforme o elemento selecionado") e do painel de
 * propriedades do Metabase e do Retool.
 *
 * O painel é STICKY (ver `.app-editor-inspector` no CSS do app): rolando o
 * canvas atrás dele, os controles do bloco continuam ao alcance. Sem isso, um
 * dashboard alto obriga a rolar até o topo a cada ajuste.
 */
import { LayoutGrid, Rows3, SquareDashed } from 'lucide-react';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, Section, VStack } from '@astryxdesign/core/Layout';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type { EditorSelection } from '../../use-editor-selection';
import type { ReactNode } from 'react';

export interface EditorInspectorProps {
  selection: EditorSelection;
  /** Nome do que está selecionado — vira o título do painel. */
  targetName: string;
  onClear: () => void;
  children: ReactNode;
}

const ICON_BY_KIND = {
  dashboard: LayoutGrid,
  row: Rows3,
  block: SquareDashed,
} as const;

const KIND_LABEL = {
  dashboard: 'Dashboard',
  row: 'Linha',
  block: 'Bloco',
} as const;

export function EditorInspector({
  selection,
  targetName,
  onClear,
  children,
}: EditorInspectorProps) {
  const isDashboard = selection.kind === 'dashboard';

  return (
    <VStack gap={0} className="app-editor-inspector">
      <Section variant="section" padding={0} aria-label="Propriedades da seleção">
        <Toolbar
          label="Seleção"
          size="sm"
          dividers={['bottom']}
          startContent={
            <HStack gap={2} vAlign="center">
              <Icon icon={ICON_BY_KIND[selection.kind]} size="sm" />
              <VStack gap={0}>
                <Text type="label" maxLines={1}>
                  {targetName}
                </Text>
                <Text type="supporting">{KIND_LABEL[selection.kind]}</Text>
              </VStack>
            </HStack>
          }
          endContent={
            isDashboard ? undefined : (
              <Button
                label="Fechar"
                variant="ghost"
                size="sm"
                tooltip="Volta às propriedades do dashboard"
                onClick={onClear}
              />
            )
          }
        />
        <VStack gap={4} padding={4} className="app-editor-inspector__body">
          {children}
        </VStack>
      </Section>
    </VStack>
  );
}
