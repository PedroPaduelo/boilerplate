/**
 * Página "Catálogo" — galeria de TODOS os blocos do render-engine, cada um
 * renderizado AO VIVO com dados de exemplo. É o mesmo catálogo que o agente
 * enxerga via MCP (`list_catalog`), então ela responde duas perguntas: "o que
 * existe para montar um relatório?" e "o que a IA pode escolher?".
 *
 * DOIS EIXOS DE FILTRO, porque são duas perguntas diferentes:
 *   - CATEGORIA (abas) — "para que serve?" (comparar, destacar um número,
 *     listar registros, agrupar, enfeitar, narrar).
 *   - FORMATO DO DADO (`shape`) — "serve para o dado que eu tenho?". É o
 *     vocabulário do `dataContract` (scalar | series | categorical | table),
 *     o mesmo que a IA precisa respeitar ao escrever a query. Sem ele, quem
 *     tem uma série temporal precisava abrir bloco por bloco para descobrir
 *     quais aceitam série.
 *
 * O registry é síncrono (glob do Vite): não há estado de carregamento. Os
 * estados cobertos são registry vazio (erro de build/registro → `Banner`) e
 * filtro sem resultado (`EmptyState` com ação para limpar).
 */
import { useMemo, useState } from 'react';
import { Blocks, Search } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Heading, Text } from '@astryxdesign/core/Text';
import type { DataShape } from '@dashboards/contracts';
import {
  getCatalogEntries,
  SHAPE_LABEL,
  type CatalogEntry,
} from '../lib/catalog-entries';
import {
  CATEGORIES,
  CATEGORY_HINT,
  CATEGORY_LABEL,
  type Category,
} from '../lib/categories';
import { BlockPreviewCard } from './block-preview-card';
import { BlockDetailDialog } from './block-detail-dialog';

type CategoryFilter = Category | 'all';
/** `none` = blocos narrativos/decorativos, que não consomem dados. */
type ShapeFilter = DataShape | 'none' | 'all';

/**
 * Largura mínima de um card. Abaixo disso um gráfico com eixo e legenda fica
 * ilegível — é o piso da miniatura, não uma preferência estética.
 */
const CARD_MIN_WIDTH = 300;

/**
 * Teto de colunas. Sem ele, um monitor ultra-largo produz sete colunas de
 * miniaturas apertadas; a leitura de uma galeria piora quando a linha fica
 * longa demais para o olho percorrer.
 */
const CARD_MAX_COLUMNS = 4;

const SHAPE_OPTIONS: { value: ShapeFilter; label: string }[] = [
  { value: 'all', label: 'Qualquer formato' },
  { value: 'scalar', label: SHAPE_LABEL.scalar },
  { value: 'series', label: SHAPE_LABEL.series },
  { value: 'categorical', label: SHAPE_LABEL.categorical },
  { value: 'table', label: SHAPE_LABEL.table },
  { value: 'none', label: 'Sem dados' },
];

function matchesSearch(entry: CatalogEntry, query: string): boolean {
  if (!query) return true;
  const { name, type, description } = entry.definition.manifest;
  return (
    name.toLowerCase().includes(query) ||
    type.toLowerCase().includes(query) ||
    (description ?? '').toLowerCase().includes(query)
  );
}

function matchesShape(entry: CatalogEntry, shape: ShapeFilter): boolean {
  if (shape === 'all') return true;
  if (shape === 'none') return !entry.shape;
  return entry.shape === shape;
}

export function CatalogPage() {
  const entries = useMemo(() => getCatalogEntries(), []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [shape, setShape] = useState<ShapeFilter>('all');
  const [detail, setDetail] = useState<CatalogEntry | null>(null);

  const isFiltered = search.trim() !== '' || category !== 'all' || shape !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setShape('all');
  };

  // Abas por categoria (apenas as que têm ao menos 1 bloco), com contagem.
  const tabs = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const e of entries) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    return [
      { id: 'all' as CategoryFilter, label: 'Todas', count: entries.length },
      ...CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0).map((c) => ({
        id: c as CategoryFilter,
        label: CATEGORY_LABEL[c],
        count: counts.get(c) ?? 0,
      })),
    ];
  }, [entries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (category === 'all' || e.category === category) &&
        matchesShape(e, shape) &&
        matchesSearch(e, query),
    );
  }, [entries, category, shape, search]);

  return (
    <VStack gap={6}>
      <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
        <VStack gap={1}>
          <Heading level={2}>Catálogo de componentes</Heading>
          <Text type="supporting">
            Todos os blocos disponíveis para montar relatórios e dashboards — os mesmos
            que o agente (MCP) usa. Cada um aparece com dados de exemplo.
          </Text>
        </VStack>
        <Badge
          variant="neutral"
          icon={<Icon icon={Blocks} size="sm" />}
          label={`${entries.length} componentes`}
        />
      </HStack>

      {entries.length === 0 ? (
        <Banner
          status="error"
          title="Nenhum bloco registrado"
          description="O registry do render-engine voltou vazio. Recarregue a página; se persistir, o build do catálogo falhou."
          endContent={
            <Button
              label="Recarregar"
              size="sm"
              onClick={() => window.location.reload()}
            />
          }
        />
      ) : (
        <>
          <VStack gap={3}>
            <HStack gap={3} wrap="wrap" vAlign="end">
              <TextInput
                label="Buscar componente"
                isLabelHidden
                value={search}
                placeholder="Buscar por nome, tipo ou descrição…"
                startIcon={Search}
                hasClear
                width={320}
                onChange={setSearch}
              />
              <Selector
                label="Formato do dado"
                isLabelHidden
                width={200}
                value={shape}
                options={SHAPE_OPTIONS}
                onChange={(value) => setShape(value as ShapeFilter)}
              />
              {isFiltered ? (
                <Button label="Limpar filtros" variant="ghost" onClick={clearFilters} />
              ) : null}
            </HStack>

            <TabList
              value={category}
              hasDivider
              onChange={(value) => setCategory(value as CategoryFilter)}
            >
              {tabs.map((t) => (
                <Tab
                  key={t.id}
                  value={t.id}
                  label={t.label}
                  endContent={<Badge variant="neutral" label={t.count} />}
                />
              ))}
            </TabList>

            {/* A dica da categoria mora aqui, e não dentro de cada card: é uma
                propriedade do GRUPO, e repeti-la por card seria ruído. */}
            <HStack gap={2} justify="between" vAlign="center" wrap="wrap">
              <Text type="supporting">
                {category === 'all'
                  ? 'Todos os blocos registrados, agrupados por finalidade.'
                  : CATEGORY_HINT[category]}
              </Text>
              <Text type="supporting" color="secondary" hasTabularNumbers>
                {filtered.length === entries.length
                  ? `${entries.length} blocos`
                  : `${filtered.length} de ${entries.length} blocos`}
              </Text>
            </HStack>
          </VStack>

          {filtered.length > 0 ? (
            <Grid
              columns={{ minWidth: CARD_MIN_WIDTH, max: CARD_MAX_COLUMNS }}
              gap={4}
              align="stretch"
            >
              {filtered.map((entry) => (
                <BlockPreviewCard key={entry.type} entry={entry} onDetails={setDetail} />
              ))}
            </Grid>
          ) : (
            <EmptyState
              icon={<Icon icon={Search} size="lg" />}
              title="Nenhum componente encontrado"
              description={
                search.trim()
                  ? `Nada casa com “${search.trim()}” nos filtros atuais.`
                  : 'Nenhum bloco combina com os filtros atuais.'
              }
              /* Rótulo diferente do "Limpar filtros" da barra de propósito: o
                 mesmo comando com dois nomes é confuso, e o mesmo NOME em dois
                 lugares da mesma tela é pior — quem lê não sabe se são ações
                 distintas. Aqui o texto descreve o DESTINO ("ver todos"), que é
                 o que interessa a quem chegou num resultado vazio. */
              actions={
                <Button
                  label="Ver todos os componentes"
                  variant="primary"
                  onClick={clearFilters}
                />
              }
            />
          )}
        </>
      )}

      <BlockDetailDialog entry={detail} onOpenChange={() => setDetail(null)} />
    </VStack>
  );
}
