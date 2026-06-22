import { describe, it, expect } from 'vitest';
import {
  availableArtifactActions,
  canModifyArtifact,
  canPublishArtifact,
  type ArtifactPermContext,
} from '../artifact-rbac';

const OWNER = 'owner-1';

const ctx = (over: Partial<ArtifactPermContext>): ArtifactPermContext => ({
  role: 'CREATOR',
  currentUserId: OWNER,
  ownerId: OWNER,
  status: 'DRAFT',
  ...over,
});

describe('availableArtifactActions — VIEWER (restrições)', () => {
  it('VIEWER só vê abrir e exportar — NUNCA editar/publicar/excluir', () => {
    const actions = availableArtifactActions(
      ctx({ role: 'VIEWER', currentUserId: 'v', ownerId: 'v', status: 'PUBLISHED' }),
    );
    expect(actions).toEqual(['open', 'export']);
    expect(actions).not.toContain('edit');
    expect(actions).not.toContain('publish');
    expect(actions).not.toContain('unpublish');
    expect(actions).not.toContain('delete');
    expect(actions).not.toContain('duplicate');
    expect(actions).not.toContain('share');
  });

  it('USER (sem permissões) só vê abrir', () => {
    const actions = availableArtifactActions(
      ctx({ role: 'USER', currentUserId: 'u', ownerId: 'u' }),
    );
    expect(actions).toEqual(['open']);
  });
});

describe('availableArtifactActions — CREATOR dono', () => {
  it('rascunho próprio: editar/publicar/exportar/duplicar/excluir (sem compartilhar)', () => {
    const actions = availableArtifactActions(ctx({ status: 'DRAFT' }));
    expect(actions).toContain('edit');
    expect(actions).toContain('publish');
    expect(actions).not.toContain('unpublish');
    expect(actions).not.toContain('share'); // só publicado é compartilhável
    expect(actions).toContain('export');
    expect(actions).toContain('duplicate');
    expect(actions).toContain('delete');
  });

  it('publicado próprio: despublicar + compartilhar disponíveis', () => {
    const actions = availableArtifactActions(ctx({ status: 'PUBLISHED' }));
    expect(actions).toContain('unpublish');
    expect(actions).not.toContain('publish');
    expect(actions).toContain('share');
  });

  it('artefato de OUTRO dono: sem editar/publicar/excluir; duplicar permanece', () => {
    const actions = availableArtifactActions(
      ctx({ ownerId: 'someone-else', status: 'PUBLISHED' }),
    );
    expect(actions).not.toContain('edit');
    expect(actions).not.toContain('unpublish');
    expect(actions).not.toContain('delete');
    expect(actions).toContain('duplicate'); // criar cópia é manage, não ownership
    expect(actions).toContain('share'); // share:create + visível (lista já filtrada)
  });
});

describe('availableArtifactActions — ADMIN', () => {
  it('ADMIN pode tudo mesmo sem ser dono', () => {
    const actions = availableArtifactActions(
      ctx({ role: 'ADMIN', currentUserId: 'admin', ownerId: 'x', status: 'PUBLISHED' }),
    );
    expect(actions).toEqual(
      expect.arrayContaining([
        'open',
        'edit',
        'unpublish',
        'share',
        'export',
        'duplicate',
        'delete',
      ]),
    );
  });
});

describe('canModifyArtifact / canPublishArtifact', () => {
  it('ADMIN sempre pode modificar/publicar', () => {
    const c = ctx({ role: 'ADMIN', currentUserId: 'a', ownerId: 'x' });
    expect(canModifyArtifact(c)).toBe(true);
    expect(canPublishArtifact(c)).toBe(true);
  });
  it('CREATOR só modifica/publica os próprios', () => {
    expect(canModifyArtifact(ctx({ ownerId: OWNER }))).toBe(true);
    expect(canModifyArtifact(ctx({ ownerId: 'other' }))).toBe(false);
    expect(canPublishArtifact(ctx({ ownerId: 'other' }))).toBe(false);
  });
  it('VIEWER nunca modifica/publica', () => {
    const c = ctx({ role: 'VIEWER', currentUserId: 'v', ownerId: 'v' });
    expect(canModifyArtifact(c)).toBe(false);
    expect(canPublishArtifact(c)).toBe(false);
  });
});
