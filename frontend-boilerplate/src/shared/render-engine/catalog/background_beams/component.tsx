/**
 * Bloco `background_beams` (layout/decorativo) — usa o Vitrine `BackgroundBeams`
 * num contêiner de altura contida (h-56) com título por cima.
 */
import { BackgroundBeams } from '@/components/ui/background-beams';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type BackgroundBeamsBlockProps = { title?: string; subtitle?: string };

export const Component: BlockComponent<BackgroundBeamsBlockProps> = ({ props }) => {
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-lg bg-neutral-950">
      <BackgroundBeams />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <h3 className="text-xl font-semibold text-neutral-100 sm:text-2xl">
          {props.title ?? 'Título'}
        </h3>
        {props.subtitle ? (
          <p className="mt-2 max-w-md text-sm text-neutral-400">{props.subtitle}</p>
        ) : null}
      </div>
    </div>
  );
};

export const definition = defineBlock<BackgroundBeamsBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
