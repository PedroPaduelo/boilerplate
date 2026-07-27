/**
 * Estado de PUBLICAÇÃO de um dashboard dentro do editor.
 *
 * Separado do rascunho porque são dois ciclos de vida diferentes: o rascunho
 * muda a cada tecla, a publicação só muda em duas ações explícitas. Juntos, o
 * `status` e o `publishedLayout` respondem sozinhos a "o que o consumidor vê
 * hoje" — e é isso que o editor compara contra o que está salvo.
 *
 * O gate é `canPublishArtifact` (`artifacts:publish` + dono, ou ADMIN) e usa o
 * status LOCAL, para o botão reagir na hora. O backend continua sendo a
 * autoridade final.
 */
import { useState } from 'react';
import { canPublishArtifact } from '@/shared/lib/artifact-rbac';
import { useAuthStore } from '@/features/auth/store';
import { usePublishDashboard } from './hooks';
import { normalizeLayout, type EditorLayout } from './lib/layout-editor';
import type { ArtifactStatus, DashboardDetail } from './types';

export interface EditorPublication {
  status: ArtifactStatus;
  /** Layout publicado (ou `null`) — base da comparação "há algo por publicar". */
  publishedLayout: EditorLayout | null;
  canPublish: boolean;
  isPublishing: boolean;
  /**
   * Publica e passa a considerar `layout` como a versão publicada. Recebe o
   * layout por parâmetro (em vez de lê-lo daqui) porque o que vai ao ar é o que
   * está SALVO, e quem conhece a baseline é o rascunho.
   */
  publish: (layout: EditorLayout) => void;
  unpublish: () => void;
}

export function useEditorPublication(detail: DashboardDetail): EditorPublication {
  const user = useAuthStore((s) => s.user);
  const publishMut = usePublishDashboard();

  const [status, setStatus] = useState<ArtifactStatus>(detail.status);
  const [publishedLayout, setPublishedLayout] = useState<EditorLayout | null>(() =>
    detail.publishedLayout ? normalizeLayout(detail.publishedLayout) : null,
  );

  const canPublish = canPublishArtifact({
    role: user?.role,
    currentUserId: user?.id,
    ownerId: detail.ownerId,
    status,
  });

  const publish = (layout: EditorLayout) =>
    publishMut.mutate(
      { id: detail.id, publish: true },
      {
        onSuccess: () => {
          setStatus('PUBLISHED');
          setPublishedLayout(layout);
        },
      },
    );

  const unpublish = () =>
    publishMut.mutate(
      { id: detail.id, publish: false },
      {
        onSuccess: () => {
          setStatus('DRAFT');
          setPublishedLayout(null);
        },
      },
    );

  return {
    status,
    publishedLayout,
    canPublish,
    isPublishing: publishMut.isPending,
    publish,
    unpublish,
  };
}
