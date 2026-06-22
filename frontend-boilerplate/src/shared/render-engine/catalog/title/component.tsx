/**
 * Bloco `title` — bloco NARRATIVO (sem dados). Renderiza um cabeçalho com o
 * texto/level/align vindos das props (não consome `data`).
 */
import { cn } from '@/shared/lib/utils';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type TitleProps = {
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  align?: 'left' | 'center' | 'right';
};

const LEVEL_TAG = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const;

const LEVEL_CLASS: Record<number, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-medium',
  5: 'text-base font-medium',
  6: 'text-sm font-medium uppercase tracking-wide',
};

const ALIGN_CLASS: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const Component: BlockComponent<TitleProps> = ({ props }) => {
  const level = props.level ?? 2;
  const Tag = LEVEL_TAG[level] ?? 'h2';
  const align = props.align ?? 'left';
  return (
    <Tag
      data-slot="block-title"
      className={cn('text-foreground', LEVEL_CLASS[level], ALIGN_CLASS[align])}
    >
      {props.text ?? ''}
    </Tag>
  );
};

export const definition = defineBlock<TitleProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
