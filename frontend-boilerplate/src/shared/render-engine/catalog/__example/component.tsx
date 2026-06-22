/**
 * Componente do bloco de exemplo (só FE). Renderiza um cartão simples com o
 * `label` das props. Exporta `definition` (e `default`) — o registry descobre
 * este arquivo via import.meta.glob no padrão catalog/<type>/component.tsx.
 */
import { cn } from '@/shared/lib/utils';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type ExampleProps = { label?: string };

export const Component: BlockComponent<ExampleProps> = ({ props }) => {
  return (
    <div
      data-slot="block-example"
      className={cn('rounded-lg border border-border bg-card p-4 text-card-foreground')}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {manifest.name}
      </p>
      <p className="mt-1 text-sm font-medium">{props.label}</p>
    </div>
  );
};

export const definition = defineBlock<ExampleProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});

export default definition;
