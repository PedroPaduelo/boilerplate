/**
 * Barra de ações do painel de configuração: abas à esquerda, a ação da aba
 * ativa à direita.
 *
 * Uma ação por aba (e não todas de uma vez) mantém a barra legível num painel
 * estreito e deixa claro sobre o que cada comando age.
 */
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import type { PlaygroundTab } from './types';

export interface PlaygroundToolbarProps {
  tab: PlaygroundTab;
  onTabChange: (tab: PlaygroundTab) => void;
  /** Modo live: a aba "Dados" roda a query em vez de restaurar a fixture. */
  isLive: boolean;
  isFetching: boolean;
  onRunQuery: () => void;
  onResetProps: () => void;
  onResetWrapper: () => void;
  onResetData: () => void;
  /**
   * O bloco declara `dataContract`? Só muda o TEXTO da ação: mesmo o bloco
   * narrativo tem o que restaurar, porque o JSON livre dele alimenta as
   * `{{variaveis}}` dos textos.
   */
  hasData: boolean;
}

export function PlaygroundToolbar({
  tab,
  onTabChange,
  isLive,
  isFetching,
  onRunQuery,
  onResetProps,
  onResetWrapper,
  onResetData,
  hasData,
}: PlaygroundToolbarProps) {
  return (
    <Toolbar
      label="Ações do playground"
      size="sm"
      variant="muted"
      startContent={
        <TabList
          value={tab}
          size="sm"
          onChange={(value) => onTabChange(value as PlaygroundTab)}
        >
          <Tab value="props" label="Propriedades" />
          <Tab value="wrapper" label="Cabeçalho" />
          <Tab value="data" label="Dados" />
        </TabList>
      }
      endContent={
        tab === 'props' ? (
          <Button
            label="Restaurar padrão"
            variant="ghost"
            size="sm"
            icon={<Icon icon={RotateCcw} />}
            tooltip="Volta as props para os valores padrão do bloco"
            onClick={onResetProps}
          />
        ) : tab === 'wrapper' ? (
          <Button
            label="Limpar insights"
            variant="ghost"
            size="sm"
            icon={<Icon icon={RotateCcw} />}
            tooltip="Remove as linhas de explicação e religa o SQL no rodapé"
            onClick={onResetWrapper}
          />
        ) : isLive ? (
          <Button
            label="Rodar query"
            variant="ghost"
            size="sm"
            icon={<Icon icon={Play} />}
            isLoading={isFetching}
            isDisabled={isFetching}
            tooltip={
              isFetching ? 'A query já está rodando' : 'Executa a query do gráfico'
            }
            onClick={onRunQuery}
          />
        ) : (
          <Button
            label="Restaurar dados"
            variant="ghost"
            size="sm"
            icon={<Icon icon={RotateCcw} />}
            tooltip={
              hasData
                ? 'Volta para a fixture padrão do bloco'
                : 'Volta para o JSON de exemplo que alimenta as variáveis'
            }
            onClick={onResetData}
          />
        )
      }
    />
  );
}
