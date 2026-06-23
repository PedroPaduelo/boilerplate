/**
 * Bloco `pin_3d` (layout/decorativo) — usa o Vitrine `PinContainer`. O card
 * é absolutamente posicionado pelo componente, então usamos um contêiner de
 * altura fixa que o centraliza.
 */
import { PinContainer } from '@/components/ui/3d-pin';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type Pin3DBlockProps = {
  pinLabel?: string;
  href?: string;
  title?: string;
  description?: string;
};

export const Component: BlockComponent<Pin3DBlockProps> = ({ props }) => {
  return (
    <div className="flex h-80 w-full items-center justify-center">
      <PinContainer title={props.pinLabel ?? 'vitrine'} href={props.href ?? '#'}>
        <div className="flex w-60 flex-col gap-2 p-1">
          <h3 className="text-base font-bold text-slate-100">{props.title ?? 'Título'}</h3>
          {props.description ? (
            <p className="text-sm text-slate-400">{props.description}</p>
          ) : null}
          <div className="mt-2 h-24 w-full rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500" />
        </div>
      </PinContainer>
    </div>
  );
};

export const definition = defineBlock<Pin3DBlockProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
