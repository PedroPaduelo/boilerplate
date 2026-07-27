/**
 * Estados VAZIOS da listagem de gráficos — dois, porque a saída é diferente:
 *
 *  - filtro ativo → o caminho é LIMPAR o filtro;
 *  - primeiro uso → não há o que ajustar, o usuário precisa de um caminho para
 *    CRIAR. Um gráfico nasce de uma pergunta ao agente ou de um bloco do
 *    catálogo (ele exige tipo + vínculo de dados), então os CTAs levam a esses
 *    dois caminhos reais em vez de um "Novo gráfico" que não teria para onde ir.
 */
import { BarChart3, Blocks, MessageSquare, Search } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/Layout';

export interface ChartsEmptyStateProps {
  hasFilters: boolean;
  canCreate: boolean;
  onClearFilters: () => void;
  onAskAi: () => void;
  onOpenCatalog: () => void;
}

export function ChartsEmptyState({
  hasFilters,
  canCreate,
  onClearFilters,
  onAskAi,
  onOpenCatalog,
}: ChartsEmptyStateProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<Icon icon={Search} size="lg" />}
        title="Nenhum resultado para esses filtros"
        description="Tente outro termo de busca ou remova alguns filtros."
        actions={
          <Button label="Limpar filtros" variant="primary" onClick={onClearFilters} />
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Icon icon={BarChart3} size="lg" />}
      title={canCreate ? 'Nenhum gráfico criado ainda' : 'Nenhum gráfico por aqui ainda'}
      description={
        canCreate
          ? 'Pergunte algo em português ao agente ("faturamento por mês em 2025") e transforme a resposta em um gráfico salvo. Ou explore o catálogo para ver os tipos disponíveis.'
          : 'Quando alguém publicar ou compartilhar um gráfico com você, ele aparece aqui.'
      }
      actions={
        canCreate ? (
          <HStack gap={2}>
            <Button
              label="Criar com IA"
              variant="primary"
              icon={<Icon icon={MessageSquare} />}
              onClick={onAskAi}
            />
            <Button
              label="Ver catálogo"
              icon={<Icon icon={Blocks} />}
              onClick={onOpenCatalog}
            />
          </HStack>
        ) : undefined
      }
    />
  );
}
