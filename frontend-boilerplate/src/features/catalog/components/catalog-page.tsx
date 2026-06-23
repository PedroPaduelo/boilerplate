/**
 * Página "Catálogo" — galeria de TODOS os componentes (blocos) disponíveis no
 * render-engine, cada um renderizado AO VIVO com dados mockados. Serve para
 * inspecionar o que existe (os mesmos blocos que o MCP oferece à IA) e o
 * potencial visual de cada um. Read-only, client-side.
 *
 * Organização: 7 categorias semânticas em ABAS (Tabs) + busca textual. A
 * taxonomia vive em `../lib/categories` (camada de UI, isolada do
 * `BlockManifest`/`kind` técnico do render-engine).
 */
import { useMemo, useState } from 'react';
import { Blocks, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/shared/lib/utils';
import { getCatalogEntries, type CatalogEntry } from '../lib/catalog-entries';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '../lib/categories';
import { BlockPreviewCard } from './block-preview-card';
import { BlockDetailDialog } from './block-detail-dialog';

type CategoryFilter = Category | 'all';

export function CatalogPage() {
  const entries = useMemo(() => getCatalogEntries(), []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [detail, setDetail] = useState<CatalogEntry | null>(null);

  // Abas por categoria (apenas as que têm ao menos 1 bloco), com contagem.
  const categoryFilters = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const e of entries) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    const present = CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0);
    return [
      { id: 'all' as CategoryFilter, label: 'Todas', count: entries.length },
      ...present.map((c) => ({
        id: c as CategoryFilter,
        label: CATEGORY_LABEL[c],
        count: counts.get(c) ?? 0,
      })),
    ];
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (!q) return true;
      const m = e.definition.manifest;
      return (
        m.name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [entries, category, search]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Render engine
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Catálogo de componentes
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Todos os blocos disponíveis para montar relatórios e dashboards — os mesmos
              que o agente (MCP) usa. Cada um aparece com{' '}
              <strong className="font-medium text-foreground">dados de exemplo</strong> para
              você avaliar o potencial.
            </p>
          </div>
          <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-sm">
            <Blocks className="size-4" />
            {entries.length} componentes
          </Badge>
        </div>
      </header>

      <div className="space-y-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar componente…"
            className="pl-8"
          />
        </div>
        <Tabs
          value={category}
          onValueChange={(v) => setCategory(v as CategoryFilter)}
          className="w-full"
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
            {categoryFilters.map((f) => (
              <TabsTrigger key={f.id} value={f.id} className="flex-none">
                {f.label}
                <span
                  className={cn(
                    'tabular-nums',
                    category === f.id ? 'opacity-70' : 'text-muted-foreground',
                  )}
                >
                  {f.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <BlockPreviewCard key={e.type} entry={e} onDetails={setDetail} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <Blocks className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum componente encontrado para “{search}”.
          </p>
        </div>
      )}

      <BlockDetailDialog entry={detail} onOpenChange={(open) => !open && setDetail(null)} />
    </div>
  );
}
