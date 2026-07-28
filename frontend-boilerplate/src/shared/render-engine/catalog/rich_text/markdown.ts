/**
 * Reexporta a fonte ÚNICA de markdown do app (`@/shared/lib/markdown`).
 *
 * O renderizador nasceu aqui, dentro do bloco `rich_text`. Quando o contrato
 * comum do catálogo passou a exigir markdown + interpolação em TODO campo de
 * texto (título, subtítulo, rótulo, tooltip, rodapé), manter uma segunda cópia
 * garantiria divergência na primeira correção de sanitização. O módulo subiu
 * para `shared/lib`; este arquivo continua existindo para não quebrar o import
 * do bloco.
 */
export { renderMarkdown, renderInlineMarkdown } from '@/shared/lib/markdown';
