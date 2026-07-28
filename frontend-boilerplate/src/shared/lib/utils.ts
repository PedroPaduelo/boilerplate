import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Só a hora, no relógio de 24h — "09:10", nunca "9:10 AM".
 *
 * O `Timestamp` do design system formata com `Intl.DateTimeFormat(undefined)`,
 * ou seja, o locale do NAVEGADOR. Isso é correto para um produto internacional
 * e errado para este: num app inteiramente em português, aberto num navegador
 * configurado em inglês, o horário da resposta saía "9:10 AM" ao lado de
 * "Consumo desta resposta". O resto do app já fixa `pt-BR` (ver acima) — esta
 * função só estende o mesmo critério ao horário.
 */
export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
