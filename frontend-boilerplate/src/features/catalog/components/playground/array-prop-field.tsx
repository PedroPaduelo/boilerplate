/**
 * Editor de UMA prop do tipo `array` — o buraco que faltava no
 * `PropFieldEditor`.
 *
 * POR QUE EXISTE: o editor genérico decidia o controle por `schema.type` e
 * caía no `TextInput` para tudo que não fosse enum/boolean/number. Props
 * declaradas como `array` no `propsSchema` (`flip_words.words`,
 * `bar_chart.seriesColors`, `resizable_panels.defaultSizes`,
 * `card_hover.items`) entravam nesse fallback e o `onChange` gravava uma
 * STRING onde o componente espera uma LISTA. O resultado ia de no-op
 * silencioso (`seriesColors`) a derrubar a aplicação inteira
 * (`words.join is not a function`).
 *
 * REGRA DESTE EDITOR: ele SEMPRE emite um `unknown[]` — nunca uma string.
 * Enquanto o texto não é convertível, ele mostra o erro e NÃO propaga: o
 * preview continua com o último valor válido em vez de quebrar.
 *
 * Dois modos, escolhidos por `schema.items.type`:
 *   - escalares (string/number/integer) → uma linha, itens separados por
 *     vírgula. É o formato que a pessoa já esperava ao ver o valor antigo
 *     ("claros,rápidos,acionáveis").
 *   - objetos/misto → JSON, porque não há forma honesta de achatar um objeto
 *     em CSV.
 *
 * O texto vive em estado LOCAL: um input controlado por `JSON.stringify(value)`
 * apagaria a vírgula no instante em que ela é digitada.
 */
import { useState } from 'react';
import { FieldStatus } from '@astryxdesign/core/FieldStatus';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/Layout';
import type { PropSchema } from './types';

export interface ArrayPropFieldProps {
  propKey: string;
  schema: PropSchema;
  value: unknown;
  required: boolean;
  onChange: (next: unknown[]) => void;
}

/** Tipo dos itens declarado no schema (`items.type`), quando houver. */
function itemTypeOf(schema: PropSchema): string | undefined {
  const type = schema.items?.type;
  return Array.isArray(type) ? type[0] : type;
}

/** O array é de escalares (editável como lista separada por vírgula)? */
function isScalarList(schema: PropSchema): boolean {
  const type = itemTypeOf(schema);
  return type === 'string' || type === 'number' || type === 'integer';
}

function toCsv(value: unknown): string {
  return Array.isArray(value) ? value.map((v) => String(v ?? '')).join(', ') : '';
}

function toJson(value: unknown): string {
  return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
}

/**
 * Converte o texto em array. `null` = ainda não é convertível (mostra erro e
 * segura a emissão). Itens vazios são descartados — quem digita "a," está no
 * meio da frase, não pedindo um item em branco.
 */
function parseCsv(text: string, numeric: boolean): { items?: unknown[]; error?: string } {
  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (!numeric) return { items: parts };

  const numbers: number[] = [];
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isFinite(n)) return { error: `"${part}" não é um número.` };
    numbers.push(n);
  }
  return { items: numbers };
}

function parseJsonArray(text: string): { items?: unknown[]; error?: string } {
  const trimmed = text.trim();
  if (trimmed === '') return { items: [] };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed))
      return { error: 'O valor precisa ser uma lista JSON ([...]).' };
    return { items: parsed };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'JSON inválido' };
  }
}

export function ArrayPropField({
  propKey,
  schema,
  value,
  required,
  onChange,
}: ArrayPropFieldProps) {
  const scalar = isScalarList(schema);
  const numeric = scalar && itemTypeOf(schema) !== 'string';
  const format = scalar ? toCsv : toJson;

  const [text, setText] = useState(() => format(value));
  const [error, setError] = useState<string | null>(null);

  const parse = (raw: string) => (scalar ? parseCsv(raw, numeric) : parseJsonArray(raw));

  // RESSINCRONIZAÇÃO. O texto digitado é a fonte da verdade enquanto o campo
  // está em uso; o valor externo só o sobrescreve quando MUDA de uma render
  // para a outra (é o caso do "Restaurar padrão", que troca o valor por fora).
  //
  // O valor da render anterior fica em ESTADO, não em ref: é o padrão do React
  // para ajustar estado quando uma prop muda ("You Might Not Need an Effect").
  // Ref é para o que não afeta o render — e aqui afeta.
  //
  // A comparação é contra a forma NORMALIZADA do texto atual, e não contra o
  // texto cru: quem digita "a,b" produz o array `['a','b']`, cuja forma
  // canônica é "a, b" — sobrescrever aí devolveria o espaço no meio da
  // digitação e jogaria o cursor para o fim a cada tecla.
  const external = format(value);
  const [prevExternal, setPrevExternal] = useState(external);
  if (external !== prevExternal) {
    setPrevExternal(external);
    const mine = parse(text).items;
    if (mine === undefined || external !== format(mine)) setText(external);
  }

  const handleChange = (next: string) => {
    setText(next);
    const { items, error: parseError } = parse(next);
    if (!items) {
      setError(parseError ?? 'Valor inválido');
      return;
    }
    setError(null);
    onChange(items);
  };

  const description =
    schema.description ??
    (scalar
      ? numeric
        ? 'Lista de números separados por vírgula.'
        : 'Lista de textos separados por vírgula.'
      : 'Lista em JSON.');

  return (
    <VStack gap={1.5}>
      {scalar ? (
        <TextInput
          label={propKey}
          size="sm"
          isRequired={required}
          description={description}
          value={text}
          placeholder={numeric ? 'ex.: 50, 50' : 'ex.: item um, item dois'}
          status={error ? { type: 'error' } : undefined}
          onChange={handleChange}
        />
      ) : (
        <TextArea
          label={propKey}
          size="sm"
          rows={6}
          hasSpellCheck={false}
          isRequired={required}
          description={description}
          value={text}
          status={error ? { type: 'error' } : undefined}
          onChange={handleChange}
        />
      )}
      {error ? <FieldStatus type="error" variant="detached" message={error} /> : null}
    </VStack>
  );
}
