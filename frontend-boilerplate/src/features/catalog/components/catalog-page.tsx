/**
 * Página "Catálogo" — galeria de TODOS os componentes (blocos) disponíveis no
 * render-engine, cada um renderizado AO VIVO com dados mockados. Serve para
 * inspecionar o que existe (os mesmos blocos que o MCP oferece à IA) e o
 * potencial visual de cada um. Read-only, client-side.
 *
 * Organização: 7 categorias semânticas em abas + busca textual. A taxonomia
 * vive em `../lib/categories` (camada de UI, isolada do `BlockManifest`/`kind`
 * técnico do render-engine).
 *
 * O registry é síncrono (glob do Vite): não há estado de carregamento. Os
 * estados cobertos são registry vazio (erro de build/registro → `Banner`) e
 * busca sem resultado (`EmptyState` com ação para limpar o filtro).
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
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Heading, Text } from '@astryxdesign/core/Text';
import { getCatalogEntries, type CatalogEntry } from '../lib/catalog-entries';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '../lib/categories';
import { BlockPreviewCard } from './block-preview-card';
import { BlockDetailDialog } from './block-detail-dialog';

type CategoryFilter = Category | 'all';

function matchesSearch(entry: CatalogEntry, query: string): boolean {
  if (!query) return true;
  const { name, type, description } = entry.definition.manifest;
  return (
    name.toLowerCase().includes(query) ||
    type.toLowerCase().includes(query) ||
    (description ?? '').toLowerCase().includes(query)
  );
}

export function CatalogPage() {
  const entries = useMemo(() => getCatalogEntries(), []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [detail, setDetail] = useState<CatalogEntry | null>(null);

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
      (e) => (category === 'all' || e.category === category) && matchesSearch(e, query),
    );
  }, [entries, category, search]);

  return (
    <VStack gap={6}>
      <VStack gap={2}>
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
      </VStack>

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
            <TextInput
              label="Buscar componente"
              isLabelHidden
              value={search}
              placeholder="Buscar componente…"
              startIcon={Search}
              hasClear
              width={320}
              onChange={setSearch}
            />
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
          </VStack>

          {filtered.length > 0 ? (
            <Grid columns={{ minWidth: 340 }} gap={4}>
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
                  ? `Nada casa com “${search.trim()}” nesta categoria.`
                  : 'Nenhum bloco nesta categoria.'
              }
              actions={
                <Button
                  label="Limpar filtros"
                  variant="primary"
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                  }}
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
