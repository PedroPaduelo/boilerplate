/**
 * Bloco `invoice_table` (shape 'table') — itens de fatura no `Table` do Astryx.
 *
 * Lê as linhas como itens {label, qty, unit}, calcula o valor da linha
 * (qty × unit) e fecha com o TOTAL num `TableFooter` — o rodapé é parte da
 * anatomia da tabela do DS, não uma linha "quase igual às outras".
 *
 * Números usam algarismos tabulares (`hasTabularNumbers`) e alinhamento à
 * direita, para as colunas de valor lerem em coluna.
 *
 * ---------------------------------------------------------------------------
 * CONFORMIDADE VISUAL — `05-tooltip-legenda-css.md` §4 + `01-fundamentos.md` §3/§4
 * ---------------------------------------------------------------------------
 * A referência cobre 18 GRÁFICOS e nenhuma tabela: não há layout de fatura para
 * copiar, só o VOCABULÁRIO (cor, tipografia, linha de divisão). Item a item da
 * checklist do briefing §4:
 *
 *  1. Grade só horizontal, tracejada 3 ....... numa tabela a grade É a divisão
 *     entre linhas: `dividers="rows"`, traço contínuo, na MESMA cor da grade
 *     dos gráficos. A regra acima do TOTAL sai literalmente de
 *     `palette.chrome('grid')` — o DS entrega `<tfoot>` sem estilo e suprime a
 *     borda da última linha do corpo, então sem ela o total encostaria nos
 *     itens (NOTAS `[SUB-12]`).
 *  2. Eixos sem linha e sem marcações ........ não se aplica (sem eixo)
 *  3. Texto dos eixos 12px/400 ............... o análogo é o RÓTULO DE COLUNA:
 *     `Text type="label" color="secondary"` = 12,25px/600/`#637381`, o mesmo
 *     degrau do subtítulo do card (§05-4). Corpo em 14px na cor principal
 *     (`#1C252E`); o TOTAL é o mesmo corpo em peso 600 — ênfase por peso, não
 *     por cor nova.
 *  4. Linha 2,5px em curva suave ............. não se aplica
 *  5. Coluna com raio 4px .................... não se aplica
 *  6. Hover ESCURECE ......................... não há série pintada para
 *     escurecer; a fatura também não tem realce de linha (é um documento, não
 *     uma lista navegável)
 *  7. Tooltip branco 90% com blur ............ não se aplica (sem tooltip)
 *  +  cabeçalho da coluna numérica alinhado à direita, SOBRE os números;
 *     zero hex/px de estilo — tudo sai de token do DS.
 *
 * ---------------------------------------------------------------------------
 * CONTRATO COMUM (briefing §5)
 * ---------------------------------------------------------------------------
 *  - CABEÇALHO: título/subtítulo/descrição/badge são do `BlockFrame`; o bloco
 *    NÃO desenha um segundo título.
 *  - DADOS: `data` alimenta a fatura E o escopo de `{{variaveis}}`
 *    (`buildChartScope(data)`).
 *  - TEXTO: rótulo de coluna e descrição do item passam por `ChartText`
 *    (Markdown inline + `{{variavel}}`). Quantidade e valor não passam: já são
 *    números formatados.
 *  - ESTADOS: `loading`/`skeleton` → esqueleto; `error` → aviso de erro; sem
 *    itens → estado vazio no lugar da tabela. Nunca uma fatura oca.
 *  - PARÂMETROS: `currency` continua com o mesmo efeito (prefixo do valor).
 */
import type { TableData } from '@dashboards/contracts';
import { Banner } from '@astryxdesign/core/Banner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { ChartSkeleton, ChartText, buildChartScope, useChartPalette } from '@/shared/ui';
import type { ChartScope } from '@/shared/ui';
import { CHART_BODY_HEIGHT } from '../../lib/block-sizing';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type InvoiceProps = { currency?: string };
type Row = Record<string, unknown>;

const CURRENCY_PREFIX: Record<string, string> = { BRL: 'R$ ', USD: '$ ', EUR: '€ ' };

/**
 * Alinhamento das colunas de número. Mora na CÉLULA, e não no texto: é onde o
 * próprio DS o coloca no modo data-driven, e mantém o conteúdo EM LINHA (que é
 * o que o corte com reticências do DS exige).
 */
const END_ALIGN = { textAlign: 'end' } as const;

/**
 * Rótulo de coluna: 12,25px/600 na cor secundária (`#637381`) — o degrau de
 * "texto secundário" da referência, e o mesmo que o `TableHeaderCell` aplica
 * por padrão. Declarado aqui para o papel do texto ser explícito no bloco.
 */
function HeaderLabel({ label, scope }: { label: string; scope: ChartScope }) {
  return (
    <Text type="label" color="secondary">
      <ChartText value={label} scope={scope} />
    </Text>
  );
}

/** Número com algarismos de largura fixa (a célula é quem alinha). */
function Amount({ children, isTotal }: { children: string; isTotal?: boolean }) {
  return (
    <Text color="primary" hasTabularNumbers weight={isTotal ? 'semibold' : 'normal'}>
      {children}
    </Text>
  );
}

export const Component: BlockComponent<InvoiceProps, TableData> = ({
  props,
  data,
  state,
  error,
}) => {
  const palette = useChartPalette();
  const rows = (data?.rows ?? []) as Row[];
  const scope = buildChartScope(data);
  const items = rows.map((r) => ({
    label: String(r.label ?? ''),
    qty: Number(r.qty ?? 0),
    unit: Number(r.unit ?? 0),
  }));
  const total = items.reduce((sum, i) => sum + i.qty * i.unit, 0);
  const prefix = CURRENCY_PREFIX[props.currency ?? 'BRL'] ?? '';
  const formatValue = (v: number) => `${prefix}${v.toLocaleString('pt-BR')}`;

  /**
   * Regra acima do TOTAL. O `<tfoot>` do DS não tem estilo próprio e a última
   * linha do corpo tem a borda suprimida — sem esta regra o total encosta nos
   * itens. A cor é a MESMA da grade dos gráficos, lida do tema pelo
   * `useChartPalette` (forma `var()`, porque isto é DOM, não SVG).
   */
  const totalRule = {
    borderTop: `var(--border-width) solid ${palette.chromeVar('grid')}`,
  };

  // Estados antes do desenho: sem isto, um bloco renderizado FORA da moldura
  // (galeria, playground) desenharia uma fatura oca enquanto o dado não chega.
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
        data-slot="invoice-table-error"
        status="error"
        title="Erro ao carregar o bloco"
        description={error}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        isCompact
        title="Fatura sem itens"
        description="A consulta deste bloco não retornou linhas."
        data-slot="invoice-table-empty"
      />
    );
  }

  return (
    <Table
      data-slot="invoice-table"
      density="compact"
      // A divisão entre linhas é a "grade" da tabela: só horizontal, na cor da
      // grade dos gráficos (`--color-border` → `--ds-color-divider`).
      dividers="rows"
    >
      <TableHeader>
        <TableRow isHeaderRow>
          <TableHeaderCell scope="col">
            <HeaderLabel label="Item" scope={scope} />
          </TableHeaderCell>
          <TableHeaderCell scope="col" style={END_ALIGN}>
            <HeaderLabel label="Qtd." scope={scope} />
          </TableHeaderCell>
          <TableHeaderCell scope="col" style={END_ALIGN}>
            <HeaderLabel label="Valor" scope={scope} />
          </TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.label}>
            <TableCell>
              <Text color="primary">
                <ChartText value={item.label} scope={scope} />
              </Text>
            </TableCell>
            <TableCell style={END_ALIGN}>
              <Amount>{item.qty.toLocaleString('pt-BR')}</Amount>
            </TableCell>
            <TableCell style={END_ALIGN}>
              <Amount>{formatValue(item.qty * item.unit)}</Amount>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2} style={totalRule}>
            <Text color="primary" weight="semibold">
              Total
            </Text>
          </TableCell>
          <TableCell style={{ ...totalRule, ...END_ALIGN }}>
            <Amount isTotal>{formatValue(total)}</Amount>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};

export const definition = defineBlock<InvoiceProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
