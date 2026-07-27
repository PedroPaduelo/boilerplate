import type { UserRole } from '../types';

/**
 * Vocabulário da feature: rótulo em pt-BR e cor de CATEGORIA de cada papel.
 *
 * Fica fora dos componentes porque tabela e formulário precisam do mesmo mapa —
 * e porque papel novo no backend deve entrar em UM lugar só.
 */
const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  ANALYST: 'Analista',
  CREATOR: 'Criador',
  VIEWER: 'Visualizador',
  USER: 'Usuário',
};

/**
 * Papel é CATEGORIA, não status: usa as variantes de cor (blue/purple/teal…),
 * nunca success/warning/error — que o DS reserva para estado que pede ação.
 */
const ROLE_VARIANTS: Record<UserRole, 'purple' | 'blue' | 'teal' | 'cyan' | 'neutral'> = {
  ADMIN: 'purple',
  ANALYST: 'blue',
  CREATOR: 'teal',
  VIEWER: 'cyan',
  USER: 'neutral',
};

/** Fallback defensivo: nunca quebra se o backend trouxer um papel desconhecido. */
export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? 'Desconhecido';
}

export function roleVariant(
  role: UserRole,
): 'purple' | 'blue' | 'teal' | 'cyan' | 'neutral' {
  return ROLE_VARIANTS[role] ?? 'neutral';
}

/** Opções do `Selector` de papel, na mesma ordem/rótulo da tabela. */
export const ROLE_OPTIONS: { value: UserRole; label: string }[] = (
  Object.keys(ROLE_LABELS) as UserRole[]
).map((role) => ({ value: role, label: ROLE_LABELS[role] }));

/** Nome exibível do usuário — cai para o e-mail quando não há nome. */
export function userDisplayName(user: { name: string | null; email: string }): string {
  return user.name ?? user.email;
}
