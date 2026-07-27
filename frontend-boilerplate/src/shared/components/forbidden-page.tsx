import { ShieldX } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';

export interface ForbiddenPageProps {
  /** Mensagem opcional sobre o que era necessário. */
  description?: string;
}

/**
 * Tela de 403 (acesso negado por papel/permissão), renderizada pelo guarda
 * `RequireRole` quando o usuário autenticado não tem a permissão exigida.
 *
 * É um `EmptyState`, não um `Banner`: a página inteira é o "vazio" e o usuário
 * precisa de uma SAÍDA, não de um aviso empilhado sobre um conteúdo que não
 * existe. A saída é um link de verdade (`href`), que o `LinkProvider` do shell
 * converte em navegação client-side.
 */
export function ForbiddenPage({ description }: ForbiddenPageProps) {
  return (
    <EmptyState
      icon={<Icon icon={ShieldX} size="lg" color="error" />}
      title="Acesso negado"
      description={description ?? 'Você não tem permissão para acessar esta página.'}
      headingLevel={2}
      actions={<Button label="Voltar ao início" variant="secondary" href="/" />}
    />
  );
}
