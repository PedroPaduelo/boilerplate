import type { ReactNode } from 'react';
import { RefreshCw, Search, type LucideIcon } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { VStack } from '@astryxdesign/core/VStack';

/** Substantivo da entidade listada, para textos em PT-BR. */
export interface ArtifactNoun {
  singular: string;
  plural: string;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

/**
 * Carregando: esqueleto com a MESMA anatomia da linha real (ícone, título,
 * metadado e coluna de estado). Espaço reservado no formato certo evita o
 * salto de layout quando os dados chegam — e um spinner solto não diria
 * quantos itens estão vindo.
 */
export function ArtifactListSkeleton({ noun }: { noun: ArtifactNoun }) {
  return (
    <VStack role="status" aria-label={`Carregando ${noun.plural}`}>
      <List hasDividers density="compact">
        {SKELETON_ROWS.map((row) => (
          <ListItem
            key={row}
            startContent={<Skeleton width={20} height={20} radius={2} index={row} />}
            label={<Skeleton width="30%" height={14} radius={1} index={row} />}
            description={<Skeleton width="18%" height={12} radius={1} index={row} />}
            endContent={<Skeleton width={160} height={12} radius={1} index={row} />}
          />
        ))}
      </List>
    </VStack>
  );
}

/**
 * Erro: `Banner` (persistente, no contexto da lista) com a ação de recuperação
 * ao lado da mensagem. Não é `EmptyState` — não está vazio, está quebrado, e a
 * diferença muda o que o usuário deve fazer.
 */
export function ArtifactListError({
  noun,
  onRetry,
}: {
  noun: ArtifactNoun;
  onRetry: () => void;
}) {
  return (
    <Banner
      status="error"
      title={`Não foi possível carregar ${noun.plural}`}
      description="Pode ser uma instabilidade momentânea de rede ou do servidor."
      endContent={
        <Button
          label="Tentar de novo"
          variant="secondary"
          size="sm"
          icon={<Icon icon={RefreshCw} />}
          onClick={onRetry}
        />
      }
    />
  );
}

/**
 * Vazio POR FILTRO: existe conteúdo, o recorte é que não bate. A saída é
 * afrouxar o filtro — por isso a ação primária é limpar, não criar.
 */
export function ArtifactListFilteredEmpty({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <EmptyState
      icon={<Icon icon={Search} size="lg" color="secondary" />}
      title="Nenhum resultado para esses filtros"
      description="Tente outro termo de busca ou remova alguns filtros."
      actions={
        <Button label="Limpar filtros" variant="secondary" onClick={onClearFilters} />
      }
    />
  );
}

/**
 * Vazio de PRIMEIRO USO: não há nada criado. Aqui o usuário não tem o que
 * ajustar — precisa de um caminho para criar, então a ação vem de fora
 * (a feature sabe o que faz sentido criar).
 */
export function ArtifactListEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      icon={<Icon icon={icon} size="lg" color="accent" />}
      title={title}
      description={description}
      actions={action}
    />
  );
}
