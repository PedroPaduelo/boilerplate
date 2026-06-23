/**
 * Bloco `background_boxes` (layout/decorativo) — usa o Vitrine `Boxes` num
 * contêiner de altura contida (h-56) com máscara radial e título por cima.
 */
import { Boxes } from '@/components/ui/background-boxes';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BackgroundBoxesBlockProps = { title?: string; subtitle?: string };

export const Component: BlockComponent<BackgroundBoxesBlockProps> = ({ props }) => {
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-lg bg-slate-900">
      <div className="pointer-events-none absolute inset-0 z-20 h-full w-full bg-slate-900 [mask-image:radial-gradient(transparent,white)]" />
      <Boxes />
      <div className="pointer-events-none relative z-30 flex h-full flex-col items-center justify-center px-4 text-center">
        <h3 className="text-xl font-semibold text-neutral-100 sm:text-2xl">
          {props.title ?? 'Título'}
        </h3>
        {props.subtitle ? (
          <p className="mt-2 max-w-md text-sm text-neutral-300">{props.subtitle}</p>
        ) : null}
      </div>
    </div>
  );
};

export const definition = defineBlock<BackgroundBoxesBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
