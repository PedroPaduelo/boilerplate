/**
 * Realce de sintaxe para o DDL do explorador de schema.
 *
 * A tokenização vive em `@/shared/lib/sql-tokenize` (lógica pura, testável).
 * Aqui só se pinta o resultado. Os identificadores vêm do banco do usuário,
 * então nada de `dangerouslySetInnerHTML`: renderizamos elementos React e o
 * escape acontece por construção.
 */

import * as React from 'react';

import { tokenizeSql, type SqlTokenKind } from '@/shared/lib/sql-tokenize';

/**
 * Cores fixas — o painel de DDL é sempre escuro (`bg-zinc-950`), então não há
 * variante clara a considerar. A paleta acompanha os acentos já usados no app.
 */
const TOKEN_CLASS: Record<SqlTokenKind, string> = {
  keyword: 'text-sky-400',
  identifier: 'text-zinc-100',
  type: 'text-emerald-400',
  string: 'text-amber-300',
  number: 'text-amber-300',
  function: 'text-violet-300',
  punctuation: 'text-zinc-500',
  plain: '',
};

/**
 * Renderiza SQL com realce. Devolve fragmentos: quem chama controla o `<pre>`
 * (e portanto a quebra de linha e o espaçamento).
 */
export function SqlHighlight({ code }: { code: string }) {
  const tokens = React.useMemo(() => tokenizeSql(code), [code]);
  return (
    <>
      {tokens.map((t, i) =>
        t.kind === 'plain' ? (
          <React.Fragment key={i}>{t.text}</React.Fragment>
        ) : (
          <span key={i} className={TOKEN_CLASS[t.kind]}>
            {t.text}
          </span>
        ),
      )}
    </>
  );
}
