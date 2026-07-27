/**
 * Editor de dashboard — `/dashboards/:id/edit`.
 *
 * Decisão travada do MVP: SEM drag-and-drop. As operações são por formulários e
 * botões — reordenar blocos (dentro da linha e entre linhas), remover, ajustar
 * span, editar blocos narrativos, ajustar filtros e o `dataBinding`, adicionar
 * um gráfico existente e PUBLICAR/DESPUBLICAR — o que também deixa tudo
 * operável por teclado.
 *
 * Esta página é só o PORTÃO: carrega o dashboard, resolve os quatro estados
 * (carregando, erro, sem permissão, conteúdo) e entrega o resto ao
 * `EditorContent`. O estado de edição vive em `useEditorDraft` e o preview em
 * `useEditorPreview`.
 *
 * RBAC: a rota já exige `artifacts:manage`; aqui reforçamos a OWNERSHIP via
 * `canModifyArtifact` (403 para quem não é dono). Publicar é gateado à parte,
 * dentro do rascunho — e o backend continua sendo a autoridade final.
 */
import { useParams } from 'react-router-dom';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { VStack } from '@astryxdesign/core/Layout';
import { ForbiddenPage } from '@/shared/components/forbidden-page';
import { canModifyArtifact } from '@/shared/lib/artifact-rbac';
import { useAuthStore } from '@/features/auth/store';
import { useDashboard } from '../hooks';
import { DashboardBreadcrumbs } from './dashboard-breadcrumbs';
import { EditorContent } from './editor/editor-content';
import { EditorSkeleton } from './editor/editor-skeleton';

export function DashboardEditor() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const detailQuery = useDashboard(id, 'draft');
  const detail = detailQuery.data;

  if (detailQuery.isLoading && !detail) return <EditorSkeleton />;

  if (detailQuery.isError || !detail) {
    return (
      <VStack gap={4}>
        <DashboardBreadcrumbs current="Editar" />
        <Banner
          status="error"
          title="Não foi possível carregar este dashboard para edição"
          description="Ele pode não existir, ter sido excluído, ou estar inacessível para o seu perfil."
          endContent={
            <Button label="Tentar de novo" onClick={() => void detailQuery.refetch()} />
          }
        />
      </VStack>
    );
  }

  const canEdit = canModifyArtifact({
    role: user?.role,
    currentUserId: user?.id,
    ownerId: detail.ownerId,
    status: detail.status,
  });

  if (!canEdit) {
    return (
      <ForbiddenPage description="Só o dono do dashboard (ou um administrador) pode editá-lo." />
    );
  }

  // `key` no id: trocar de dashboard tem que recomeçar o rascunho do zero, e
  // não herdar o layout em edição do anterior.
  return <EditorContent key={detail.id} detail={detail} />;
}
