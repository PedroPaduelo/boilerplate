/**
 * Bloco `table` (shape 'table') — tabela crua com colunas tipadas, montada com
 * o `Table` do Astryx em modo children (`TableRow`/`TableHeaderCell`/
 * `TableCell`): as colunas vêm do CONTRATO DE DADOS em runtime, então quem
 * decide o que é célula e o que é cabeçalho é o bloco, não uma definição
 * estática de coluna.
 *
 * `dense` vira DENSIDADE do DS (`compact`), não um tamanho de fonte solto.
 * Consulta sem linhas cai num `EmptyState` dentro do corpo — o cabeçalho
 * continua visível, então dá para ler o que foi consultado.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `05-tooltip-legenda-css.md` §4 + `01-fundamentos.md` §3/§4
 * ---------------------------------------------------------------------------
 * A referência cobre 18 GRÁFICOS e nenhuma tabela: não há layout de tabela para
 * copiar. O que se copia é o VOCABULÁRIO (cor, tipografia, linha de divisão),
 * item a item da checklist do briefing §4:
 *
 *  1. Grade só horizontal, tracejada 3 ....... numa tabela a grade É a divisão
 *     entre linhas: `dividers="rows"` (nada de divisão de coluna). Traço
 *     CONTÍNUO, não tracejado: aqui a linha separa conteúdo, não marca escala.
 *     Cor: a MESMA da grade dos gráficos — o `--color-border` do DS resolve
 *     para `--ds-color-divider`, que é exatamente o que `palette.chrome('grid')`
 *     lê (NOTAS `[SUB-12]`).
 *  2. Eixos sem linha e sem marcações ........ não se aplica (tabela não tem eixo)
 *  3. Texto dos eixos 12px/400 ............... o análogo é o RÓTULO DE COLUNA:
 *     `Text type="label" color="secondary"` = 12,25px/600/`#637381`, o mesmo
 *     degrau do subtítulo do card (§4 da referência). Corpo: 14px/`#1C252E`
 *     (`--ds-color-text-primary`), a cor de texto principal da §3.
 *  4. Linha 2,5px em curva suave ............. não se aplica (não há série)
 *  5. Coluna com raio 4px .................... não se aplica
 *  6. Hover ESCURECE ......................... não há série pintada para
 *     escurecer; o realce de linha é o `hasHover` do DS (sobreposição neutra)
 *  7. Tooltip branco 90% com blur ............ `textOverflow="truncate"` entrega
 *     o tooltip do DS no texto cortado (não há tooltip de série)
 *  +  NÚMEROS com algarismos tabulares e alinhados à direita, para lerem em
 *     coluna; zero hex/px de estilo — tudo sai de token do DS.
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (briefing §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: título/subtítulo/descrição/badge são do `BlockFrame`; o bloco
 *    NÃO desenha um segundo título dentro da tabela.
 *  - DADOS: `data` alimenta a tabela E o escopo de `{{variaveis}}`
 *    (`buildChartScope(data)`).
 *  - TEXTO: rótulo de coluna e célula de texto passam por `ChartText` —
 *    Markdown inline + `{{variavel}}`. Célula numérica não passa: já é um
 *    número formatado, e markdown só teria como estragá-lo.
 *  - ESTADOS: `loading`/`skeleton` → esqueleto; `error` → aviso de erro; sem
 *    colunas ou sem linhas → estado vazio. A tabela nunca aparece oca em
 *    silêncio (o `BlockFrame` cobre o mesmo por fora; isto é a rede de baixo,
 *    para quando o bloco é renderizado sem moldura — galeria, playground).
 *  - PARÂMETROS: `pageSize` e `dense` continuam com o mesmo efeito de sempre.
 */
import type { TableData } from '@dashboards/contracts';
import { Banner } from '@astryxdesign/core/Banner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { ChartSkeleton, ChartText, buildChartScope } from '@/shared/ui';
import type { ChartScope } from '@/shared/ui';
import { CHART_BODY_HEIGHT } from '../../lib/block-sizing';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TableProps = {
  pageSize?: number;
  dense?: boolean;
};

/**
 * Coluna/linha anotadas localmente (no FE, `TableData` de @dashboards/contracts
 * resolve p/ `any` porque `json-schema-to-ts` não é dependência do FE).
 */
type Column = {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
};
type Row = Record<string, unknown>;

/** Célula sem valor — o mesmo travessão da tabela acessível dos gráficos. */
const EMPTY_CELL = '—';

/**
 * Alinhamento da coluna numérica. Mora na CÉLULA, e não no texto, por dois
 * motivos: é onde o próprio DS o coloca no modo data-driven (`align` vira
 * `style` no `<th>`/`<td>`), e `text-overflow: ellipsis` — o corte do DS —
 * só age sobre conteúdo EM LINHA, então o texto precisa continuar inline.
 */
const END_ALIGN = { textAlign: 'end' } as const;

/**
 * Coluna de NÚMERO: alinha à direita e usa algarismos tabulares. É o que faz
 * uma coluna de valores ser lida como coluna (unidade sob unidade) em vez de
 * como uma lista de textos de larguras diferentes.
 */
function isNumeric(type?: Column['type']): boolean {
  return type === 'number';
}

function formatCell(value: unknown, type?: Column['type']): string {
  if (value == null) return EMPTY_CELL;
  if (type === 'number' && typeof value === 'number')
    return value.toLocaleString('pt-BR');
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

/**
 * Rótulo de coluna: 12,25px/600 na cor secundária (`#637381`) — o degrau de
 * "texto secundário" da referência. É o mesmo que o `TableHeaderCell` aplica
 * por padrão; declarado aqui para o papel do texto ser explícito no bloco e
 * não depender de herança.
 */
function HeaderLabel({ label, scope }: { label: string; scope: ChartScope }) {
  return (
    <Text type="label" color="secondary">
      <ChartText value={label} scope={scope} />
    </Text>
  );
}

/**
 * Célula do corpo: texto principal (`#1C252E`) no tamanho de corpo do DS.
 * Texto passa pelo contrato comum (Markdown + `{{variavel}}`); número vai cru
 * e tabular — markdown num número formatado só teria como estragá-lo.
 */
function BodyCellContent({
  value,
  type,
  scope,
}: {
  value: unknown;
  type?: Column['type'];
  scope: ChartScope;
}) {
  const numeric = isNumeric(type);
  const text = formatCell(value, type);

  return (
    <Text color="primary" hasTabularNumbers={numeric}>
      {numeric ? text : <ChartText value={text} scope={scope} />}
    </Text>
  );
}

/** Corpo vazio: uma linha única que atravessa todas as colunas. */
function EmptyRow({ columnCount }: { columnCount: number }) {
  return (
    <TableRow>
      <TableCell colSpan={columnCount}>
        <EmptyState
          isCompact
          title="Sem dados"
          description="A consulta deste bloco não retornou linhas."
          data-slot="table-empty"
        />
      </TableCell>
    </TableRow>
  );
}

export const Component: BlockComponent<TableProps, TableData> = ({
  props,
  data,
  state,
  error,
}) => {
  const columns = (data?.columns ?? []) as Column[];
  const allRows = (data?.rows ?? []) as Row[];
  const pageSize = props.pageSize ?? 10;
  const rows = allRows.slice(0, pageSize);
  const scope = buildChartScope(data);

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
        data-slot="table-error"
        status="error"
        title="Erro ao carregar o bloco"
        description={error}
      />
    );
  }

  // Sem colunas não há tabela para desenhar — só o estado vazio.
  if (columns.length === 0) {
    return (
      <EmptyState
        isCompact
        title="Sem dados"
        description="A consulta deste bloco não retornou colunas."
        data-slot="table-empty"
      />
    );
  }

  return (
    <Table
      data-slot="table"
      density={props.dense ? 'compact' : 'balanced'}
      // A divisão entre linhas é a "grade" da tabela: só horizontal, na cor da
      // grade dos gráficos (`--color-border` → `--ds-color-divider`).
      dividers="rows"
      hasHover
      textOverflow="truncate"
    >
      <TableHeader>
        <TableRow isHeaderRow>
          {columns.map((col) => (
            <TableHeaderCell
              key={col.key}
              scope="col"
              style={isNumeric(col.type) ? END_ALIGN : undefined}
            >
              <HeaderLabel label={col.label} scope={scope} />
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow columnCount={columns.length} />
        ) : (
          rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  style={isNumeric(col.type) ? END_ALIGN : undefined}
                >
                  <BodyCellContent value={row[col.key]} type={col.type} scope={scope} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export const definition = defineBlock<TableProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
