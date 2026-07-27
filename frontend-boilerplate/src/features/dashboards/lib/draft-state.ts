/**
 * Derivações PURAS do rascunho do editor. Sem React — testáveis isoladas.
 *
 * É aqui que mora a ÚNICA definição de "está sujo" e de "há algo por publicar".
 * Repetir essas comparações em cada componente é como o botão Salvar e o botão
 * Publicar passam a discordar um do outro.
 *
 * As duas usam `layoutsEqual`, que compara a forma CANÔNICA (sanitizada) do
 * layout: reordenar chaves ou reescrever o mesmo valor não conta como alteração.
 */
import { layoutsEqual, type EditorLayout } from './layout-editor';
import type { ArtifactStatus } from '../types';

/** Um estado do rascunho: o de trabalho ou a baseline (último salvo). */
export interface DraftSnapshot {
  title: string;
  layout: EditorLayout;
}

/** Há alterações locais ainda não salvas. */
export function isDraftDirty(work: DraftSnapshot, baseline: DraftSnapshot): boolean {
  return work.title !== baseline.title || !layoutsEqual(work.layout, baseline.layout);
}

/**
 * O que está SALVO difere do que está PUBLICADO.
 *
 * Dashboard nunca publicado conta como "há algo por publicar" — senão o destaque
 * de Publicar nunca apareceria justamente no caso em que ele é a próxima ação.
 */
export function hasUnpublishedChanges(
  status: ArtifactStatus,
  savedLayout: EditorLayout,
  publishedLayout: EditorLayout | null,
): boolean {
  if (status !== 'PUBLISHED' || !publishedLayout) return true;
  return !layoutsEqual(savedLayout, publishedLayout);
}
