/**
 * BlockPlayground — playground REUTILIZÁVEL de um bloco do render-engine.
 *
 * Duas telas, o mesmo componente (paridade visual garantida):
 *   - `/catalog` (`variant="dialog"`) — galeria read-only com fixtures;
 *   - `/charts/:id` (`variant="page"`) — edição de um gráfico REAL, com os
 *     DADOS vindos da query (`live`) e persistência feita pela página, que lê o
 *     estado por `onChange`.
 *
 *   ┌──────────────────────────┬───────────────────────────────┐
 *   │  PREVIEW AO VIVO         │  Propriedades │ Cabeçalho │ Dados │
 *   │  (BlockRenderer framed)  │  (painel de configuração)     │
 *   └──────────────────────────┴───────────────────────────────┘
 *
 * Este arquivo só ORQUESTRA: o estado mora nos hooks (`use-playground-config`,
 * `use-playground-data`), as funções puras em `playground-helpers` e cada
 * painel no seu próprio arquivo.
 */
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Layout,
  LayoutContent,
  LayoutPanel,
  StackItem,
  VStack,
} from '@astryxdesign/core/Layout';
import { getFixtureVariants } from '../../lib/block-fixtures';
import type { CatalogEntry } from '../../lib/catalog-entries';
import { PlaygroundDataPanel } from './playground-data-panel';
import { PlaygroundPreview } from './playground-preview';
import { PlaygroundPropsPanel } from './playground-props-panel';
import { PlaygroundTakeawaysEditor } from './playground-takeaways-editor';
import { PlaygroundToolbar } from './playground-toolbar';
import { PlaygroundWrapperPanel } from './playground-wrapper-panel';
import {
  buildPreviewBlock,
  buildPreviewResult,
  fieldsFromSchema,
  isFramedChart,
  previewPropsFor,
} from './playground-helpers';
import { usePlaygroundConfig } from './use-playground-config';
import { usePlaygroundData } from './use-playground-data';
import type {
  LiveData,
  PlaygroundSeed,
  PlaygroundSnapshot,
  PlaygroundTab,
} from './types';

export interface BlockPlaygroundProps {
  entry: CatalogEntry;
  /** `dialog` (catálogo, dentro do Dialog) | `page` (tela do gráfico). */
  variant?: 'dialog' | 'page';
  /** Conteúdo do slot de cabeçalho do Layout (ex.: `DialogHeader`). */
  header?: ReactNode;
  /** Valores iniciais (props/título/query/…). Default: defaults do bloco. */
  seed?: PlaygroundSeed;
  /** Quando presente, o painel "Dados" reflete a query real (sem fixtures). */
  live?: LiveData;
  /** Reporta o estado editável atual (para a página salvar). */
  onChange?: (snapshot: PlaygroundSnapshot) => void;
}

/** Largura do inspetor de configuração — estreito o bastante para o preview mandar. */
const PANEL_WIDTH = 420;

export function BlockPlayground({
  entry,
  variant = 'dialog',
  header,
  seed,
  live,
  onChange,
}: BlockPlaygroundProps) {
  const { manifest } = entry.definition;
  const isLive = Boolean(live);
  const [tab, setTab] = useState<PlaygroundTab>('props');

  const fields = useMemo(() => fieldsFromSchema(manifest), [manifest]);
  const variants = useMemo(
    () => (isLive ? [] : getFixtureVariants(manifest.type)),
    [manifest.type, isLive],
  );

  const data = usePlaygroundData({ entry, variants, live });
  const { config, patch, setProp, resetProps, resetTakeaways } = usePlaygroundConfig({
    manifest,
    seed,
    previewProps: previewPropsFor(manifest.type),
    liveDurationMs: data.liveDurationMs,
  });

  const showTakeaways = isFramedChart(entry);

  const block = useMemo(
    () => buildPreviewBlock(manifest.type, config, showTakeaways),
    [manifest.type, config, showTakeaways],
  );
  const result = useMemo(
    () =>
      buildPreviewResult(
        entry,
        data.parsedData,
        Boolean(data.dataError),
        config.durationMs,
        config.previewState,
      ),
    [entry, data.parsedData, data.dataError, config.durationMs, config.previewState],
  );

  // A página do gráfico persiste este snapshot ao clicar em "Salvar".
  useEffect(() => {
    onChange?.({ ...config, dataText: data.dataText });
  }, [config, data.dataText, onChange]);

  return (
    <Layout
      height={variant === 'dialog' ? 'fill' : 'auto'}
      header={header}
      content={
        <LayoutContent padding={0} label="Pré-visualização do bloco">
          <PlaygroundPreview
            entry={entry}
            block={block}
            result={result}
            state={config.previewState}
            data={data.parsedData}
          />
        </LayoutContent>
      }
      end={
        <LayoutPanel
          hasDivider
          padding={0}
          width={PANEL_WIDTH}
          label="Configuração do bloco"
        >
          <VStack gap={0}>
            <PlaygroundToolbar
              tab={tab}
              onTabChange={setTab}
              isLive={isLive}
              isFetching={Boolean(live?.isFetching)}
              hasData={entry.hasData}
              onRunQuery={() => live?.onRun()}
              onResetProps={resetProps}
              onResetWrapper={resetTakeaways}
              onResetData={data.resetData}
            />
            <StackItem size="fill">
              <VStack gap={5} padding={4}>
                {tab === 'props' ? (
                  <PlaygroundPropsPanel
                    fields={fields}
                    values={config.props}
                    onPropChange={setProp}
                  />
                ) : null}

                {tab === 'wrapper' ? (
                  <>
                    <PlaygroundWrapperPanel
                      config={config}
                      onPatch={patch}
                      titlePlaceholder={manifest.name}
                      isTitleRequired={variant === 'page'}
                      isLive={isLive}
                      data={data.parsedData}
                      badgeLabel={manifest.name}
                    />
                    {showTakeaways ? (
                      <PlaygroundTakeawaysEditor
                        definition={entry.definition}
                        data={data.parsedData}
                        items={config.takeaways}
                        onChange={(takeaways) => patch({ takeaways })}
                      />
                    ) : null}
                  </>
                ) : null}

                {tab === 'data' ? (
                  <PlaygroundDataPanel
                    entry={entry}
                    variants={variants}
                    data={data}
                    isLive={isLive}
                    isFetching={Boolean(live?.isFetching)}
                    onRunQuery={() => live?.onRun()}
                  />
                ) : null}
              </VStack>
            </StackItem>
          </VStack>
        </LayoutPanel>
      }
    />
  );
}
