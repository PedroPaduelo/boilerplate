/**
 * Bloco `glowing_effect` (layout) — usa o Vitrine `GlowingEffect` envolvendo
 * um card de demo. O brilho intensifica ao mover o ponteiro sobre o card.
 */
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type GlowingEffectBlockProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'white';
};

export const Component: BlockComponent<GlowingEffectBlockProps> = ({ props }) => {
  return (
    <div className="relative h-56 w-full rounded-xl border border-border bg-card p-2">
      <GlowingEffect
        disabled={false}
        glow
        variant={props.variant ?? 'default'}
        spread={40}
        proximity={64}
        borderWidth={3}
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-2 rounded-lg px-6 text-center">
        <h3 className="text-lg font-semibold text-foreground">{props.title ?? 'Destaque'}</h3>
        {props.description ? (
          <p className="max-w-md text-sm text-muted-foreground">{props.description}</p>
        ) : null}
      </div>
    </div>
  );
};

export const definition = defineBlock<GlowingEffectBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
