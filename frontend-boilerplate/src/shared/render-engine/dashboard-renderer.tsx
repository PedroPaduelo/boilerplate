/**
 * DashboardRenderer — motor de render base (doc 03 / doc 32 §4).
 *
 * Recebe um `DashboardLayout` ({ filters, rows }) + (opcional) o payload de
 * DADOS batch e renderiza a tela: barra de filtros + linhas de blocos. Cada
 * bloco é resolvido pelo registry via `BlockRenderer`; tipos desconhecidos caem
 * no aviso do próprio bloco, então um layout com um tipo novo nunca derruba a
 * tela inteira.
 *
 * A `row` do contrato é literalmente A LINHA de que trata a regra de
 * composição: seus blocos são distribuídos em faixas IGUAIS e a linha recebe um
 * degrau de altura derivado dos tipos que ela contém (ver `block-grid`). É por
 * isso que o renderer não escolhe largura por bloco — quem escolhe é a linha.
 */
import type {
  DashboardLayout,
  DashboardDataPayload,
  Filter,
  Row,
} from '@dashboards/contracts';
import { resolveDashboardTheme, resolveRowLayout } from '@dashboards/contracts';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { BlockGrid } from './block-grid';
import type { BlockHeight } from './lib/block-sizing';
import type { BlockItemSizing } from './lib/layout-options';
import { BlockRenderer } from './block-renderer';

export interface DashboardRendererProps {
  layout: DashboardLayout;
  /** Payload de dados batch (mapa blockId → resultado). Opcional. */
  data?: DashboardDataPayload;
  /**
   * Aplica a moldura (`BlockFrame`) nos blocos de visualização. Default
   * `true` (dashboard real). A GALERIA do catálogo passa `false`.
   */
  framed?: boolean;
  /**
   * Como a largura dos blocos de cada linha é decidida. Default `equal`:
   * faixas iguais, sem um bloco maior que o vizinho.
   *
   * `span` restaura a leitura literal do `span` (grid de 12 colunas) para
   * telas que precisem reproduzir um layout assimétrico salvo — é uma saída
   * consciente, não o caminho normal.
   */
  itemSizing?: BlockItemSizing;
  className?: string;
}

export function DashboardRenderer({
  layout,
  data,
  framed = true,
  itemSizing = 'equal',
  className,
}: DashboardRendererProps) {
  /*
   * Aparência declarada pelo DASHBOARD (`layout.theme`). Aqui só interessam
   * `accent` e `palette`, que viram o padrão dos blocos que não escolheram cor
   * — é o que dá identidade cromática a um painel inteiro com um campo, em vez
   * de repetir `accent` em quinze blocos. O `colorMode` é decisão da TELA (só
   * ela sabe se o usuário já escolheu um tema), não do motor de render.
   */
  const theme = resolveDashboardTheme(layout);

  return (
    <VStack gap={6} data-slot="dashboard" className={className}>
      {layout.filters.length > 0 ? (
        <HStack gap={2} wrap="wrap" vAlign="center" data-slot="dashboard-filters">
          {layout.filters.map((filter: Filter) => (
            <Token
              key={filter.id}
              label={filter.label ?? filter.id}
              description={`Filtro do tipo ${filter.type}`}
              size="sm"
              data-testid="dashboard-filter"
            />
          ))}
        </HStack>
      ) : null}

      {layout.rows.map((row: Row) => {
        // Composição DECLARADA na linha, normalizada pelo contrato. A linha é
        // a unidade de decisão de layout (ver `block-grid`), então é ela — e
        // não o bloco — que diz quantas faixas existem e se a largura é igual
        // para todos ou dirigida pelo `span`.
        const rowLayout = resolveRowLayout(row);
        return (
          <VStack key={row.id} gap={3} as="section" data-slot="dashboard-row">
            {row.title ? <Heading level={2}>{row.title}</Heading> : null}
            {row.description ? (
              <Text type="supporting" color="secondary" maxLines={2}>
                {row.description}
              </Text>
            ) : null}
            <BlockGrid
              blocks={row.blocks}
              // Altura DECLARADA na linha (editor / agente). Ausente, o grid
              // deriva dos tipos — o comportamento que sempre houve.
              rowHeight={(row as { height?: BlockHeight }).height}
              columns={rowLayout.columns}
              // O `itemSizing` da LINHA vence o da tela: a tela declara o
              // padrão do contexto (dashboard, galeria), a linha declara a
              // exceção editorial. Sem linha declarando, nada muda.
              itemSizing={rowLayout.itemSizing === 'span' ? 'span' : itemSizing}
              renderBlock={(block, declaredHeight) => (
                <BlockRenderer
                  block={block}
                  data={data}
                  result={data?.blocks?.[block.id]}
                  framed={framed}
                  themeDefaults={theme}
                  declaredHeight={declaredHeight}
                />
              )}
              slot="dashboard-grid"
              cellSlot="dashboard-cell"
            />
          </VStack>
        );
      })}
    </VStack>
  );
}
