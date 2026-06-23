/**
 * Dialog de DETALHES de um bloco do catálogo — modo PLAYGROUND.
 *
 * O que mudou: antes era read-only (apenas ficha técnica). Agora é um
 * playground interativo com 2 painéis editáveis + preview ao vivo:
 *
 *   ┌─────────────────────┬────────────────────────────────────┐
 *   │                     │  PROPS   (gerado do propsSchema)   │
 *   │  PREVIEW AO VIVO    │   - string / number / boolean      │
 *   │  (BlockRenderer     │     → <Switch> compacto shadcn     │
 *   │   framed — shell    │   - enum → <Select>                │
 *   │   ChartWidget       │   - COR → enum + input livre +     │
 *   │   idêntico ao       │          preview (ColorFieldEditor) │
 *   │   dashboard real)   │                                    │
 *   │                     │  WRAPPER (ChartWidget: header +    │
 *   │                     │   footer) — Título, Subtítulo,     │
 *   │                     │   Query SQL, Duração ms.           │
 *   │                     │                                    │
 *   │                     │  LINHAS DE EXPLICAÇÃO (canônico    │
 *   │                     │   — Turno 4):                      │
 *   │                     │   - array de { enabled, text }     │
 *   │                     │   - Switch por linha + Input + X   │
 *   │                     │   - "+ Adicionar" / "Auto"         │
 *   │                     │   - Switch "Mostrar SQL"           │
 *   │                     │                                    │
 *   │                     │  DADOS (dataContract.example)      │
 *   │                     │   - seletor "Dados:" → variantes   │
 *   │                     │     (3-5 fixtures pré-prontas)     │
 *   │                     │   - <textarea> JSON                │
 *   │                     │   - valida com validateBlockData.. │
 *   │                     │   - verde/vermelho                 │
 *   └─────────────────────┴────────────────────────────────────┘
 *
 * Padrão canônico do CARD/GRÁFICO (footer do ChartWidget):
 *   1) Array de TAKEAWAYS (0..N linhas com lâmpada + texto; `enabled` filtra)
 *   2) Linha TÉCNICA (query + duração) — SEMPRE a ÚLTIMA posição; some se
 *      `showSql === false`. Duração formatada via `formatDuration()` do
 *      `format.ts` (exibe "142ms" / "1.4s" / "2min 15s" / "1h 5min" — não
 *      "142ms" cru em queries lentas).
 *
 * Editor de cor (ENTREGA 2 — Turno 1): se a prop é enum de cor
 * (chart-1..5 + primary) OU se chama `accent`/`accentColor`/`paletteColor`,
 * o sub-componente `ColorFieldEditor` substitui o `<Select>` padrão — oferece
 * 3 zonas: 1) enum DS (Select fechado), 2) input texto livre (classe Tailwind
 * ou cor CSS crua), 3) preview ao vivo (~20×20px). Sem validação AJV no campo
 * livre: o preview É o feedback — se a classe/cor não existir, simplesmente
 * não vai renderizar.
 *
 * Boolean editor (ENTREGA 6 — Turno 4): antes era checkbox nativo estilizado
 * (alto, label em cima). Agora usa o `<Switch>` shadcn compacto (32×18px) com
 * label AO LADO, em faixa horizontal — padrão dos switches do design system.
 *
 * Seletor de variantes (ENTREGA 3 — Turno 2): acima do textarea, exibe botões
 * "Dados: [Padrão] [Multi-série] [Valores grandes] …" que carregam fixtures
 * pré-prontas vindas de `lib/block-fixtures.ts` (3-5 variações por bloco, 8
 * blocos da aba "Gráficos"). Editar o textarea manualmente desativa a seleção
 * de variantes (entra em modo "custom") até clicar em alguma variante ou em
 * "Reset". Blocos narrativos (sem `dataContract`) NÃO mostram seletor.
 *
 * Read-only do disco (não persiste nada). Estado 100% local — ao fechar e
 * reabrir, reseta para `defaultProps` + `dataContract.example` (ou
 * `definition.fixture` como fallback). Reset por `manifest.type` no useEffect.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  validateBlockDataByShape,
  formatErrors,
  type BlockManifest,
  type DataShape,
} from '@dashboards/contracts';
import {
  Lightbulb,
  Plus,
  RotateCcw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';

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

/** Item de takeaway (insight de rodapé) — espelha o tipo de `ChartWidget`. */
type Takeaway = { enabled: boolean; text: string };

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
 * ACCENT_COLORS. Aceita também valores já com prefixo `bg-` (alguns catálogos
 * guardam `bg-chart-1` na enum). */
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

/* Tipos de bloco que JÁ SÃO cards próprios (não recebem moldura ChartWidget,
 * portanto não consomem takeaways/SQL — espelha SELF_CONTAINED do
 * `block-renderer.tsx`). */
const SELF_CONTAINED_TYPES = new Set<string>([
  'kpi',
  'metric_glow',
  'stat_tile',
  'signal_card',
  'progress_bar',
  'progress_circle',
  'radial_gauge',
]);

/** Decide se o bloco é visualizável com moldura (kind=chart e NÃO self-contained). */
function isFramedChart(entry: CatalogEntry): boolean {
  return entry.kind === 'chart' && !SELF_CONTAINED_TYPES.has(entry.type);
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

  // 2) boolean → <Switch> shadcn compacto (ENTREGA 6 — Turno 4).
  // Label AO LADO do toggle (horizontal, ~32×18px). Removido o checkbox
  // nativo estilizado, que ficava com altura desproporcional e label em
  // cima do controle, ocupando muito espaço vertical no playground.
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
/*  TakeawaysEditor — lista editável de insights de rodapé                    */
/* -------------------------------------------------------------------------- */

/**
 * Editor de TAKEAWAYS (canônico Turno 4) — array editável de
 * `{ enabled, text }` para o rodapé do ChartWidget.
 *
 * Cada linha = `<Switch>` (on/off) + `<Input>` (texto) + botão "X" (remover).
 * Estado sempre VISÍVEL (não some quando `enabled=false` — para o usuário
 * poder reativar).
 *
 * Ações extras:
 *  - `+ Adicionar linha` no final (sem limite rígido, mas mantém UX saudável
 *    com cap sugerido de 5 visíveis no scroll).
 *  - `Auto-preencher (Wand2)` se o bloco tiver `def.deriveTakeaway`: gera
 *    1-2 linhas a partir do `deriveTakeaway` da fixture do bloco. Se retornar
 *    `string[]` ou `string`, divide entre as linhas. Anexa às linhas
 *    existentes (não substitui).
 *  - Switch global "Mostrar SQL" (controla a visibilidade da query + duração
 *    do footer técnico do ChartWidget — `false` esconde a linha INTEIRA).
 */
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
  // ----- handlers locais -----
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

  // ----- auto-preenchimento via `def.deriveTakeaway(data)` -----
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
    const cleaned = lines
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0);
    if (cleaned.length === 0) return;
    // Anexa como NOVAS linhas (enabled=true) — não substitui o que o user
    // já digitou. Se TODAS as linhas atuais estão vazias, SUBSTITUI a
    // primeira linha vazia em vez de duplicar.
    const emptyIdx = items.findIndex((it) => it.text.trim() === '');
    const allOthersFilled = items.every(
      (it, i) => i === emptyIdx || it.text.trim() !== '',
    );
    if (emptyIdx >= 0 && allOthersFilled) {
      const next = [...items];
      // preenche a 1ª linha vazia com a 1ª frase
      next[emptyIdx] = { enabled: true, text: cleaned[0] };
      // anexa o resto (se houver)
      for (let i = 1; i < cleaned.length; i++) {
        next.push({ enabled: true, text: cleaned[i] });
      }
      onChange(next);
      return;
    }
    onChange([
      ...items,
      ...cleaned.map((s) => ({ enabled: true, text: s })),
    ]);
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
          <span className="font-mono text-[10px] text-muted-foreground">
            (footer)
          </span>
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

      {/* Switch global: mostrar SQL (footer técnico) */}
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
        <Switch
          id="show-sql"
          checked={showSql}
          onCheckedChange={onShowSqlChange}
        />
      </label>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FixtureVariantPicker — seletor "Dados:" com chips                         */
/* -------------------------------------------------------------------------- */

/**
 * Barra de chips com as variações de fixture disponíveis para o bloco.
 * Renderizada ACIMA do textarea JSON no painel "Dados".
 *
 * Comportamento:
 * - `variantId === null` → modo "custom" (usuário editou o textarea). Chips
 *   ficam desabilitados visualmente (estilo muted) e a tooltip avisa.
 * - `variantId !== null` → chip correspondente fica destacado (estilo solid).
 * - Click num chip → `onApplyVariant(v)` (carrega + re-valida).
 *
 * Não renderiza nada se `variants.length === 0` — comportamento padrão para
 * blocos sem variações (kpi, stat_tile, etc.).
 */
function FixtureVariantPicker({
  variants,
  activeVariantId,
  disabled,
  onApply,
}: {
  variants: FixtureVariant[];
  activeVariantId: string | null;
  /** Quando true (modo custom), os chips ficam desabilitados mas visíveis. */
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

export function BlockDetailDialog({ entry, onOpenChange }: BlockDetailDialogProps) {
  // `key` do dialog = type do bloco → ao trocar de bloco, reseta o estado.
  const dialogKey = entry?.type ?? 'none';

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      {/* Modal 90vw × 85vh. Sobrescreve o default do shadcn (sm:max-w-lg
          = 512px) com !important + max-w-none no sm pra garantir que
          SEMPRE vença o default, mesmo com Tailwind JIT reorderando. */}
      <DialogContent className="!max-w-none sm:!max-w-[90vw] w-[90vw] !w-[90vw] max-h-[85vh] overflow-hidden p-0 gap-0">
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

  // Variantes disponíveis para este bloco (catálogo em `lib/block-fixtures.ts`).
  // Vazio para blocos sem variações (kpi, stat_tile) ou blocos narrativos.
  const variants = useMemo(() => getFixtureVariants(manifest.type), [manifest.type]);

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

  // Bloco é visualizável com moldura ChartWidget (= recebe takeaways+SQL)?
  // Apenas `kind === 'chart'` e NÃO self-contained. Espelha a lógica do
  // `block-renderer.tsx` para o editor não oferecer controle sem efeito.
  const showTakeawayEditor = isFramedChart(entry);

  // ---------- estado local ----------
  const [propsDraft, setPropsDraft] = useState<Record<string, unknown>>(() =>
    initialPropsFor(manifest, previewProps),
  );
  // Cabeçalho/rodapé do WRAPPER ChartWidget (igual dashboard real).
  // Esses campos NÃO são props do bloco — são do shell `ChartWidget` que
  // envolve o bloco quando `framed=true` no dashboard. O playground permite
  // editar pra você visualizar como vai ficar no relatório final.
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewSubtitle, setPreviewSubtitle] = useState<string>('');
  const [previewQuery, setPreviewQuery] = useState<string>('');
  const [previewDurationMs, setPreviewDurationMs] = useState<number | ''>('');
  // Takeaways (canônico — Turno 4): array de `{ enabled, text }` que vai
  // para o footer do ChartWidget. Inicia com 1 linha vazia (UX saudável:
  // sempre há UM campo pronto para o usuário digitar). Reset por
  // `manifest.type` no useEffect abaixo.
  const [takeaways, setTakeaways] = useState<Takeaway[]>([
    { enabled: true, text: '' },
  ]);
  // showSql — quando `false`, a linha técnica (query + duração) SOME
  // inteira do footer (mesmo se `previewQuery` estiver preenchida). Default:
  // `true` (mostra). Reset por `manifest.type` no useEffect.
  const [showSql, setShowSql] = useState<boolean>(true);
  const [dataText, setDataText] = useState<string>(() => {
    // Se o bloco tem variantes, o estado inicial é a variante `default` (que
    // por convenção é uma cópia literal da fixture oficial — paridade visual).
    const def = variants.find((v) => v.id === 'default');
    const init = def ? def.data : initialDataFor(entry);
    return JSON.stringify(init, null, 2);
  });
  // Erro de parse/validação do JSON; null = OK (parsedAndValid).
  const [dataError, setDataError] = useState<string | null>(() => {
    try {
      const def = variants.find((v) => v.id === 'default');
      const init = def ? def.data : initialDataFor(entry);
      const parsed = JSON.parse(JSON.stringify(init));
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
  // ID da variante atualmente aplicada. `null` = modo custom (usuário editou o
  // textarea). Usado pra destacar o chip selecionado e desabilitar outros
  // enquanto o user está editando livremente.
  const [variantId, setVariantId] = useState<string | null>(
    variants.length ? 'default' : null,
  );

  // Reset ao trocar de bloco (o `key` no pai já desmonta, mas fica explícito).
  useEffect(() => {
    setPropsDraft(initialPropsFor(manifest, previewProps));
    // Default do cabeçalho/rodapé: usa o `name` do manifesto como título
    // inicial, deixa subtítulo/query/duração vazios (dashboard pode setar).
    setPreviewTitle(manifest.name);
    setPreviewSubtitle('');
    setPreviewQuery('');
    setPreviewDurationMs('');
    setTakeaways([{ enabled: true, text: '' }]);
    setShowSql(true);
    const def = variants.find((v) => v.id === 'default');
    const init = def ? def.data : initialDataFor(entry);
    setDataText(JSON.stringify(init, null, 2));
    setVariantId(def ? 'default' : null);
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
    // Qualquer edição manual → marca como custom (variantId = null). Os chips
    // ficam visualmente desabilitados até o user clicar em alguma variante.
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
    // Reset = volta pra variante `default` se existir; senão, comportamento
    // legado (initialDataFor). É o atalho pra "sair do modo custom".
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

  /** Aplica uma variante: popula o textarea e re-valida. */
  const applyVariant = (v: FixtureVariant) => {
    setVariantId(v.id);
    const text = JSON.stringify(v.data, null, 2);
    setDataText(text);
    try {
      // Faz um round-trip pra garantir que o JSON é parseável (no caso de uma
      // variante malformada por descuido — cai no fallback do erro).
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

  // Parse do JSON atual (para passar ao `deriveTakeaway` no auto-preencher).
  const currentData = useMemo<unknown>(() => {
    try {
      return JSON.parse(dataText);
    } catch {
      return undefined;
    }
  }, [dataText]);

  // ---------- preview ----------
  // `block` carrega props + metadados do ChartWidget (title/subtitle/query)
  // que o dashboard injeta via `block.title`/`block.dataBinding.query`. Aqui
  // o playground injeta os valores do state local `previewTitle`/etc. para
  // o usuário visualizar exatamente o que vai aparecer no dashboard.
  // TAKEAWAYS + SHOWSQL: lidos do state local e propagados no `block` —
  // o `BlockRenderer` lê e passa pro `ChartWidget` no formato correto.
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
    // SQL só vai pro block se `showSql === true`. Quando o user desliga o
    // switch, escondemos a query inteira (incluindo do footer técnico).
    if (showSql && trimmedQuery) {
      out.dataBinding = { query: trimmedQuery };
    }
    // Takeaways: filtra as linhas vazias antes de mandar pro renderer
    // (ChartWidget também filtra, mas mandamos limpo para clareza no
    // console/JSON.stringify).
    if (showTakeawayEditor && takeaways.length > 0) {
      const cleaned = takeaways.filter(
        (t) => t.enabled && t.text.trim().length > 0,
      );
      if (cleaned.length > 0) {
        out.takeaways = cleaned;
      }
    }
    // showSql: só manda no block se for `false` (true = default, sem
    // necessidade de explicitar). Quando false, o renderer esconde a linha
    // técnica INTEIRA do footer.
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

  // Só monta o `result` se a forma dos dados bater — senão, fica skeleton.
  // Inclui `meta.durationMs` quando o usuário setar (vai pro footer do
  // ChartWidget, lado da query).
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
  }, [
    dataError,
    dataText,
    entry.shape,
    manifest.type,
    previewDurationMs,
  ]);

  // Duração formatada para o hint ao lado do input (state guarda cru, display
  // mostra formatado — ex.: "142 → 142ms", "135000 → 2min 15s").
  const durationDisplay =
    typeof previewDurationMs === 'number' && Number.isFinite(previewDurationMs)
      ? formatDuration(previewDurationMs)
      : '—';

  return (
    <div className="grid h-[85vh] min-h-0 grid-cols-1 md:grid-cols-2">
      {/* ============================== ESQUERDA — PREVIEW ============================== */}
      <div className="flex min-h-0 min-w-0 flex-col border-b border-border/60 bg-muted/20 md:border-b-0 md:border-r">
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

          {/* ----- WRAPPER (ChartWidget: header + footer) ----- */}
          {/* Esses campos NÃO são do bloco em si — são do shell `ChartWidget`
              que envolve o gráfico no dashboard (igual `block.title` /
              `block.dataBinding.query` no Block). O playground permite
              editar pra você visualizar EXATAMENTE como vai aparecer no
              relatório. Bloco narrativo ou SELF_CONTAINED ignora o shell. */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cabeçalho / Rodapé
              </h4>
              <span className="text-[10px] text-muted-foreground">
                wrapper ChartWidget
              </span>
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
                    Mostrar SQL está desligado — a query não vai para o footer
                    mesmo estando preenchida.
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
                  disabled={!showSql}
                />
                <p className="text-[10px] text-muted-foreground">
                  Preview: <span className="font-mono">{durationDisplay}</span>{' '}
                  <span className="text-muted-foreground">
                    (formatado por `formatDuration`)
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* ----- LINHAS DE EXPLICAÇÃO (canônico Turno 4) ----- */}
          {/* Editor de TAKEAWAYS (apenas para blocos com moldura ChartWidget).
              Para blocos narrativos ou self-contained, o `ChartWidget` não
              envolve o componente — o array `takeaways` não teria efeito,
              então escondemos a seção inteira (UX mais limpa). */}
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
                {/* Seletor de variantes — só renderiza se o bloco tem
                    variações cadastradas (atualmente: 8 da aba "Gráficos"). */}
                {variants.length > 0 ? (
                  <FixtureVariantPicker
                    variants={variants}
                    activeVariantId={variantId}
                    disabled={variantId === null}
                    onApply={applyVariant}
                  />
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
                        {variantId === null && variants.length > 0
                          ? 'Custom — editando o JSON manualmente. Clique numa variante acima ou em Reset para trocar.'
                          : 'Válido — preview ao vivo com este dado.'}
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
  block: ReturnType<typeof Object> extends never
    ? never
    : Parameters<typeof BlockRenderer>[0]['block'];
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
      {/*
        `framed` (sempre true no playground) ativa o shell ChartWidget no
        BlockRenderer, igual ao dashboard real. O ChartWidget SÓ aparece
        para blocos `kind === 'chart'` que NÃO estão em SELF_CONTAINED
        (ver block-renderer.tsx). Blocos narrativos/layout continuam sem
        moldura (sem chart-widget).
      */}
      <BlockRenderer block={block} result={result} framed />
    </div>
  );
}