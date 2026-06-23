/**
 * BlockPlayground — playground REUTILIZÁVEL de um bloco do render-engine.
 *
 * Extraído do `BlockDetailDialog` (catálogo) para ser compartilhado por DUAS
 * telas, com paridade visual garantida:
 *   - `/catalog` (variant="dialog") — galeria read-only com fixtures.
 *   - `/charts/:id` (variant="page") — edição de um gráfico REAL, com os DADOS
 *     vindos da query (modo `live`) e persistência (Salvar/Publicar feito pela
 *     página, que lê o estado via `onChange`).
 *
 *   ┌─────────────────────┬────────────────────────────────────┐
 *   │  PREVIEW AO VIVO    │  PROPS (gerado do propsSchema)      │
 *   │  (BlockRenderer     │  WRAPPER (ChartWidget: header/footer)│
 *   │   framed — shell    │  LINHAS DE EXPLICAÇÃO (takeaways)   │
 *   │   ChartWidget)      │  DADOS (fixtures OU query real)     │
 *   └─────────────────────┴────────────────────────────────────┘
 *
 * Modo `live` (dados reais): em vez do seletor de fixtures, o painel "Dados"
 * mostra o resultado da query do gráfico (com botão "Rodar query" e estado de
 * carregamento/erro). O textarea continua editável para ajustes de preview, mas
 * o que é PERSISTIDO pela página são as props + a query (não o JSON dos dados).
 *
 * Estado 100% local. Reset por `manifest.type` no useEffect (a `key` no pai
 * desmonta ao trocar de bloco/gráfico). `onChange` reporta o snapshot editável
 * para a página persistir.
 */
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import {
  validateBlockDataByShape,
  formatErrors,
  type BlockDataResult,
  type BlockManifest,
  type DataShape,
} from '@dashboards/contracts';
import {
  Lightbulb,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
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
import { Switch } from '@/components/ui/switch';
import { BlockRenderer } from '@/shared/render-engine';
import { ACCENT_COLORS, isAccentColor } from '@/shared/render-engine/lib/accent';
import { formatDuration } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

import {
  KIND_LABEL,
  SHAPE_LABEL,
  type CatalogEntry,
} from '../lib/catalog-entries';
import {
  getFixtureVariants,
  type FixtureVariant,
} from '../lib/block-fixtures';

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                     */
/* -------------------------------------------------------------------------- */

/** Item de takeaway (insight de rodapé) — espelha o tipo de `ChartWidget`. */
export type Takeaway = { enabled: boolean; text: string };

/** Valores iniciais para semear o playground (usado pela tela do gráfico). */
export interface PlaygroundSeed {
  props?: Record<string, unknown>;
  title?: string;
  subtitle?: string;
  query?: string;
  durationMs?: number;
  takeaways?: Takeaway[];
  showSql?: boolean;
}

/** Dados REAIS (modo `live`): resultado da query + controles de re-execução. */
export interface LiveData {
  /** Resultado da execução da query do gráfico (no shape do dataContract). */
  result: BlockDataResult | undefined;
  /** Query em execução (mostra spinner + desabilita "Rodar query"). */
  isFetching: boolean;
  /** Re-executa a query (refetch). */
  onRun: () => void;
}

/** Snapshot do estado editável — reportado via `onChange` para persistência. */
export interface PlaygroundSnapshot {
  props: Record<string, unknown>;
  title: string;
  subtitle: string;
  query: string;
  durationMs: number | '';
  takeaways: Takeaway[];
  showSql: boolean;
  dataText: string;
}

export interface BlockPlaygroundProps {
  entry: CatalogEntry;
  /** `dialog` (catálogo, dentro de DialogContent) | `page` (tela do gráfico). */
  variant?: 'dialog' | 'page';
  /** Valores iniciais (props/título/query/...). Default: defaults do bloco. */
  seed?: PlaygroundSeed;
  /** Quando presente, o painel "Dados" reflete a query real (sem fixtures). */
  live?: LiveData;
  /** Reporta o estado editável atual (para a página salvar). */
  onChange?: (snapshot: PlaygroundSnapshot) => void;
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
  // Previews específicos (ex.: `title.text`) ou props semeadas (chart real).
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

function isAccentEnum(enumValues: readonly unknown[]): boolean {
  if (!enumValues.length) return false;
  return enumValues.every((v) => {
    if (typeof v !== 'string') return false;
    const bare = v.startsWith('bg-') ? v.slice(3) : v;
    return isAccentColor(bare);
  });
}

function isColorProp(key: string, schema: PropSchema): boolean {
  if (COLOR_PROP_NAMES.has(key)) return true;
  if (/color$/i.test(key)) return true;
  if (schema.enum && isAccentEnum(schema.enum)) return true;
  return false;
}

function looksLikeCssColor(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  return (
    /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ||
    /^(rgb|rgba|hsl|hsla|oklch|oklab|color)\(/i.test(s) ||
    /^(linear|radial|conic)-gradient\(/i.test(s)
  );
}

/* Tipos de bloco que JÁ SÃO cards próprios (espelha SELF_CONTAINED). */
const SELF_CONTAINED_TYPES = new Set<string>([
  'kpi',
  'metric_glow',
  'stat_tile',
  'signal_card',
]);

function isFramedChart(entry: CatalogEntry): boolean {
  return entry.kind === 'chart' && !SELF_CONTAINED_TYPES.has(entry.type);
}

/** Lê `meta.durationMs` de um BlockDataResult de forma segura. */
function durationOfResult(result: BlockDataResult | undefined): number | undefined {
  if (result && typeof result === 'object' && 'meta' in result) {
    const meta = (result as { meta?: { durationMs?: number } }).meta;
    return meta?.durationMs;
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*  ColorFieldEditor — enum DS + input livre + preview                        */
/* -------------------------------------------------------------------------- */

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

  const rawString = value === undefined || value === null ? '' : String(value);
  const bare = rawString.startsWith('bg-') ? rawString.slice(3) : rawString;
  const isKnownAccent = isAccentColor(bare);
  const selectValue: string = isKnownAccent ? bare : '__custom__';
  const freeInputValue: string = isKnownAccent ? '' : rawString;

  const onEnumChange = (next: string) => {
    if (next === '__custom__') {
      onChange('');
      return;
    }
    onChange(next);
  };

  const onFreeInputChange = (next: string) => {
    const trimmed = next.trim();
    if (trimmed && isAccentColor(trimmed)) {
      onChange(trimmed);
      return;
    }
    onChange(next);
  };

  let previewClassName = '';
  let previewStyle: CSSProperties | undefined;
  if (freeInputValue.trim()) {
    const v = freeInputValue.trim();
    if (looksLikeCssColor(v)) {
      previewStyle = { background: v };
    } else {
      const cls = isAccentColor(v) ? `bg-${v}` : v;
      previewClassName = cls;
    }
  } else if (isKnownAccent) {
    previewClassName = `bg-${bare}`;
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
            <SelectItem value="__custom__" className="text-xs italic">
              Custom...
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="text"
          value={freeInputValue}
          onChange={(e) => onFreeInputChange(e.target.value)}
          placeholder="bg-purple-500 ou #ff0000"
          spellCheck={false}
          className="h-8 w-full min-w-0 flex-1 font-mono text-[11px]"
          aria-label={`${key} — cor livre`}
        />

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

  if (isColorProp(key, schema)) {
    return (
      <ColorFieldEditor field={field} value={value} onChange={(v) => onChange(v)} />
    );
  }

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

  if (schema.type === 'boolean') {
    return (
      <label
        htmlFor={`prop-${key}`}
        className="flex h-8 items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-2.5"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium text-xs">{labelStr}</span>
          {required ? (
            <Badge variant="outline" className="h-4 shrink-0 px-1 text-[9px]">
              obrigatório
            </Badge>
          ) : null}
        </div>
        <Switch
          id={`prop-${key}`}
          checked={Boolean(value)}
          onCheckedChange={(v) => onChange(v)}
        />
      </label>
    );
  }

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
/*  TakeawaysEditor — lista editável de insights de rodapé                    */
/* -------------------------------------------------------------------------- */

function TakeawaysEditor({
  definition,
  data,
  items,
  onChange,
  showSql,
  onShowSqlChange,
}: {
  definition: CatalogEntry['definition'];
  data: unknown;
  items: Takeaway[];
  onChange: (next: Takeaway[]) => void;
  showSql: boolean;
  onShowSqlChange: (next: boolean) => void;
}) {
  const addLine = () => {
    onChange([...items, { enabled: true, text: '' }]);
  };
  const removeLine = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };
  const toggleLine = (idx: number, enabled: boolean) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, enabled } : it)));
  };
  const setText = (idx: number, text: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, text } : it)));
  };

  const autoFill = () => {
    if (typeof definition.deriveTakeaway !== 'function') return;
    let result: string | string[] | undefined;
    try {
      result = definition.deriveTakeaway(data as never);
    } catch {
      return;
    }
    if (result == null) return;
    const lines: string[] = Array.isArray(result) ? result : [result];
    const cleaned = lines.map((s) => String(s).trim()).filter((s) => s.length > 0);
    if (cleaned.length === 0) return;
    const emptyIdx = items.findIndex((it) => it.text.trim() === '');
    const allOthersFilled = items.every(
      (it, i) => i === emptyIdx || it.text.trim() !== '',
    );
    if (emptyIdx >= 0 && allOthersFilled) {
      const next = [...items];
      next[emptyIdx] = { enabled: true, text: cleaned[0] };
      for (let i = 1; i < cleaned.length; i++) {
        next.push({ enabled: true, text: cleaned[i] });
      }
      onChange(next);
      return;
    }
    onChange([...items, ...cleaned.map((s) => ({ enabled: true, text: s }))]);
  };

  const canAutoFill = typeof definition.deriveTakeaway === 'function';

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between rounded-md border border-border/60 bg-card/30 px-2.5 py-1.5"
        data-slot="takeaways-editor"
      >
        <div className="flex items-center gap-1.5">
          <Lightbulb className="size-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-medium">Linhas de explicação</span>
          <span className="font-mono text-[10px] text-muted-foreground">(footer)</span>
          <span className="text-[10px] text-muted-foreground">
            {items.length === 0
              ? '— nenhuma'
              : items.length === 1
                ? '— 1 linha'
                : `— ${items.length} linhas`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canAutoFill ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={autoFill}
              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              title="Preencher a partir do `deriveTakeaway` do bloco (1-2 linhas)"
            >
              <Wand2 className="size-3" />
              Auto
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLine}
            className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            title="Adicionar linha de explicação"
          >
            <Plus className="size-3" />
            Adicionar
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((it, i) => (
            <div
              key={`takeaway-row-${i}`}
              className="flex items-center gap-1.5"
              data-slot="takeaway-row"
            >
              <Switch
                checked={it.enabled}
                onCheckedChange={(v) => toggleLine(i, v)}
                aria-label={`Linha ${i + 1} — on/off`}
              />
              <Input
                type="text"
                value={it.text}
                onChange={(e) => setText(i, e.target.value)}
                placeholder="Ex.: Maior valor: Jan (R$ 100 mi)"
                className={cn('h-8 text-xs', !it.enabled && 'opacity-50')}
                aria-label={`Linha ${i + 1} — texto`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeLine(i)}
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                title="Remover linha"
                aria-label={`Remover linha ${i + 1}`}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <label
        htmlFor="show-sql"
        className="flex h-8 items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-2.5"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-medium">Mostrar SQL</span>
          <span className="text-[10px] text-muted-foreground">
            (esconde a query + duração do footer)
          </span>
        </div>
        <Switch id="show-sql" checked={showSql} onCheckedChange={onShowSqlChange} />
      </label>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FixtureVariantPicker — seletor "Dados:" com chips                         */
/* -------------------------------------------------------------------------- */

function FixtureVariantPicker({
  variants,
  activeVariantId,
  disabled,
  onApply,
}: {
  variants: FixtureVariant[];
  activeVariantId: string | null;
  disabled: boolean;
  onApply: (v: FixtureVariant) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5"
      data-slot="fixture-variant-picker"
    >
      <span className="flex items-center gap-1 px-1 text-[11px] font-medium text-muted-foreground">
        <Sparkles className="size-3" />
        Dados:
      </span>
      {variants.map((v) => {
        const isActive = activeVariantId === v.id;
        return (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            onClick={() => onApply(v)}
            title={v.description ?? v.label}
            aria-pressed={isActive}
            className={cn(
              'h-6 rounded-md border px-2 text-[11px] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'border-primary/60 bg-primary text-primary-foreground shadow-sm'
                : 'border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
              disabled && !isActive && 'pointer-events-none opacity-50',
            )}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Componente principal                                                      */
/* -------------------------------------------------------------------------- */

export function BlockPlayground({
  entry,
  variant = 'dialog',
  seed,
  live,
  onChange,
}: BlockPlaygroundProps) {
  const manifest = entry.definition.manifest;
  const isLive = !!live;
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

  // Variantes (fixtures) — só no modo catálogo (sem `live`).
  const variants = useMemo(
    () => (isLive ? [] : getFixtureVariants(manifest.type)),
    [manifest.type, isLive],
  );

  // PREVIEW_PROPS narrativos (título p/ `title`) — mesma estratégia do catálogo.
  const previewProps = useMemo(() => {
    const local: Record<string, Record<string, unknown>> = {
      title: { text: 'Arrecadação por município', level: 2, align: 'left' },
    };
    return local[manifest.type];
  }, [manifest.type]);

  // props iniciais = defaults do bloco + narrativos + props semeadas (chart real).
  const seededPreviewProps = useMemo(
    () => ({ ...(previewProps ?? {}), ...(seed?.props ?? {}) }),
    [previewProps, seed?.props],
  );

  const showTakeawayEditor = isFramedChart(entry);

  // ---------- estado local ----------
  const [propsDraft, setPropsDraft] = useState<Record<string, unknown>>(() =>
    initialPropsFor(manifest, seededPreviewProps),
  );
  const [previewTitle, setPreviewTitle] = useState<string>(seed?.title ?? '');
  const [previewSubtitle, setPreviewSubtitle] = useState<string>(seed?.subtitle ?? '');
  const [previewQuery, setPreviewQuery] = useState<string>(seed?.query ?? '');
  const [previewDurationMs, setPreviewDurationMs] = useState<number | ''>(
    seed?.durationMs ?? '',
  );
  const [takeaways, setTakeaways] = useState<Takeaway[]>(
    seed?.takeaways && seed.takeaways.length > 0
      ? seed.takeaways
      : [{ enabled: true, text: '' }],
  );
  const [showSql, setShowSql] = useState<boolean>(seed?.showSql ?? true);

  const computeInitialData = (): unknown => {
    if (isLive) {
      return live?.result?.state === 'success' ? (live.result.data ?? null) : null;
    }
    const def = variants.find((v) => v.id === 'default');
    return def ? def.data : initialDataFor(entry);
  };

  const [dataText, setDataText] = useState<string>(() =>
    JSON.stringify(computeInitialData(), null, 2),
  );
  const [dataError, setDataError] = useState<string | null>(() => {
    try {
      const parsed = JSON.parse(JSON.stringify(computeInitialData()));
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
  const [variantId, setVariantId] = useState<string | null>(
    variants.length ? 'default' : null,
  );

  // Reset ao trocar de bloco (a `key` no pai já desmonta, mas fica explícito).
  useEffect(() => {
    setPropsDraft(initialPropsFor(manifest, seededPreviewProps));
    setPreviewTitle(seed?.title ?? manifest.name);
    setPreviewSubtitle(seed?.subtitle ?? '');
    setPreviewQuery(seed?.query ?? '');
    setPreviewDurationMs(seed?.durationMs ?? '');
    setTakeaways(
      seed?.takeaways && seed.takeaways.length > 0
        ? seed.takeaways
        : [{ enabled: true, text: '' }],
    );
    setShowSql(seed?.showSql ?? true);
    const init = computeInitialData();
    setDataText(JSON.stringify(init, null, 2));
    setVariantId(variants.length ? 'default' : null);
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

  // ---------- sincroniza dados REAIS (modo live) ----------
  const liveResult = live?.result;
  useEffect(() => {
    if (!isLive || !liveResult) return;
    if (liveResult.state === 'success') {
      setDataText(JSON.stringify(liveResult.data ?? null, null, 2));
      const d = durationOfResult(liveResult);
      setPreviewDurationMs(typeof d === 'number' ? d : '');
      setVariantId(null);
      // revalida o shape do dado real
      if (entry.shape) {
        const { valid, errors } = validateBlockDataByShape(
          entry.shape as DataShape,
          liveResult.data,
        );
        setDataError(valid ? null : formatErrors(errors));
      } else {
        setDataError(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveResult]);

  // ---------- handlers ----------
  const onPropChange = (key: string, next: unknown) => {
    setPropsDraft((d) => ({ ...d, [key]: next }));
  };

  const onDataChange = (text: string) => {
    setDataText(text);
    setVariantId(null);
    try {
      const parsed = JSON.parse(text);
      if (entry.shape) {
        const { valid, errors } = validateBlockDataByShape(
          entry.shape as DataShape,
          parsed,
        );
        if (!valid) {
          setDataError(formatErrors(errors));
          return;
        }
      }
      setDataError(null);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'JSON inválido');
    }
  };

  const resetProps = () => {
    setPropsDraft(initialPropsFor(manifest, seededPreviewProps));
  };

  const resetData = () => {
    const def = variants.find((v) => v.id === 'default');
    if (def) {
      applyVariant(def);
      return;
    }
    const init = initialDataFor(entry);
    setDataText(JSON.stringify(init, null, 2));
    setDataError(null);
  };

  const resetTakeaways = () => {
    setTakeaways([{ enabled: true, text: '' }]);
    setShowSql(true);
  };

  const applyVariant = (v: FixtureVariant) => {
    setVariantId(v.id);
    const text = JSON.stringify(v.data, null, 2);
    setDataText(text);
    try {
      const parsed = JSON.parse(JSON.stringify(v.data));
      if (entry.shape) {
        const { valid, errors } = validateBlockDataByShape(
          entry.shape as DataShape,
          parsed,
        );
        setDataError(valid ? null : formatErrors(errors));
        return;
      }
      setDataError(null);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'JSON inválido');
    }
  };

  const currentData = useMemo<unknown>(() => {
    try {
      return JSON.parse(dataText);
    } catch {
      return undefined;
    }
  }, [dataText]);

  // ---------- reporta snapshot p/ a página (Salvar) ----------
  useEffect(() => {
    onChange?.({
      props: propsDraft,
      title: previewTitle,
      subtitle: previewSubtitle,
      query: previewQuery,
      durationMs: previewDurationMs,
      takeaways,
      showSql,
      dataText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    propsDraft,
    previewTitle,
    previewSubtitle,
    previewQuery,
    previewDurationMs,
    takeaways,
    showSql,
    dataText,
  ]);

  // ---------- preview ----------
  const block = useMemo(() => {
    const trimmedQuery = previewQuery.trim();
    const out: Record<string, unknown> = {
      id: manifest.type,
      type: manifest.type,
      span: 12,
      props: propsDraft,
    };
    if (previewTitle.trim()) out.title = previewTitle.trim();
    if (previewSubtitle.trim()) out.subtitle = previewSubtitle.trim();
    if (showSql && trimmedQuery) {
      out.dataBinding = { query: trimmedQuery };
    }
    if (showTakeawayEditor && takeaways.length > 0) {
      const cleaned = takeaways.filter((t) => t.enabled && t.text.trim().length > 0);
      if (cleaned.length > 0) {
        out.takeaways = cleaned;
      }
    }
    if (!showSql) {
      out.showSql = false;
    }
    return out;
  }, [
    manifest.type,
    previewQuery,
    previewSubtitle,
    previewTitle,
    propsDraft,
    showSql,
    showTakeawayEditor,
    takeaways,
  ]);

  const result = useMemo(() => {
    if (!entry.shape) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(dataText);
    } catch {
      return undefined;
    }
    if (dataError) return undefined;
    const durationMs =
      typeof previewDurationMs === 'number' && Number.isFinite(previewDurationMs)
        ? previewDurationMs
        : undefined;
    return {
      blockId: manifest.type,
      state: 'success' as const,
      shape: entry.shape,
      data: parsed,
      ...(durationMs !== undefined ? { meta: { durationMs } } : {}),
    };
  }, [dataError, dataText, entry.shape, manifest.type, previewDurationMs]);

  const durationDisplay =
    typeof previewDurationMs === 'number' && Number.isFinite(previewDurationMs)
      ? formatDuration(previewDurationMs)
      : '—';

  // Estado/erro da query real (modo live) p/ feedback no painel "Dados".
  const liveError =
    isLive && liveResult?.state === 'error'
      ? (liveResult.error?.message ?? 'Falha ao executar a query')
      : null;
  const liveRowCount =
    isLive && liveResult?.state === 'success'
      ? (liveResult.meta as { rowCount?: number } | undefined)?.rowCount
      : undefined;

  const outerClass =
    variant === 'page'
      ? 'grid min-h-0 grid-cols-1 overflow-hidden rounded-xl border border-border/60 bg-card lg:h-[calc(100dvh-11rem)] lg:grid-cols-2'
      : 'grid h-[85vh] min-h-0 grid-cols-1 md:grid-cols-2';

  return (
    <div className={outerClass}>
      {/* ============================== ESQUERDA — PREVIEW ============================== */}
      <div className="flex min-h-0 min-w-0 flex-col border-b border-border/60 bg-muted/20 md:border-b-0 md:border-r">
        {variant === 'dialog' ? (
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
        ) : (
          <div className="space-y-1 px-5 pt-5 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Pré-visualização
              </h2>
              <Badge variant="secondary">{KIND_LABEL[entry.kind]}</Badge>
              {entry.shape ? (
                <Badge variant="outline">{SHAPE_LABEL[entry.shape]}</Badge>
              ) : null}
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {manifest.description}
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <PreviewSurface result={result} block={block} hasShape={Boolean(entry.shape)} />
        </div>
      </div>

      {/* ============================== DIREITA — CONTROLES ============================== */}
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/10 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {variant === 'page' ? 'Configuração' : 'Playground'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Edite as props — o preview atualiza ao vivo.
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
              <p className="text-sm text-muted-foreground">Sem props configuráveis.</p>
            )}
          </section>

          <Separator />

          {/* ----- WRAPPER (ChartWidget: header + footer) ----- */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cabeçalho / Rodapé
              </h4>
              <span className="text-[10px] text-muted-foreground">wrapper ChartWidget</span>
            </div>

            <div className="space-y-3 rounded-md border border-border/60 bg-card/30 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="preview-title" className="text-xs font-medium">
                  Título
                </Label>
                <Input
                  id="preview-title"
                  type="text"
                  value={previewTitle}
                  onChange={(e) => setPreviewTitle(e.target.value)}
                  placeholder={manifest.name}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preview-subtitle" className="text-xs font-medium">
                  Subtítulo
                </Label>
                <Input
                  id="preview-subtitle"
                  type="text"
                  value={previewSubtitle}
                  onChange={(e) => setPreviewSubtitle(e.target.value)}
                  placeholder="(vazio)"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preview-query" className="text-xs font-medium">
                  Query SQL <span className="text-muted-foreground">(footer)</span>
                </Label>
                <Input
                  id="preview-query"
                  type="text"
                  value={previewQuery}
                  onChange={(e) => setPreviewQuery(e.target.value)}
                  placeholder="SELECT ... FROM ..."
                  spellCheck={false}
                  className="h-8 font-mono text-[11px]"
                  disabled={!showSql}
                />
                {!showSql ? (
                  <p className="text-[10px] text-muted-foreground">
                    Mostrar SQL está desligado — a query não vai para o footer mesmo
                    estando preenchida.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preview-duration" className="text-xs font-medium">
                  Duração <span className="text-muted-foreground">(ms, footer)</span>
                </Label>
                <Input
                  id="preview-duration"
                  type="number"
                  min={0}
                  value={previewDurationMs}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPreviewDurationMs(v === '' ? '' : Number(v));
                  }}
                  placeholder="ex.: 142"
                  className="h-8 text-xs tabular-nums"
                  disabled={!showSql || isLive}
                />
                <p className="text-[10px] text-muted-foreground">
                  Preview: <span className="font-mono">{durationDisplay}</span>{' '}
                  <span className="text-muted-foreground">
                    {isLive
                      ? '(vem da execução real da query)'
                      : '(formatado por `formatDuration`)'}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* ----- LINHAS DE EXPLICAÇÃO (canônico Turno 4) ----- */}
          {showTakeawayEditor ? (
            <>
              <Separator />
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Insights do rodapé
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetTakeaways}
                    className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="size-3" />
                    Reset
                  </Button>
                </div>
                <TakeawaysEditor
                  definition={entry.definition}
                  data={currentData}
                  items={takeaways}
                  onChange={setTakeaways}
                  showSql={showSql}
                  onShowSqlChange={setShowSql}
                />
              </section>
            </>
          ) : null}

          <Separator />

          {/* ----- DADOS ----- */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dados {entry.shape ? `(${SHAPE_LABEL[entry.shape]})` : ''}
              </h4>
              {entry.shape ? (
                isLive ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => live?.onRun()}
                    disabled={live?.isFetching}
                    className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {live?.isFetching ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Play className="size-3" />
                    )}
                    Rodar query
                  </Button>
                ) : (
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
                )
              ) : null}
            </div>

            {entry.shape ? (
              <>
                {/* Catálogo: seletor de variantes. Live: dado real da query. */}
                {!isLive && variants.length > 0 ? (
                  <FixtureVariantPicker
                    variants={variants}
                    activeVariantId={variantId}
                    disabled={variantId === null}
                    onApply={applyVariant}
                  />
                ) : null}

                {isLive ? (
                  <p className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" />
                    {live?.isFetching
                      ? 'Executando a query do gráfico…'
                      : liveError
                        ? 'A query falhou — veja o erro abaixo.'
                        : `Dados reais da query${
                            typeof liveRowCount === 'number'
                              ? ` — ${liveRowCount} linha(s)`
                              : ''
                          }.`}
                  </p>
                ) : null}

                <textarea
                  value={dataText}
                  onChange={(e) => onDataChange(e.target.value)}
                  spellCheck={false}
                  className={cn(
                    'h-64 w-full resize-y rounded-md border bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-ring',
                    dataError ? 'border-destructive/60' : 'border-border/60',
                  )}
                />
                <div className="flex items-center gap-2 text-[11px]">
                  {liveError ? (
                    <>
                      <span className="inline-block size-1.5 shrink-0 rounded-full bg-destructive" />
                      <span className="text-destructive">Query: {liveError}</span>
                    </>
                  ) : dataError ? (
                    <>
                      <span className="inline-block size-1.5 shrink-0 rounded-full bg-destructive" />
                      <span className="text-destructive">
                        Inválido para o shape <code>{entry.shape}</code>: {dataError}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">
                        {isLive
                          ? 'Dados reais — preview ao vivo. Edite a query e clique em “Rodar query”.'
                          : variantId === null && variants.length > 0
                            ? 'Custom — editando o JSON manualmente. Clique numa variante acima ou em Reset para trocar.'
                            : 'Válido — preview ao vivo com este dado.'}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Bloco narrativo — não consome dados. O conteúdo vem das props acima.
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
  hasShape,
}: {
  block: Parameters<typeof BlockRenderer>[0]['block'];
  result: Parameters<typeof BlockRenderer>[0]['result'];
  hasShape: boolean;
}) {
  if (hasShape && result === undefined) {
    return (
      <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        Preview pausado — corrija o JSON dos dados para renderizar.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <BlockRenderer block={block} result={result} framed />
    </div>
  );
}
