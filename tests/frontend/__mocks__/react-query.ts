import { vi } from 'vitest';

export const mockUseQuery = vi.fn();

export const createMockQueryClient = () => ({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
