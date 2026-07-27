import { describe, expect, it, vi } from 'vitest';
import type { ArtifactPermContext } from '@/shared/lib/artifact-rbac';
import { buildArtifactCardActions } from '../artifact-action-builder';

const OWNER: ArtifactPermContext = {
  role: 'CREATOR',
  currentUserId: 'me',
  ownerId: 'me',
  status: 'PUBLISHED',
};

const VIEWER: ArtifactPermContext = {
  role: 'VIEWER',
  currentUserId: 'me',
  ownerId: 'someone-else',
  status: 'PUBLISHED',
};

/** Todos os handlers possíveis, para isolar o efeito do RBAC. */
function allHandlers() {
  return {
    open: vi.fn(),
    edit: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    share: vi.fn(),
    export: vi.fn(),
    duplicate: vi.fn(),
    delete: vi.fn(),
  };
}

describe('buildArtifactCardActions', () => {
  it('dono com permissão recebe as ações de gestão, na ordem de exibição', () => {
    const actions = buildArtifactCardActions(OWNER, allHandlers());
    expect(actions.map((action) => action.key)).toEqual([
      'open',
      'edit',
      'unpublish',
      'share',
      'export',
      'duplicate',
      'delete',
    ]);
  });

  it('quem só visualiza não recebe ações destrutivas', () => {
    const actions = buildArtifactCardActions(VIEWER, allHandlers());
    const keys = actions.map((action) => action.key);
    expect(keys).toContain('open');
    expect(keys).not.toContain('delete');
    expect(keys).not.toContain('edit');
  });

  it('ação sem handler não vira item de menu', () => {
    const actions = buildArtifactCardActions(OWNER, { open: vi.fn() });
    expect(actions.map((action) => action.key)).toEqual(['open']);
  });

  it('a exclusão vem separada do resto e marcada como destrutiva', () => {
    const actions = buildArtifactCardActions(OWNER, allHandlers());
    const remove = actions.find((action) => action.key === 'delete');
    expect(remove?.destructive).toBe(true);
    expect(remove?.separatorBefore).toBe(true);
  });

  it('ação desabilitada carrega o motivo (e só ela)', () => {
    const actions = buildArtifactCardActions(
      OWNER,
      allHandlers(),
      ['export'],
      'chega com o PDF',
    );
    const exportAction = actions.find((action) => action.key === 'export');
    const openAction = actions.find((action) => action.key === 'open');

    expect(exportAction?.disabled).toBe(true);
    expect(exportAction?.disabledReason).toBe('chega com o PDF');
    expect(openAction?.disabled).toBe(false);
    expect(openAction?.disabledReason).toBeUndefined();
  });

  it('liga cada ação ao handler correspondente', () => {
    const handlers = allHandlers();
    const actions = buildArtifactCardActions(OWNER, handlers);

    actions.find((action) => action.key === 'duplicate')?.onSelect();
    expect(handlers.duplicate).toHaveBeenCalledTimes(1);
    expect(handlers.delete).not.toHaveBeenCalled();
  });
});
