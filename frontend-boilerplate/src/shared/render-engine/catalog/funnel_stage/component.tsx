/**
 * Bloco `funnel_stage` — uma etapa de funil temporal como painel colapsável.
 * Self-contained (desenha o próprio card; não recebe ChartWidget).
 *
 * Lê `data.rows` (shape table) e separa por `tipo`:
 *  resumo → header + barra · desfecho → tabela + segmentos da barra ·
 *  total → rodapé · nota → observações no fim.
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TableData } from '@dashboards/contracts';
import { resolveLucideIcon } from '../../lib/lucide-resolver';
import {
  formatBRL,
  formatCompactBRL,
  formatNumberBR,
  formatPercentBR,
  toNumber,
} from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { defineBlock } from '../../types';
import type { BlockComponent } from '../../types';
import { manifest } from './manifest';
import { fixture } from './fixture';

type AccentKey = 'blue' | 'red' | 'green' | 'amber' | 'violet' | 'slate';

type FunnelStageProps = {
  stageLabel: string;
  accent?: AccentKey;
  defaultOpen?: boolean;
  barLabel?: string;
  valueFormat?: 'BRL' | 'compactBRL';
};

type Row = Record<string, unknown>;

/** Paleta por accent: cor de texto de destaque, tons da barra e cor do trilho. */
const ACCENT: Record<AccentKey, { text: string; bar: string[]; track: string }> = {
  blue: { text: '#60a5fa', bar: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa'], track: 'rgba(37,99,235,0.10)' },
  red: { text: '#f87171', bar: ['#7f1d1d', '#b91c1c', '#dc2626', '#ef4444'], track: 'rgba(220,38,38,0.10)' },
  green: { text: '#4ade80', bar: ['#14532d', '#15803d', '#16a34a', '#22c55e'], track: 'rgba(22,163,74,0.10)' },
  amber: { text: '#fbbf24', bar: ['#78350f', '#b45309', '#d97706', '#f59e0b'], track: 'rgba(217,119,6,0.10)' },
  violet: { text: '#a78bfa', bar: ['#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6'], track: 'rgba(124,58,237,0.10)' },
  slate: { text: '#94a3b8', bar: ['#334155', '#475569', '#64748b', '#94a3b8'], track: 'rgba(100,116,139,0.10)' },
};

function money(v: unknown, fmt: 'BRL' | 'compactBRL'): string {
  return fmt === 'compactBRL' ? formatCompactBRL(v) : formatBRL(v);
}

const GRID = 'grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-4 sm:gap-x-8';

export const Component: BlockComponent<FunnelStageProps, TableData> = ({ props, data }) => {
  const accent = ACCENT[props.accent ?? 'blue'] ?? ACCENT.blue;
  const fmt = props.valueFormat ?? 'BRL';
  const rows = ((data?.rows ?? []) as Row[]);

  const resumo = rows.find((r) => r.tipo === 'resumo');
  const desfechos = rows.filter((r) => r.tipo === 'desfecho');
  const total = rows.find((r) => r.tipo === 'total');
  const notas = rows.filter((r) => r.tipo === 'nota');

  const [open, setOpen] = useState(Boolean(props.defaultOpen));

  const pct = Math.max(0, Math.min(1, toNumber(resumo?.pct) ?? 0));
  const qtdResumo = toNumber(resumo?.quantidade);
  const valorResumo = toNumber(resumo?.valor);

  // Segmentos da barra: proporcionais ao valor_original (fallback quantidade).
  const segBasis = desfechos.map(
    (d) => Math.abs(toNumber(d.valor_original) ?? toNumber(d.quantidade) ?? 0),
  );
  const segTotal = segBasis.reduce((a, b) => a + b, 0);

  return (
    <div
      data-slot="funnel-stage"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* header (clicável) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 pt-4 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {props.stageLabel}
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* resumo */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-3 pt-2">
        <span className="text-sm font-bold" style={{ color: accent.text }}>
          {qtdResumo != null ? formatNumberBR(qtdResumo, 0) : '—'}
          {resumo?.pct != null ? ` — ${formatPercentBR(pct, 2)} dos lançamentos` : ''}
        </span>
        <span className="text-xl font-bold text-foreground sm:text-2xl tabular-nums">
          {money(valorResumo, fmt)}
        </span>
      </div>

      {/* barra de participação */}
      <div className="px-5 pb-4">
        <div
          className="h-8 w-full overflow-hidden rounded-md"
          style={{ background: accent.track }}
        >
          <div className="flex h-full" style={{ width: `${pct * 100}%` }}>
            {segTotal > 0 ? (
              desfechos.map((d, i) => (
                <div
                  key={`seg-${String(d.desfecho ?? i)}-${i}`}
                  style={{
                    width: `${(segBasis[i] / segTotal) * 100}%`,
                    background: accent.bar[i % accent.bar.length],
                  }}
                />
              ))
            ) : (
              <div className="h-full w-full" style={{ background: accent.bar[2] }} />
            )}
          </div>
        </div>
        {props.barLabel ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">{props.barLabel}</p>
        ) : null}
      </div>

      {/* detalhamento (ao abrir) */}
      {open ? (
        <div className="border-t border-border px-5 py-3">
          <div
            className={cn(
              GRID,
              'border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
            )}
          >
            <span>Desfecho</span>
            <span className="text-right">Quantidade</span>
            <span className="text-right">Valor original</span>
            <span className="text-right">Valor atualizado</span>
          </div>

          {desfechos.map((d, i) => {
            const Icon = resolveLucideIcon(typeof d.icone === 'string' ? d.icone : undefined);
            return (
              <div
                key={`row-${String(d.desfecho ?? i)}-${i}`}
                className={cn(GRID, 'items-start border-b border-border/40 py-3')}
              >
                <div className="flex min-w-0 gap-2">
                  {Icon ? (
                    <span className="mt-0.5 shrink-0" style={{ color: accent.text }}>
                      <Icon className="size-4" />
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {String(d.desfecho ?? '')}
                    </div>
                    {d.descricao ? (
                      <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {String(d.descricao)}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums text-foreground">
                  {formatNumberBR(toNumber(d.quantidade), 0)}
                  {d.quantidade_label ? (
                    <div className="text-[10px] font-normal text-muted-foreground">
                      {String(d.quantidade_label)}
                    </div>
                  ) : null}
                </div>
                <div className="text-right text-sm tabular-nums text-muted-foreground">
                  {money(toNumber(d.valor_original), fmt)}
                </div>
                <div className="text-right text-sm font-semibold tabular-nums text-foreground">
                  {money(toNumber(d.valor_atualizado), fmt)}
                </div>
              </div>
            );
          })}

          {total ? (
            <div className={cn(GRID, 'items-center pt-3')}>
              <div className="text-sm font-bold text-foreground">
                {String(total.desfecho ?? 'Total')}
              </div>
              <div className="text-right text-sm font-bold tabular-nums text-foreground">
                {formatNumberBR(toNumber(total.quantidade), 0)}
              </div>
              <div className="text-right text-sm tabular-nums text-muted-foreground">
                {money(toNumber(total.valor_original), fmt)}
              </div>
              <div className="text-right text-sm font-bold tabular-nums" style={{ color: accent.text }}>
                {money(toNumber(total.valor_atualizado), fmt)}
              </div>
            </div>
          ) : null}

          {notas.map((n, i) => (
            <div
              key={`nota-${String(n.desfecho ?? i)}-${i}`}
              className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {String(n.desfecho ?? '')}
                </span>
                {n.valor_atualizado != null ? (
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {money(toNumber(n.valor_atualizado), fmt)}
                  </span>
                ) : null}
              </div>
              {n.descricao ? (
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {String(n.descricao)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const definition = defineBlock<FunnelStageProps, TableData>({
  type: manifest.type,
  manifest,
  Component,
  fixture,
});
export default definition;
