/**
 * Bloco `title` — bloco NARRATIVO (sem dados). Renderiza um cabeçalho com o
 * texto/level/align vindos das props (não consome `data`).
 *
 * Usa o `Heading` do design system — e NÃO Tailwind cru — de propósito: antes
 * era `text-3xl font-bold` / `text-2xl font-semibold` (a escala do Tailwind,
 * 30px/700), uma tipografia PARALELA que destoava de toda tela feita com o DS
 * e puxava o peso de \"cartaz\" que o resto do app evita. Com `Heading level=…`
 * o título nasce na MESMA escala retemperada do tema (Barlow em h1–h3, Public
 * Sans nos demais), igual ao título de página e à navegação lateral.
 */
import { Heading } from '@astryxdesign/core/Text';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TitleProps = {
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: 'left' | 'center' | 'right';
};

/**
 * `align` do bloco → `justify` do DS. O DS usa valores LÓGICOS (start/end) por
 * compatibilidade com RTL; o contrato do bloco (doc 20) mantém left/right.
 */
const JUSTIFY_BY_ALIGN = {
  left: 'start',
  center: 'center',
  right: 'end',
} as const;

export const Component: BlockComponent<TitleProps> = ({ props }) => {
  const level = props.level ?? 2;
  const align = props.align ?? 'left';
  return (
    <Heading level={level} justify={JUSTIFY_BY_ALIGN[align]} data-slot="block-title">
      {props.text ?? ''}
    </Heading>
  );
};

export const definition = defineBlock<TitleProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
