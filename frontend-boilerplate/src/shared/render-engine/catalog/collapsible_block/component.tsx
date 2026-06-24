/**
 * Bloco `collapsible_block` — CONTAINER de layout colapsável.
 *
 * Cabeçalho clicável (via Vitrine `CollapsibleSection`) que expande/recolhe o
 * CORPO, onde ficam os SUB-BLOCOS. O `BlockRenderer` injeta o sub-grid de
 * filhos (já renderizados) via `children`; este componente só desenha o shell
 * (borda + header) e coloca `children` dentro do corpo colapsável.
 *
 * Sem filhos (galeria do catálogo), mostra um placeholder ilustrativo com
 * mini-cards no corpo para comunicar o conceito.
 */
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type CollapsibleBlockProps = { title?: string; defaultOpen?: boolean };

export const Component: BlockComponent<CollapsibleBlockProps> = ({ props, children }) => {
  return (
    <div className="rounded-lg border border-border">
      <CollapsibleSection
        title={props.title ?? 'Seção'}
        defaultOpen={props.defaultOpen ?? true}
        contentClassName="px-2 pb-3 pt-1"
      >
        {children ?? <CollapsiblePlaceholder />}
      </CollapsibleSection>
    </div>
  );
};

/** Placeholder do corpo (sem filhos) — comunica o conceito na galeria. */
function CollapsiblePlaceholder() {
  return (
    <div data-slot="collapsible-placeholder" className="grid grid-cols-12 gap-3">
      {[
        { span: 6, label: 'Gráfico' },
        { span: 6, label: 'Tabela' },
      ].map((item, i) => (
        <div
          key={i}
          className="col-span-12"
          style={{ gridColumn: `span ${item.span} / span ${item.span}` }}
        >
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export const definition = defineBlock<CollapsibleBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
