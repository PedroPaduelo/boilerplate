/**
 * Dialog de DETALHES de um bloco do catálogo — modo PLAYGROUND.
 *
 * O que mudou: antes era read-only (apenas ficha técnica). Agora é um
 * playground interativo com 2 painéis editáveis + preview ao vivo:
 *
 *   ┌─────────────────────┬────────────────────────────────────┐
 *   │                     │  PROPS   (gerado do propsSchema)   │
 *   │  PREVIEW AO VIVO    │   - string / number / boolean      │
 *   │  (BlockRenderer     │   - enum → <Select>                │
 *   │   com state local)  │   - COR → enum + input livre +     │
 *   │                     │          preview (ColorFieldEditor) │
 *   │                     │  DADOS (dataContract.example)      │
 *   │                     │   - <textarea> JSON                │
 *   │                     │   - valida com validateBlockData.. │
 *   │                     │   - verde/vermelho                 │
 *   └─────────────────────┴────────────────────────────────────┘
 *
 * Editor de cor (ENTREGA 2): se a prop é enum de cor (chart-1..5 + primary)
 * OU se chama `accent` / `accentColor` / `paletteColor`, o sub-componente
 * `ColorFieldEditor` substitui o `<Select>` padrão — oferece 3 zonas:
 * 1) enum DS (Select fechado), 2) input texto livre (classe Tailwind ou cor
 * CSS crua), 3) preview ao vivo (~20×20px). Sem validação AJV no campo
 * livre: o preview É o feedback — se a classe/cor não existir, simplesmente
 * não vai renderizar.
 *
 * Read-only do disco (não persiste nada). Estado 100% local — ao fechar e
 * reabrir, reseta para `defaultProps` + `dataContract.example` (ou
 * `definition.fixture` como fallback).
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  validateBlockDataByShape,
  formatErrors,
  type BlockManifest,
  type DataShape,
} from '@dashboards/contracts';
import { RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BlockRenderer } from '@/shared/render-engine';
import { ACCENT_COLORS, isAccentColor } from '@/shared/render-engine/lib/accent';
import { cn } from '@/shared/lib/utils';

import {
  KIND_LABEL,
  SHAPE_LABEL,
  type CatalogEntry,
} from '../lib/catalog-entries';

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                     */
/* -------------------------------------------------------------------------- */

interface BlockDetailDialogProps {
  entry: CatalogEntry | null;
  onOpenChange: (open: boolean) => void;
}

interface PropSchema {
  type?: string | string[];
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

interface PropsSchemaLike {
  properties?: Record<string, PropSchema>;
  required?: string[];
}

interface PropField {
  key: string;
  schema: PropSchema;
  required: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function initialPropsFor(
  manifest: BlockManifest,
  previewProps: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ...((manifest.defaultProps as Record<string, unknown>) ?? {}),
  };
  // Previews específicos (ex.: `title.text`, `rich_text.markdown`).
  if (previewProps) Object.assign(out, previewProps);
  // Garante que cada prop do schema tenha um valor inicial.
  const propsSchema = manifest.propsSchema as PropsSchemaLike | undefined;
  for (const [k, sch] of Object.entries(propsSchema?.properties ?? {})) {
    if (!(k in out)) {
      if (sch.default !== undefined) out[k] = sch.default;
      else if (sch.enum?.length) out[k] = sch.enum[0];
      else if (sch.type === 'boolean') out[k] = false;
      else if (sch.type === 'number' || sch.type === 'integer') out[k] = 0;
      else out[k] = '';
    }
  }
  return out;
}

/** Dado inicial do painel "Dados": prefere `dataContract.example`, cai pro
 *  `definition.fixture`, e por fim num placeholder vazio. */
function initialDataFor(entry: CatalogEntry): unknown {
  const example = entry.definition.manifest.dataContract?.example;
  if (example !== undefined) return example;
  const fix = entry.definition.fixture;
  return fix ?? null;
}

/* Nomes de prop que disparam o ColorFieldEditor mesmo sem enum explícito. */
const COLOR_PROP_NAMES = new Set(['accent', 'accentColor', 'paletteColor']);

/** Um enum conta como "enum de cor" se TODOS os valores (string) pertencem a
 *  ACCENT_COLORS. Aceita também valores já com prefixo `bg-` (alguns catálogos
 *  guardam `bg-chart-1` na enum). */
function isAccentEnum(enumValues: readonly unknown[]): boolean {
  if (!enumValues.length) return false;
  return enumValues.every((v) => {
    if (typeof v !== 'string') return false;
    const bare = v.startsWith('bg-') ? v.slice(3) : v;
    return isAccentColor(bare);
  });
}

/** Decide se a prop merece o ColorFieldEditor (nome conhecido OU enum de cor). */
function isColorProp(key: string, schema: PropSchema): boolean {
  if (COLOR_PROP_NAMES.has(key)) return true;
  if (schema.enum && isAccentEnum(schema.enum)) return true;
  return false;
}

/** Heurística pra preview: se a string parece cor CSS (hex / rgb / hsl / oklch
 *  / color()) ou começa com `linear-gradient(`, `radial-gradient(`, `conic-`
 *  → aplica via `style.background`. Caso contrário, trata como classe Tailwind
 *  (`bg-purple-500`, `bg-chart-1`, etc.) e aplica via `className`. */
function looksLikeCssColor(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  return (
    /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ||
    /^(rgb|rgba|hsl|hsla|oklch|oklab|color)\(/i.test(s) ||
    /^(linear|radial|conic)-gradient\(/i.test(s)
  );
}

/* -------------------------------------------------------------------------- */
/*  ColorFieldEditor — enum DS + input livre + preview                        */
/* -------------------------------------------------------------------------- */

/**
 * Editor de cor aberto: 3 zonas numa linha.
 *  1) ENUM DS (Select) — `chart-1..5` + `primary`. Default visual.
 *  2) INPUT LIVRE — classe Tailwind (`bg-purple-500`) ou cor CSS crua
 *     (`#ff0000`, `rgb(0,255,0)`, `linear-gradient(...)`). Sem validação AJV;
 *     o preview É o feedback.
 *  3) PREVIEW — quadradinho ~20×20px com a cor aplicada. Atualiza ao digitar.
 *
 * Estado derivado (sem state local redundante):
 *  - Se `value` ∈ ACCENT_COLORS → enum mostra esse valor, input livre vazio.
 *  - Senão → enum fica em `"__custom__"` (mostrado como "Custom..."), input
 *    livre = `value`. Aceita `bg-{color}` ou bare `{color}` (normalizado).
 */
function ColorFieldEditor({
  field,
  value,
  onChange,
}: {
  field: PropField;
  value: unknown;
  onChange: (next: string) => void;
}) {
  const { key, schema, required } = field;

  // Normaliza o valor atual para string; vazio = sem seleção.
  const rawString =
    value === undefined || value === null ? '' : String(value);

  // Caso o valor guardado seja `bg-chart-1` (já com prefixo), normaliza pra
  // bare pra bater com o enum.
  const bare = rawString.startsWith('bg-') ? rawString.slice(3) : rawString;
  const isKnownAccent = isAccentColor(bare);

  // Valor de enum mostrado: o bare se conhecido, senão sentinel "__custom__".
  const selectValue: string = isKnownAccent ? bare : '__custom__';

  // Input livre: se o valor é um accent conhecido, deixa vazio (o usuário
  // escolhe no enum e "Custom..." fica como segunda opção explícita). Se for
  // custom, mostra exatamente o que está guardado.
  const freeInputValue: string = isKnownAccent ? '' : rawString;

  // ----- handlers -----
  const onEnumChange = (next: string) => {
    if (next === '__custom__') {
      // limpa o enum e foca o input livre (estado vazio)
      onChange('');
      return;
    }
    onChange(next); // bare, ex.: 'chart-2'
  };

  const onFreeInputChange = (next: string) => {
    const trimmed = next.trim();
    // Se digitar algo que bate com o enum bare, prefere o enum (limpa input).
    if (trimmed && isAccentColor(trimmed)) {
      onChange(trimmed);
      return;
    }
    onChange(next); // string livre, ex.: '#ff0000' / 'bg-purple-500'
  };

  // ----- preview -----
  // Escolha da fonte de verdade: input livre (se preenchido) > enum (se bare)
  // > vazio.
  let previewClassName = '';
  let previewStyle: CSSProperties | undefined;
  if (freeInputValue.trim()) {
    const v = freeInputValue.trim();
    if (looksLikeCssColor(v)) {
      previewStyle = { background: v };
    } else {
      // Trata como classe Tailwind: se veio bare "chart-1", prefixa "bg-".
      // Se já veio com prefixo ("bg-chart-1", "bg-purple-500"), usa direto.
      const cls = isAccentColor(v) ? `bg-${v}` : v;
      previewClassName = cls;
    }
  } else if (isKnownAccent) {
    previewClassName = `bg-${bare}`;
  } else {
    // vazio — quadradinho vazio com borda
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`prop-${key}`} className="flex items-center gap-1.5 text-xs">
        <span className="font-medium">{key}</span>
        <span className="font-mono text-[10px] text-muted-foreground">cor</span>
        {required ? (
          <Badge variant="outline" className="h-4 px-1 text-[9px]">
            obrigatório
          </Badge>
        ) : null}
      </Label>

      <div className="flex items-center gap-1.5">
        {/* 1) ENUM DS */}
        <Select value={selectValue} onValueChange={onEnumChange}>
          <SelectTrigger
            id={`prop-${key}`}
            className="h-8 w-full min-w-0 flex-1 text-xs"
          >
            <SelectValue placeholder="…" />
          </SelectTrigger>
          <SelectContent>
            {ACCENT_COLORS.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span className={cn('inline-block size-3 rounded-sm border', `bg-${opt}`)} />
                  {opt}
                </span>
              </SelectItem>
            ))}
            {/* Opção explícita "Custom..." — acionada pelo input livre. */}
            <SelectItem value="__custom__" className="text-xs italic">
              Custom...
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 2) INPUT LIVRE */}
        <Input
          type="text"
          value={freeInputValue}
          onChange={(e) => onFreeInputChange(e.target.value)}
          placeholder="bg-purple-500 ou #ff0000"
          spellCheck={false}
          className="h-8 w-full min-w-0 flex-1 font-mono text-[11px]"
          aria-label={`${key} — cor livre`}
        />

        {/* 3) PREVIEW */}
        <span
          aria-hidden="true"
          className={cn(
            'size-5 shrink-0 rounded-md border border-border/60',
            !previewStyle && !previewClassName && 'bg-transparent',
            previewClassName,
          )}
          style={previewStyle}
          title={rawString || 'sem cor'}
        />
      </div>

      {/* Hint de schema — só aparece se o schema declara enum, pra dar contexto
          do "fechamento" do DS. Em modo livre não trava nada. */}
      {schema.enum?.length ? (
        <p className="text-[10px] leading-tight text-muted-foreground">
          DS enum: {schema.enum.map((v) => String(v)).join(' · ')} — input livre
          aceita qualquer classe Tailwind ou cor CSS.
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field renderer — gera input conforme o tipo do schema                     */
/* -------------------------------------------------------------------------- */

function PropFieldEditor({
  field,
  value,
  onChange,
}: {
  field: PropField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const { schema, key, required } = field;
  const labelStr = key;

  // 0) prop de COR (enum de cor OU nome conhecido) → editor aberto.
  if (isColorProp(key, schema)) {
    return (
      <ColorFieldEditor
        field={field}
        value={value}
        onChange={(v) => onChange(v)}
      />
    );
  }

  // 1) enum → <Select>
  if (schema.enum?.length) {
    const stringValue = value === undefined || value === null ? '' : String(value);
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`prop-${key}`} className="flex items-center gap-1.5 text-xs">
          <span className="font-medium">{labelStr}</span>
          {required ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              obrigatório
            </Badge>
          ) : null}
        </Label>
        <Select value={stringValue} onValueChange={onChange}>
          <SelectTrigger id={`prop-${key}`} className="h-8 w-full text-xs">
            <SelectValue placeholder="…" />
          </SelectTrigger>
          <SelectContent>
            {schema.enum.map((opt) => (
              <SelectItem key={String(opt)} value={String(opt)} className="text-xs">
                {String(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // 2) boolean → checkbox nativo estilizado
  if (schema.type === 'boolean') {
    return (
      <label
        htmlFor={`prop-${key}`}
        className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-xs">{labelStr}</span>
          {required ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              obrigatório
            </Badge>
          ) : null}
        </div>
        <input
          id={`prop-${key}`}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 cursor-pointer accent-primary"
        />
      </label>
    );
  }

  // 3) number/integer → input number
  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`prop-${key}`} className="flex items-center gap-1.5 text-xs">
          <span className="font-medium">{labelStr}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {schema.type}
          </span>
        </Label>
        <Input
          id={`prop-${key}`}
          type="number"
          value={typeof value === 'number' ? value : Number(value) || 0}
          min={schema.minimum}
          max={schema.maximum}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="h-8 text-xs tabular-nums"
        />
      </div>
    );
  }

  // 4) default: string
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`prop-${key}`} className="flex items-center gap-1.5 text-xs">
        <span className="font-medium">{labelStr}</span>
        {required ? (
          <Badge variant="outline" className="h-4 px-1 text-[9px]">
            obrigatório
          </Badge>
        ) : null}
      </Label>
      <Input
        id={`prop-${key}`}
        type="text"
        value={typeof value === 'string' ? value : String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Componente principal                                                      */
/* -------------------------------------------------------------------------- */

export function BlockDetailDialog({ entry, onOpenChange }: BlockDetailDialogProps) {
  // `key` do dialog = type do bloco → ao trocar de bloco, reseta o estado.
  const dialogKey = entry?.type ?? 'none';

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      {/* ENTREGA 1: modal 70vw × 70vh (era max-w-5xl max-h-90vh). Equilibra as
          duas dimensões para abrir mais confortável no playground. */}
      <DialogContent className="max-h-[70vh] max-w-[70vw] w-[70vw] gap-0 overflow-hidden p-0">
        {entry ? (
          <BlockDetailContent key={dialogKey} entry={entry} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function BlockDetailContent({ entry }: { entry: CatalogEntry }) {
  const manifest = entry.definition.manifest;
  const propsSchema = manifest.propsSchema as PropsSchemaLike | undefined;
  const fields: PropField[] = useMemo(
    () =>
      Object.entries(propsSchema?.properties ?? {}).map(([key, schema]) => ({
        key,
        schema,
        required: (propsSchema?.required ?? []).includes(key),
      })),
    [propsSchema],
  );

  // PREVIEW_PROPS vem do `catalog-entries` (título p/ `title`, markdown p/
  // `rich_text` etc.). Reaproveitado para o estado inicial.
  const previewProps = useMemo(() => {
    // `catalog-entries` mantém isso interno; aqui replicamos o shape mínimo
    // (mesma estratégia) só pros blocos narrativos — pros de dados, o
    // `defaultProps` + schema cobrem.
    const local: Record<string, Record<string, unknown>> = {
      title: { text: 'Arrecadação por município', level: 2, align: 'left' },
    };
    return local[manifest.type];
  }, [manifest.type]);

  // ---------- estado local ----------
  const [propsDraft, setPropsDraft] = useState<Record<string, unknown>>(() =>
    initialPropsFor(manifest, previewProps),
  );
  const [dataText, setDataText] = useState<string>(() =>
    JSON.stringify(initialDataFor(entry), null, 2),
  );
  // Erro de parse/validação do JSON; null = OK (parsedAndValid).
  const [dataError, setDataError] = useState<string | null>(() => {
    try {
      const parsed = JSON.parse(JSON.stringify(initialDataFor(entry)));
      if (entry.shape) {
        const { valid, errors } = validateBlockDataByShape(
          entry.shape as DataShape,
          parsed,
        );
        if (!valid) return formatErrors(errors);
      }
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'JSON inválido';
    }
  });

  // Reset ao trocar de bloco (o `key` no pai já desmonta, mas fica explícito).
  useEffect(() => {
    setPropsDraft(initialPropsFor(manifest, previewProps));
    const init = initialDataFor(entry);
    setDataText(JSON.stringify(init, null, 2));
    try {
      const parsed = JSON.parse(JSON.stringify(init));
      if (entry.shape) {
        const { valid, errors } = validateBlockDataByShape(
          entry.shape as DataShape,
          parsed,
        );
        setDataError(valid ? null : formatErrors(errors));
      } else {
        setDataError(null);
      }
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'JSON inválido');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest.type]);

  // ---------- handlers ----------
  const onPropChange = (key: string, next: unknown) => {
    setPropsDraft((d) => ({ ...d, [key]: next }));
  };

  const onDataChange = (text: string) => {
    setDataText(text);
    try {
      const parsed = JSON.parse(text);
      if (entry.shape) {
        const { valid, errors } = validateBlockDataByShape(
          entry.shape as DataShape,
          parsed,
        );
        if (!valid) {
          setDataError(formatErrors(errors));
          return; // mantém o anterior no preview
        }
      }
      setDataError(null);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'JSON inválido');
    }
  };

  const resetProps = () => {
    setPropsDraft(initialPropsFor(manifest, previewProps));
  };

  const resetData = () => {
    const init = initialDataFor(entry);
    setDataText(JSON.stringify(init, null, 2));
    setDataError(null);
  };

  // ---------- preview ----------
  const block = useMemo(
    () => ({
      id: manifest.type,
      type: manifest.type,
      span: 12,
      props: propsDraft,
    }),
    [manifest.type, propsDraft],
  );

  // Só monta o `result` se a forma dos dados bater — senão, fica skeleton.
  const result = useMemo(() => {
    if (!entry.shape) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(dataText);
    } catch {
      return undefined;
    }
    if (dataError) return undefined;
    return {
      blockId: manifest.type,
      state: 'success' as const,
      shape: entry.shape,
      data: parsed,
    };
  }, [dataError, dataText, entry.shape, manifest.type]);

  return (
    <div className="grid h-[70vh] grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ============================== ESQUERDA — PREVIEW ============================== */}
      <div className="flex min-h-0 flex-col border-b border-border/60 bg-muted/20 md:border-b-0 md:border-r">
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{manifest.name}</DialogTitle>
            <Badge variant="secondary">{KIND_LABEL[entry.kind]}</Badge>
            {entry.shape ? (
              <Badge variant="outline">{SHAPE_LABEL[entry.shape]}</Badge>
            ) : null}
          </div>
          <DialogDescription className="line-clamp-2">
            {manifest.description}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <PreviewSurface result={result} block={block} />
        </div>
      </div>

      {/* ============================== DIREITA — CONTROLES ============================== */}
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/10 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Playground
          </p>
          <p className="text-[10px] text-muted-foreground">
            Edite as props e o JSON dos dados — o preview atualiza ao vivo.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* ----- PROPS ----- */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Propriedades visuais {fields.length ? `(${fields.length})` : ''}
              </h4>
              {fields.length ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetProps}
                  className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              ) : null}
            </div>

            {fields.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((f) => (
                  <PropFieldEditor
                    key={f.key}
                    field={f}
                    value={propsDraft[f.key]}
                    onChange={(v) => onPropChange(f.key, v)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem props configuráveis.
              </p>
            )}
          </section>

          <Separator />

          {/* ----- DADOS ----- */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dados {entry.shape ? `(${SHAPE_LABEL[entry.shape]})` : ''}
              </h4>
              {entry.shape ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetData}
                  className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              ) : null}
            </div>

            {entry.shape ? (
              <>
                <textarea
                  value={dataText}
                  onChange={(e) => onDataChange(e.target.value)}
                  spellCheck={false}
                  className={cn(
                    'h-64 w-full resize-y rounded-md border bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-ring',
                    dataError
                      ? 'border-destructive/60'
                      : 'border-border/60',
                  )}
                />
                <div className="flex items-center gap-2 text-[11px]">
                  {dataError ? (
                    <>
                      <span className="inline-block size-1.5 shrink-0 rounded-full bg-destructive" />
                      <span className="text-destructive">
                        Inválido para o shape <code>{entry.shape}</code>:{' '}
                        {dataError}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">
                        Válido — preview ao vivo com este dado.
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Bloco narrativo — não consome dados. O conteúdo vem das props
                acima.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Surface de preview — centraliza o bloco e dá uma moldura leve             */
/* -------------------------------------------------------------------------- */

function PreviewSurface({
  block,
  result,
}: {
  block: ReturnType<typeof Object> extends never ? never : Parameters<typeof BlockRenderer>[0]['block'];
  result: Parameters<typeof BlockRenderer>[0]['result'];
}) {
  // Erro: dados inválidos → mostra skeleton gentil sem quebrar a UI.
  if (result === undefined) {
    return (
      <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        Preview pausado — corrija o JSON dos dados para renderizar.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <BlockRenderer block={block} result={result} />
    </div>
  );
}