import { Search } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { TextInput } from '@astryxdesign/core/TextInput';

/**
 * Controles do navegador de schema: busca, expandir/recolher e o filtro “só
 * com FK”. Fica FORA da área rolável — filtro que some ao rolar é filtro que
 * o usuário esquece que está ligado.
 */
export interface SchemaExplorerToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  onlyWithForeignKeys: boolean;
  onOnlyWithForeignKeysChange: (value: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  isDisabled: boolean;
}

export function SchemaExplorerToolbar({
  search,
  onSearchChange,
  onlyWithForeignKeys,
  onOnlyWithForeignKeysChange,
  onExpandAll,
  onCollapseAll,
  isDisabled,
}: SchemaExplorerToolbarProps) {
  return (
    <VStack gap={2} padding={2}>
      <TextInput
        label="Buscar no schema"
        isLabelHidden
        size="sm"
        value={search}
        onChange={onSearchChange}
        placeholder="Tabela, coluna ou referência…"
        startIcon={Search}
        hasClear
        isDisabled={isDisabled}
        disabledMessage="Nenhum schema carregado."
      />
      <HStack gap={2} vAlign="center" justify="between" wrap="wrap">
        <HStack gap={1} vAlign="center">
          <Button
            label="Expandir"
            size="sm"
            variant="ghost"
            isDisabled={isDisabled}
            onClick={onExpandAll}
          />
          <Button
            label="Recolher"
            size="sm"
            variant="ghost"
            isDisabled={isDisabled}
            onClick={onCollapseAll}
          />
        </HStack>
        <CheckboxInput
          label="Só com FK"
          size="sm"
          value={onlyWithForeignKeys}
          onChange={onOnlyWithForeignKeysChange}
          isDisabled={isDisabled}
        />
      </HStack>
    </VStack>
  );
}
