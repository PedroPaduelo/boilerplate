/**
 * "há 2 min" que se mantém verdadeiro sozinho.
 *
 * A tela de um painel FICA ABERTA — num telão de reunião, por horas. Um "há 2
 * min" congelado vira mentira em dez minutos, e mentira sobre frescor de dado é
 * pior que ausência de informação.
 *
 * Renderiza `<time dateTime>` (semântico, e o `title` dá a hora exata a quem
 * precisa registrar em ata) e recalcula num passo proporcional à idade do dado
 * — ver `relativeTickInterval`.
 */
import { useEffect, useState } from 'react';
import {
  formatExactTime,
  formatRelativeTime,
  relativeTickInterval,
} from '../../lib/relative-time';

export interface RelativeTimeProps {
  /** Epoch em ms. `0`/inválido não renderiza nada. */
  value: number;
}

export function RelativeTime({ value }: RelativeTimeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = relativeTickInterval(value);
    if (interval == null) return;
    const id = window.setInterval(() => setTick((t) => t + 1), interval);
    return () => window.clearInterval(id);
  }, [value]);

  if (!value) return null;

  return (
    <time dateTime={new Date(value).toISOString()} title={formatExactTime(value)}>
      {formatRelativeTime(value)}
    </time>
  );
}
