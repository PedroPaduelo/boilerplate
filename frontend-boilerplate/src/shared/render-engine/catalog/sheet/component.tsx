/**
 * Bloco `sheet` (layout) — CONTAINER em painel lateral deslizante.
 *
 * Usa o mecanismo de container do render-engine: o `BlockRenderer` injeta
 * `childBlocks` (sub-blocos crus) + `renderChild` (renderiza 1 filho). Este
 * componente desenha apenas o GATILHO (um `Button`); ao clicar, abre o
 * painel lateral (Vitrine `Sheet`) e renderiza os FILHOS DENTRO dele,
 * empilhados (via `renderChild`). Assim a IA monta `block.blocks` com a MESMA
 * sintaxe do dashboard/section, e o conteúdo detalhado fica escondido no
 * painel até o usuário abrir.
 *
 * Sem filhos (galeria do catálogo), o painel abre com um placeholder
 * ilustrativo, comunicando o conceito.
 */
import type { Block } from '@dashboards/contracts';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';
type SheetBlockProps = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  side?: SheetSide;
};

export const Component: BlockComponent<SheetBlockProps> = ({
  props,
  childBlocks,
  renderChild,
}) => {
  const side = props.side ?? 'right';
  const hasChildren = Boolean(childBlocks?.length && renderChild);

  return (
    <div className="flex items-center justify-center py-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">{props.triggerLabel ?? 'Abrir painel'}</Button>
        </SheetTrigger>
        <SheetContent side={side}>
          <SheetHeader>
            {props.title ? <SheetTitle>{props.title}</SheetTitle> : null}
            {props.description ? (
              <SheetDescription>{props.description}</SheetDescription>
            ) : null}
          </SheetHeader>

          {/* Corpo rolável: os FILHOS do container, empilhados. */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            {hasChildren ? (
              (childBlocks as Block[]).map((child) => (
                <div key={child.id} className="min-w-0">
                  {renderChild!(child)}
                </div>
              ))
            ) : (
              <SheetPlaceholder />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

/** Placeholder do painel (sem filhos) — comunica o conceito na galeria. */
function SheetPlaceholder() {
  return (
    <div className="space-y-3">
      {['Gráfico de detalhe', 'Tabela de apoio', 'Notas'].map((label) => (
        <div
          key={label}
          className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-xs text-muted-foreground"
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export const definition = defineBlock<SheetBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
