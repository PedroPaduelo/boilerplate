/**
 * Bloco `rich_text` — bloco NARRATIVO (sem dados). Renderiza markdown vindo das
 * props como HTML SANITIZADO (ver ./markdown.ts). Não consome `data`.
 */
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';
import { renderMarkdown } from './markdown';

type RichTextProps = {
  markdown?: string;
};

export const Component: BlockComponent<RichTextProps> = ({ props }) => {
  const html = renderMarkdown(props.markdown);
  return (
    <div
      data-slot="block-rich-text"
      className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mt-0 [&_h2]:mt-0 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const definition = defineBlock<RichTextProps>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
