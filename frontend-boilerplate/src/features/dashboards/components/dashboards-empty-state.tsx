/**
 * Estado VAZIO da listagem de dashboards.
 *
 * São dois vazios diferentes e a saída de cada um é diferente:
 *  - com filtro ativo → não há o que criar, há o que LIMPAR;
 *  - primeiro uso     → não há filtro para mexer, falta um caminho para CRIAR.
 * Um texto genérico ("Nenhum dado") deixaria o usuário sem próxima ação.
 */
import { LayoutDashboard, MessageSquare, Plus, SearchX } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';

export interface DashboardsEmptyStateProps {
  hasFilters: boolean;
  /** `false` → sem permissão de criar; o CTA aparece com o motivo. */
  canCreate: boolean;
  isCreating: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
  onAskAgent: () => void;
}

export function DashboardsEmptyState({
  hasFilters,
  canCreate,
  isCreating,
  onCreate,
  onClearFilters,
  onAskAgent,
}: DashboardsEmptyStateProps) {
  if (hasFilters) {
    return (
      <EmptyState
        headingLevel={3}
        icon={<Icon icon={SearchX} size="lg" />}
        title="Nenhum resultado para esses filtros"
        description="Tente outro termo de busca ou remova alguns filtros."
        actions={<Button label="Limpar filtros" onClick={onClearFilters} />}
      />
    );
  }

  return (
    <EmptyState
      headingLevel={3}
      icon={<Icon icon={LayoutDashboard} size="lg" />}
      title={
        canCreate ? 'Crie seu primeiro dashboard' : 'Nenhum dashboard por aqui ainda'
      }
      description={
        canCreate
          ? 'Monte um painel do zero adicionando gráficos e blocos, ou peça ao agente para montar um a partir de uma pergunta em português.'
          : 'Quando alguém publicar ou compartilhar um dashboard com você, ele aparece aqui.'
      }
      actions={
        <>
          <Button
            label="Criar dashboard"
            variant="primary"
            icon={<Icon icon={Plus} />}
            isLoading={isCreating}
            isDisabled={!canCreate}
            tooltip={canCreate ? undefined : 'Seu perfil não permite criar dashboards.'}
            onClick={onCreate}
          />
          <Button
            label="Montar com IA"
            icon={<Icon icon={MessageSquare} />}
            isDisabled={!canCreate}
            tooltip={canCreate ? undefined : 'Seu perfil não permite criar dashboards.'}
            onClick={onAskAgent}
          />
        </>
      }
    />
  );
}
