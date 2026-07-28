/**
 * Markdown → HTML SANITIZADO. Fonte ÚNICA do app.
 *
 * XSS é risco real: o markdown pode vir do agente de IA ou da edição do
 * usuário. Usamos `marked` para gerar HTML e `DOMPurify` para sanitizar ANTES
 * de injetar no DOM. Funções PURAS e testáveis (sem React) — quem consome usa
 * `dangerouslySetInnerHTML`.
 *
 * Duas saídas, porque os dois usos são diferentes:
 *  - `renderMarkdown`  — documento (bloco `rich_text`): parágrafos, listas,
 *    títulos;
 *  - `renderInlineMarkdown` — UM texto curto dentro de um componente (título de
 *    card, rótulo, tooltip): só ênfase, código e link. Um `<h1>` dentro do
 *    título de um gráfico quebraria a hierarquia da tela.
 *
 * Garantias (default do DOMPurify, explicitadas): sem `<script>`/`<iframe>`,
 * sem handlers inline, sem URL executável.
 */
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/** Opções de sanitização compartilhadas pelos dois modos. */
const SANITIZE = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['style'],
};

/** Converte markdown de DOCUMENTO em HTML seguro. Entrada vazia → `''`. */
export function renderMarkdown(markdown: string | undefined | null): string {
  if (!markdown) return '';
  // `async: false` garante retorno síncrono (string).
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, { ...SANITIZE });
}

/**
 * Converte markdown INLINE em HTML seguro — sem parágrafo, sem título, sem
 * lista. Para os campos de texto de um bloco (título, subtítulo, rótulo).
 */
export function renderInlineMarkdown(markdown: string | undefined | null): string {
  if (!markdown) return '';
  const rawHtml = marked.parseInline(markdown, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ...SANITIZE,
    // Só o vocabulário inline: ênfase, código, link e quebra.
    ALLOWED_TAGS: ['em', 'strong', 'b', 'i', 'code', 'a', 'br', 'span', 'del', 's'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  });
}
