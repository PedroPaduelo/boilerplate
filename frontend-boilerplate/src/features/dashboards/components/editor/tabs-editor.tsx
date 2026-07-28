/**
 * Editor de ABAS do dashboard (doc 40) — criar, renomear, reordenar e remover.
 *
 * Segue o padrão do `FiltersEditor`: a lista inteira é UMA região (`Section`),
 * não um card por aba — aba é campo de configuração, não item discreto, e uma
 * borda por linha viraria ruído. Sem drag-and-drop, como o resto do editor
 * (decisão travada do MVP), o que já deixa tudo operável por teclado.
 *
 * A `key` é o índice e não `tab.id` porque o campo de título é editável a cada
 * tecla; usar um id que muda remontaria o input e o foco saltaria para fora.
 * Aqui o id NÃO é editável, mas as abas são REORDENÁVEIS — então o índice muda
 * de dono ao mover. Isso é aceitável (o remount ocorre só no clique de mover, e
 * o foco está no botão, não no campo).
 *
 * REMOVER uma aba NÃO apaga as linhas dela: elas voltam para a primeira aba
 * (regra do normalizador do contrato). Está escrito na tela porque "remover"
 * junto de conteúdo sugere destruição — e aqui o gesto é de organização.
 */
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, Section, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { EditorTab } from '../../lib/layout-editor';

export interface TabsEditorProps {
  tabs: EditorTab[];
  onAdd: () => void;
  onRename: (tabId: string, title: string) => void;
  onMove: (tabId: string, direction: 'up' | 'down') => void;
  onRemove: (tabId: string) => void;
}

export function TabsEditor({ tabs, onAdd, onRename, onMove, onRemove }: TabsEditorProps) {
  const addButton = (
    <Button label="Adicionar aba" icon={<Icon icon={Plus} />} size="sm" onClick={onAdd} />
  );

  return (
    <VStack gap={3}>
      <HStack vAlign="center" hAlign="between" gap={2}>
        <Text type="label">Abas</Text>
        {addButton}
      </HStack>

      {tabs.length === 0 ? (
        // Sem abas é o estado NORMAL de um dashboard (elas são opcionais), não
        // um vazio a ser preenchido. Por isso uma linha de apoio e não um
        // `EmptyState`: um bloco vazio grande aqui competiria em peso visual
        // com linhas e blocos, que são a tarefa principal do editor.
        <Text type="supporting">
          Este dashboard é uma página só. Ao criar a primeira aba, as linhas existentes
          vão todas para ela — depois é só distribuí-las.
        </Text>
      ) : (
        <Section variant="muted" padding={3} aria-label="Abas do dashboard">
          <VStack gap={3}>
            {tabs.map((tab, index) => (
              <HStack key={index} gap={2} vAlign="end">
                <TextInput
                  label={`Título da aba ${index + 1}`}
                  isLabelHidden
                  size="sm"
                  width="100%"
                  placeholder={`Título da aba ${index + 1}`}
                  value={tab.title}
                  onChange={(value) => onRename(tab.id, value)}
                />
                <IconButton
                  label={`Mover aba ${tab.title} para cima`}
                  tooltip="Mover para cima"
                  icon={<Icon icon={ArrowUp} />}
                  variant="ghost"
                  size="sm"
                  isDisabled={index === 0}
                  onClick={() => onMove(tab.id, 'up')}
                />
                <IconButton
                  label={`Mover aba ${tab.title} para baixo`}
                  tooltip="Mover para baixo"
                  icon={<Icon icon={ArrowDown} />}
                  variant="ghost"
                  size="sm"
                  isDisabled={index === tabs.length - 1}
                  onClick={() => onMove(tab.id, 'down')}
                />
                <IconButton
                  label={`Remover aba ${tab.title}`}
                  tooltip="Remover aba (as linhas voltam para a primeira)"
                  icon={<Icon icon={Trash2} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(tab.id)}
                />
              </HStack>
            ))}

            <Text type="supporting">
              Remover uma aba não apaga as linhas dela — elas voltam para a primeira aba.
              Use “Remover linha” para excluir conteúdo.
            </Text>
          </VStack>
        </Section>
      )}
    </VStack>
  );
}
