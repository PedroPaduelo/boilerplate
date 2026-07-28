/**
 * Bloco `data_table` (shape 'table') — tabela rica: busca, ordenação e
 * paginação com o `Table` do Astryx e seus plugins headless.
 *
 * As três capacidades deixam de ser código do bloco e viram plugins do DS:
 *  - ORDENAÇÃO — `useTableSortableState` (estado + ordenação local, com
 *    comparadores por tipo) + `useTableSortable` (cabeçalhos clicáveis);
 *  - PAGINAÇÃO — `useTablePagination` (controles no rodapé) + `paginateData`;
 *  - BUSCA     — um `TextInput` controlado que filtra pelo valor EXIBIDO.
 *
 * A SELEÇÃO de linhas (`useTableSelection`) existe no DS mas NÃO foi ligada:
 * o bloco é de leitura e não tem ação em lote — checkbox sem destino seria UI
 * morta. Está a um hook de distância quando houver ação.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `05-tooltip-legenda-css.md` §4 + `01-fundamentos.md` §3/§4
 * ---------------------------------------------------------------------------
 * A referência cobre 18 GRÁFICOS e nenhuma tabela: não há layout de tabela para
 * copiar, só o VOCABULÁRIO (cor, tipografia, linha de divisão). Item a item da
 * checklist do briefing §4:
 *
 *  1. Grade só horizontal, tracejada 3 ....... numa tabela a grade É a divisão
 *     entre linhas: `dividers="rows"`, traço contínuo (aqui a linha separa
 *     conteúdo, não marca escala), na MESMA cor da grade dos gráficos —
 *     `--color-border` do DS resolve para `--ds-color-divider`, o token que
 *     `palette.chrome('grid')` lê (NOTAS `[SUB-12]`).
 *  2. Eixos sem linha e sem marcações ........ não se aplica (sem eixo)
 *  3. Texto dos eixos 12px/400 ............... o análogo é o RÓTULO DE COLUNA:
 *     12,25px/600 na cor secundária (`#637381`); corpo em 14px na cor
 *     principal (`#1C252E`). Ver `columns.tsx`.
 *  4. Linha 2,5px em curva suave ............. não se aplica
 *  5. Coluna com raio 4px .................... não se aplica
 *  6. Hover ESCURECE ......................... não há série pintada; o realce
 *     de linha é o `hasHover` do DS
 *  7. Tooltip branco 90% com blur ............ `textOverflow="truncate"` usa o
 *     tooltip do DS no texto cortado
 *  +  NÚMEROS com algarismos tabulares e alinhados à direita; zero hex/px de
 *     estilo — tudo sai de token do DS.
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (briefing §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: título/subtítulo/descrição/badge são do `BlockFrame`; o bloco
 *    NÃO desenha um segundo título.
 *  - DADOS: `data` alimenta a tabela E o escopo de `{{variaveis}}`
 *    (`buildChartScope(data)`), repassado ao rótulo de coluna e à célula.
 *  - TEXTO: rótulo de coluna e célula de texto passam por `ChartText`
 *    (Markdown inline + `{{variavel}}`). Célula numérica não passa: já é
 *    número formatado.
 *  - ESTADOS: `loading`/`skeleton` → esqueleto; `error` → aviso de erro; sem
 *    colunas → estado vazio; sem linhas (ou busca sem resultado) → estado
 *    vazio DENTRO da tabela, com a causa certa. Nunca uma tabela oca.
 *  - PARÂMETROS: `pageSize` e `filterPlaceholder` continuam com o mesmo efeito.
 */
import { useMemo, useState } from 'react';
import type { TableData } from '@dashboards/contracts';
import { Search } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import {
  Table,
  paginateData,
  useTablePagination,
  useTableSortable,
  useTableSortableState,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { ChartSkeleton, buildChartScope } from '@/shared/ui';
import { CHART_BODY_HEIGHT } from '../../lib/block-sizing';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import {
  buildColumns,
  buildComparators,
  filterRows,
  type ColumnSpec,
  type Row,
} from './columns';

type DataTableProps = {
  pageSize?: number;
  filterPlaceholder?: string;
};

export const Component: BlockComponent<DataTableProps, TableData> = ({
  props,
  data,
  state,
  error,
}) => {
  // Memoizados porque alimentam os `useMemo` abaixo: `?? []` cria um array novo
  // a cada render e invalidaria a filtragem/ordenação sem nenhum dado ter mudado.
  const specs = useMemo(() => (data?.columns ?? []) as ColumnSpec[], [data?.columns]);
  const rows = useMemo(() => (data?.rows ?? []) as Row[], [data?.rows]);
  const pageSize = props.pageSize ?? 5;

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Escopo de `{{variaveis}}` — derivado do dado, não do render, senão cada
  // digitação na busca recriaria as colunas.
  const scope = useMemo(() => buildChartScope(data), [data]);
  const columns = useMemo(() => buildColumns(specs, scope), [specs, scope]);
  const comparators = useMemo(() => buildComparators(specs), [specs]);
  const filtered = useMemo(() => filterRows(rows, specs, query), [rows, specs, query]);

  const { sortedData, sortConfig } = useTableSortableState<Row>({
    data: filtered,
    comparators,
  });
  const sortPlugin = useTableSortable<Row>(sortConfig);
  const paginationPlugin = useTablePagination<Row>({
    page,
    onPageChange: setPage,
    totalItems: sortedData.length,
    pageSize,
    size: 'sm',
    align: 'end',
    label: 'Paginação da tabela',
  });

  const pageRows = paginateData(sortedData, page, pageSize);

  // Estados antes do desenho: sem isto, um bloco renderizado FORA da moldura
  // (galeria, playground) desenharia uma tabela oca enquanto o dado não chega.
  if (state === 'loading' || state === 'skeleton') {
    return (
      <ChartSkeleton
        height={CHART_BODY_HEIGHT.table}
        label={`Carregando ${manifest.name}`}
      />
    );
  }

  if (state === 'error') {
    return (
      <Banner
        data-slot="data-table-error"
        status="error"
        title="Erro ao carregar o bloco"
        description={error}
      />
    );
  }

  // Sem colunas não há tabela para desenhar — nem barra de busca sobre o nada.
  if (specs.length === 0) {
    return (
      <EmptyState
        isCompact
        title="Nenhum resultado encontrado."
        description="A consulta deste bloco não retornou colunas."
        data-slot="data-table-empty"
      />
    );
  }

  return (
    <VStack gap={3} data-slot="data-table">
      <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
        <TextInput
          label="Filtrar registros"
          isLabelHidden
          size="sm"
          startIcon={Search}
          placeholder={props.filterPlaceholder ?? 'Filtrar…'}
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
        />
        <Text type="supporting" color="secondary" hasTabularNumbers>
          {sortedData.length} registro(s)
        </Text>
      </HStack>

      <Table<Row>
        data={pageRows}
        columns={columns}
        plugins={{ sort: sortPlugin, pagination: paginationPlugin }}
        density="compact"
        // A divisão entre linhas é a "grade" da tabela: só horizontal, na cor
        // da grade dos gráficos (`--color-border` → `--ds-color-divider`).
        dividers="rows"
        hasHover
        textOverflow="truncate"
        emptyState={
          <EmptyState
            isCompact
            title="Nenhum resultado encontrado."
            description={
              query.trim() === ''
                ? 'A consulta deste bloco não retornou linhas.'
                : 'Ajuste o filtro para ver outros registros.'
            }
            data-slot="data-table-empty"
          />
        }
      />
    </VStack>
  );
};

export const definition = defineBlock<DataTableProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
