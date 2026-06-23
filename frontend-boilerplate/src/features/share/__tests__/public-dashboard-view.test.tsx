import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { dashboardLayoutFixture } from '@dashboards/contracts';
import type { ShareBlockReason } from '../types';

/* --------------------------------------------------------------- mocks ----- */

type HookState = {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  error?: { reason: ShareBlockReason };
};

const artifactState = vi.hoisted(() => ({ value: {} as HookState }));
const dataState = vi.hoisted(() => ({
  value: { data: undefined, isLoading: false, isError: false } as HookState,
}));

vi.mock('../hooks', () => ({
  usePublicArtifact: () => artifactState.value,
  // Snapshot de dados (T-G1 bugfix). Devolve sempre "sem payload" no teste —
  // só validamos que a página renderiza sem quebrar; testes do snapshot em si
  // ficariam no hook (mantemos este arquivo focado na UI).
  usePublicData: () => dataState.value,
}));

import { PublicDashboardView } from '../components/public-dashboard-view';

function renderPublic() {
  return render(
    <MemoryRouter initialEntries={['/public/tok_123']}>
      <Routes>
        <Route path="/public/:token" element={<PublicDashboardView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicDashboardView (read-only + bloqueios)', () => {
  it('token expirado → tela de bloqueio "Link expirado"', () => {
    artifactState.value = { data: undefined, isLoading: false, isError: true, error: { reason: 'expired' } };
    const { container } = renderPublic();
    expect(screen.getByText('Link expirado')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="share-blocked"]')).toHaveAttribute(
      'data-reason',
      'expired',
    );
  });

  it('token revogado → tela de bloqueio "Link revogado"', () => {
    artifactState.value = { data: undefined, isLoading: false, isError: true, error: { reason: 'revoked' } };
    renderPublic();
    expect(screen.getByText('Link revogado')).toBeInTheDocument();
  });

  it('token inexistente → tela de bloqueio "Link não encontrado"', () => {
    artifactState.value = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: { reason: 'not_found' },
    };
    renderPublic();
    expect(screen.getByText('Link não encontrado')).toBeInTheDocument();
  });

  it('token válido → renderiza o dashboard published read-only', () => {
    artifactState.value = {
      data: {
        targetType: 'DASHBOARD',
        expiresAt: '2026-12-31T23:59:59.000Z',
        dashboard: {
          id: 'dash_divida_ativa_2026',
          title: 'Dívida Ativa 2026',
          publishedLayout: dashboardLayoutFixture,
          publishedDataPayload: null,
          publishedAt: '2026-06-01T00:00:00.000Z',
        },
      },
      isLoading: false,
      isError: false,
    };
    const { container } = renderPublic();

    // título + selo read-only
    expect(screen.getByText('Dívida Ativa 2026')).toBeInTheDocument();
    expect(screen.getByText('Somente leitura')).toBeInTheDocument();
    // conteúdo narrativo do layout published renderiza
    expect(screen.getByText('Dívida Ativa — 2026')).toBeInTheDocument();
    // NÃO há FilterBar interativa (nenhuma ação autenticada/edição)
    expect(container.querySelector('[data-slot="filter-bar"]')).toBeNull();
    // não vaza tela de bloqueio
    expect(container.querySelector('[data-slot="share-blocked"]')).toBeNull();
  });
});
