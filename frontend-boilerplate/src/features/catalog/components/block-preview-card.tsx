/**
 * Card de UM bloco do catálogo: cabeçalho (nome + badges) + preview AO VIVO do
 * componente com dados mockados (via `BlockRenderer`) + rodapé com origem e
 * botão "Detalhes". O preview usa exatamente o mesmo motor de render do
 * dashboard real — o que aparece aqui é o que o usuário verá no relatório.
 */
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BlockRenderer } from '@/shared/render-engine';
import { KIND_LABEL, SHAPE_LABEL, type CatalogEntry } from '../lib/catalog-entries';

interface BlockPreviewCardProps {
  entry: CatalogEntry;
  onDetails: (entry: CatalogEntry) => void;
}

export function BlockPreviewCard({ entry, onDetails }: BlockPreviewCardProps) {
  const { definition, kind, shape, block, result, propsCount } = entry;
  const { manifest } = definition;

  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{manifest.name}</h3>
          <code className="text-xs text-muted-foreground">{manifest.type}</code>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Badge variant="secondary">{KIND_LABEL[kind]}</Badge>
          {shape ? <Badge variant="outline">{SHAPE_LABEL[shape]}</Badge> : null}
        </div>
      </div>

      {/* Preview ao vivo com dados de exemplo (fixture). */}
      <div className="flex min-h-[200px] items-center justify-center overflow-x-auto bg-muted/20 px-5 py-6">
        <div className="w-full">
          <BlockRenderer block={block} result={result} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3">
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {manifest.description}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onDetails(entry)}
        >
          Detalhes
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>

      <span className="sr-only">{propsCount} propriedades configuráveis</span>
    </Card>
  );
}
