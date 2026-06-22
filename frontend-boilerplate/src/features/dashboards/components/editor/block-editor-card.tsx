/**
 * Card de edição de UM bloco (T-G2) — editor ENXUTO, SEM drag-and-drop.
 *
 * Controles comuns: tipo (badge), span (1..12), mover ↑/↓ dentro da row, mover
 * para a row de cima/baixo, remover. Conteúdo:
 *  - bloco narrativo `title`    → editar texto + nível.
 *  - bloco narrativo `rich_text`→ editar markdown.
 *  - bloco de dados (tem dataContract no catálogo) → form de `dataBinding`.
 *
 * Narrativo vs dados é decidido pelo catálogo (`manifest.dataContract`), via o
 * registry do render-engine (T-I) — sem hardcode de lista de tipos.
 */
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getBlock } from '@/shared/render-engine';
import type { DashFilter } from '../../lib/dashboard-filters';
import type { EditorBlock, EditorDataBinding } from '../../lib/layout-editor';
import { DataBindingForm } from './data-binding-form';
import { Textarea } from './textarea';

export interface BlockEditorCardProps {
  block: EditorBlock;
  filters: DashFilter[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveRowUp: boolean;
  canMoveRowDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveRowUp: () => void;
  onMoveRowDown: () => void;
  onRemove: () => void;
  onSpanChange: (span: number) => void;
  onPropsChange: (patch: Record<string, unknown>) => void;
  onBindingChange: (binding: EditorDataBinding | undefined) => void;
}

export function BlockEditorCard(props: BlockEditorCardProps) {
  const {
    block,
    filters,
    canMoveUp,
    canMoveDown,
    canMoveRowUp,
    canMoveRowDown,
    onMoveUp,
    onMoveDown,
    onMoveRowUp,
    onMoveRowDown,
    onRemove,
    onSpanChange,
    onPropsChange,
    onBindingChange,
  } = props;

  const def = getBlock(block.type);
  // Bloco de dados pelo catálogo, OU bloco que já tem um `dataBinding` (ex.: tipo
  // fora do catálogo registrado) — em ambos os casos o binding deve ser editável.
  const isDataBlock = Boolean(def?.manifest?.dataContract) || Boolean(block.dataBinding);
  const propsObj = block.props ?? {};

  return (
    <div
      data-slot="block-editor"
      data-block-id={block.id}
      data-block-type={block.type}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{block.type}</Badge>
          <span className="text-xs text-muted-foreground">{block.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mover bloco para cima"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mover bloco para baixo"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mover bloco para a linha acima"
            disabled={!canMoveRowUp}
            onClick={onMoveRowUp}
          >
            <ChevronsUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mover bloco para a linha abaixo"
            disabled={!canMoveRowDown}
            onClick={onMoveRowDown}
          >
            <ChevronsDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            aria-label="Remover bloco"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* largura (span) */}
      <div className="flex items-center gap-2">
        <Label htmlFor={`span-${block.id}`} className="text-xs">
          Largura (1–12)
        </Label>
        <Input
          id={`span-${block.id}`}
          type="number"
          min={1}
          max={12}
          className="h-8 w-20"
          value={block.span}
          onChange={(e) => onSpanChange(Number(e.target.value))}
        />
      </div>

      {/* conteúdo: narrativo (title/rich_text) ou dados (dataBinding) */}
      {block.type === 'title' ? (
        <TitleEditor props={propsObj} onChange={onPropsChange} blockId={block.id} />
      ) : block.type === 'rich_text' ? (
        <RichTextEditor props={propsObj} onChange={onPropsChange} blockId={block.id} />
      ) : isDataBlock ? (
        <DataBindingForm
          blockId={block.id}
          binding={block.dataBinding}
          filters={filters}
          onChange={onBindingChange}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Este bloco não tem conteúdo editável neste editor.
        </p>
      )}
    </div>
  );
}

function TitleEditor({
  props,
  onChange,
  blockId,
}: {
  props: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  blockId: string;
}) {
  const text = typeof props.text === 'string' ? props.text : '';
  const level = typeof props.level === 'number' ? String(props.level) : '1';
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor={`title-text-${blockId}`} className="text-xs">
          Texto do título
        </Label>
        <Input
          id={`title-text-${blockId}`}
          className="h-9"
          value={text}
          placeholder="Título da seção"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Nível</Label>
        <Select value={level} onValueChange={(v) => onChange({ level: Number(v) })}>
          <SelectTrigger size="sm" className="w-24" aria-label="Nível do título">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1</SelectItem>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function RichTextEditor({
  props,
  onChange,
  blockId,
}: {
  props: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  blockId: string;
}) {
  const markdown = typeof props.markdown === 'string' ? props.markdown : '';
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={`md-${blockId}`} className="text-xs">
        Markdown
      </Label>
      <Textarea
        id={`md-${blockId}`}
        rows={5}
        value={markdown}
        placeholder="## Análise&#10;Texto em **markdown**…"
        onChange={(e) => onChange({ markdown: e.target.value })}
      />
    </div>
  );
}
