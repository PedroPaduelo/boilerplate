/**
 * UM controle da barra de filtros, escolhido pelo `type` do contrato de LAYOUT.
 *
 * O catálogo de filtros do contrato traz apenas `{ id, type, label, default }`
 * — não há lista de opções para `select`/`multiselect`, então esses tipos usam
 * campo de texto livre (MVP). `date_range` e `number_range` viram dois campos
 * (de/até, mín/máx) e mantêm o MESMO formato de valor de antes
 * (`{from,to}` / `{min,max}`), que é o que vai no batch de dados.
 */
import type { ISODateString } from '@astryxdesign/core/Calendar';
import { DateInput } from '@astryxdesign/core/DateInput';
import { HStack } from '@astryxdesign/core/Layout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { DashFilter } from '../lib/dashboard-filters';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida a string antes de tratá-la como data ISO (evita input inválido no DS). */
function asISODate(value: unknown): ISODateString | undefined {
  return typeof value === 'string' && ISO_DATE.test(value)
    ? (value as ISODateString)
    : undefined;
}

function asDateRange(value: unknown): { from?: ISODateString; to?: ISODateString } {
  if (!value || typeof value !== 'object') return {};
  const raw = value as { from?: unknown; to?: unknown };
  return { from: asISODate(raw.from), to: asISODate(raw.to) };
}

function asNumberRange(value: unknown): { min?: number; max?: number } {
  if (!value || typeof value !== 'object') return {};
  const raw = value as { min?: unknown; max?: unknown };
  return {
    min: typeof raw.min === 'number' ? raw.min : undefined,
    max: typeof raw.max === 'number' ? raw.max : undefined,
  };
}

export interface FilterControlProps {
  filter: DashFilter;
  value: unknown;
  onChange: (filterId: string, value: unknown) => void;
  /** Desabilita o controle (ex.: enquanto o layout carrega). */
  isDisabled?: boolean;
  disabledMessage?: string;
}

export function FilterControl({
  filter,
  value,
  onChange,
  isDisabled,
  disabledMessage,
}: FilterControlProps) {
  const shared = { isDisabled, disabledMessage, size: 'sm' as const };

  if (filter.type === 'date_range') {
    const range = asDateRange(value);
    return (
      <HStack gap={1} vAlign="end">
        <DateInput
          {...shared}
          label={`${filter.label} (de)`}
          value={range.from}
          hasClear
          width={170}
          onChange={(next) => onChange(filter.id, { ...range, from: next })}
        />
        <DateInput
          {...shared}
          label={`${filter.label} (até)`}
          value={range.to}
          hasClear
          width={170}
          onChange={(next) => onChange(filter.id, { ...range, to: next })}
        />
      </HStack>
    );
  }

  if (filter.type === 'number_range') {
    const range = asNumberRange(value);
    return (
      <HStack gap={1} vAlign="end">
        <NumberInput
          {...shared}
          label={`${filter.label} (mín)`}
          value={range.min ?? null}
          hasClear
          width={120}
          onChange={(next) => onChange(filter.id, { ...range, min: next ?? undefined })}
        />
        <NumberInput
          {...shared}
          label={`${filter.label} (máx)`}
          value={range.max ?? null}
          hasClear
          width={120}
          onChange={(next) => onChange(filter.id, { ...range, max: next ?? undefined })}
        />
      </HStack>
    );
  }

  return (
    <TextInput
      {...shared}
      label={filter.label}
      value={typeof value === 'string' ? value : ''}
      placeholder={filter.label}
      hasClear
      width={200}
      onChange={(next) => onChange(filter.id, next)}
    />
  );
}
