/**
 * Renderiza markdown -> HTML SANITIZADO (análise narrativa do relatório).
 *
 * XSS é risco real: o markdown pode vir do agente de IA / edição. Usamos
 * `marked` (lib leve) para gerar HTML e `DOMPurify` para sanitizar ANTES de
 * injetar no DOM. Função PURA e testável (sem React) — o componente apenas a
 * consome via `dangerouslySetInnerHTML`.
 *
 * Garantias de sanitização (default do DOMPurify):
 *   - remove `<script>` / `<iframe>` / `<object>` etc.;
 *   - remove handlers inline (`onerror`, `onclick`, ...);
 *   - remove URLs perigosas (`javascript:`, `data:` executável).
 */
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/** Converte markdown em HTML seguro (string). Entrada vazia -> string vazia. */
export function renderMarkdown(markdown: string | undefined | null): string {
  if (!markdown) return '';
  // `async: false` garante retorno síncrono (string).
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    // Defesa extra: nunca permitir <script>/handlers (já é o default, explicitado).
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
  });
}
