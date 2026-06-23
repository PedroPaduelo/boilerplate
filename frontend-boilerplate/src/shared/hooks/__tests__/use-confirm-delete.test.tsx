import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState, createContext, useContext, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useConfirmDelete,
  type UseConfirmDeleteMutation,
} from '../use-confirm-delete';

/** Item usado nos testes. */
interface Item {
  id: string;
  title: string;
}

const sampleItem: Item = { id: 'item-1', title: 'Meu Item' };
const otherItem: Item = { id: 'item-2', title: 'Outro' };

/**
 * Stub de `useMutation` REATIVO (mantém `isPending` em state React para
 * refletir no hook). A `mutate` enfileira uma Promise que só resolve/rejeita
 * quando o teste chama `settleOk()` ou `settleFail()` — assim conseguimos
 * testar o estado "pending" sem `onSettled`.
 */
function makeHarness() {
  // Resolvers pendentes (uma Promise por mutate). O teste chama
  // `settleOk()`/`settleFail()` para resolver/rejeitar.
  type Pending = {
    resolve: () => void;
    reject: (err: unknown) => void;
  };
  let pending: Pending | null = null;
  let capturedOnSettled: (() => void) | undefined;

  const mutationFn = vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_id: string) =>
      new Promise<void>((resolve, reject) => {
        pending = { resolve, reject };
      }),
  );

  function Wrapper({ children }: { children: ReactNode }) {
    const [isPending, setIsPending] = useState(false);
    const wrappedMutation: UseConfirmDeleteMutation<string> = {
      mutate: (id, options) => {
        setIsPending(true);
        capturedOnSettled = options?.onSettled;
        mutationFn(id).then(
          () => {
            setIsPending(false);
            capturedOnSettled?.();
          },
          () => {
            setIsPending(false);
            capturedOnSettled?.();
          },
        );
      },
      isPending,
    };
    return (
      <MutationContext.Provider value={wrappedMutation}>
        <QueryClientProvider client={new QueryClient()}>
          {children}
        </QueryClientProvider>
      </MutationContext.Provider>
    );
  }

  return {
    Wrapper,
    mutationFn,
    settleOk: () => pending?.resolve(),
    settleFail: () => pending?.reject(new Error('boom')),
  };
}

const MutationContext = createContext<UseConfirmDeleteMutation<string> | null>(
  null,
);

/** Hook consumidora do stub — usado DENTRO do hook testado. */
function useStubMutation(): UseConfirmDeleteMutation<string> {
  const stub = useContext(MutationContext);
  if (!stub) throw new Error('MutationContext não provido');
  return stub;
}

describe('useConfirmDelete', () => {
  let harness: ReturnType<typeof makeHarness>;

  beforeEach(() => {
    vi.clearAllMocks();
    harness = makeHarness();
  });

  function makeRenderHook() {
    return renderHook(
      () => {
        const mutation = useStubMutation();
        return useConfirmDelete<Item>({
          mutation,
          getId: (d) => d.id,
          getTitle: (d) => d.title,
        });
      },
      { wrapper: harness.Wrapper },
    );
  }

  it('estado inicial: isOpen=false, deleting=null, isPending=false, confirmation=null', () => {
    const { result } = makeRenderHook();
    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isPending).toBe(false);
    expect(result.current.confirmation).toBeNull();
  });

  it('openDelete(item) define deleting, isOpen=true e preenche confirmation', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    expect(result.current.deleting).toEqual(sampleItem);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.confirmation).not.toBeNull();
    expect(result.current.confirmation?.isPending).toBe(false);
  });

  it('close() reseta o state sem chamar a mutação', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.confirmation).toBeNull();
    expect(harness.mutationFn).not.toHaveBeenCalled();
  });

  it('confirmation.onCancel também fecha (sem chamar mutação)', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    const onCancel = result.current.confirmation!.onCancel;
    act(() => onCancel());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.deleting).toBeNull();
    expect(result.current.confirmation).toBeNull();
    expect(harness.mutationFn).not.toHaveBeenCalled();
  });

  it('passa o id correto para a mutação ao chamar confirm()', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    expect(harness.mutationFn).toHaveBeenCalledWith('item-1');
  });

  it('confirmation.onConfirm é o mesmo confirm() e dispara a mutação', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirmation!.onConfirm());
    expect(harness.mutationFn).toHaveBeenCalledWith('item-1');
  });

  it('confirm é no-op quando não há item pendente', () => {
    const { result } = makeRenderHook();
    act(() => result.current.confirm());
    expect(harness.mutationFn).not.toHaveBeenCalled();
    expect(result.current.deleting).toBeNull();
    expect(result.current.confirmation).toBeNull();
  });

  it('fecha a confirmação no SUCESSO da mutação (onSettled)', async () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());

    // Antes do settled: pending + open + confirmation ativa.
    expect(result.current.isPending).toBe(true);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.confirmation?.isPending).toBe(true);

    await act(async () => {
      harness.settleOk();
      // Espera microtasks drenarem.
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.confirmation).toBeNull();
  });

  it('fecha a confirmação no ERRO da mutação (onSettled) — o teste do fix', async () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    expect(result.current.isOpen).toBe(true);

    // Mesmo que a mutação rejeite (ex.: 500, 404, rede), o `onSettled` é
    // chamado pelo React Query → a confirmação TEM que fechar. Antes do fix,
    // o AlertDialog Radix deixava o `<body>` com `pointer-events: none`.
    await act(async () => {
      harness.settleFail();
      await Promise.resolve();
    });

    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.confirmation).toBeNull();
  });

  it('NÃO fecha enquanto a mutação está pendente (sem settled)', async () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());

    // Sem chamar settle — `onSettled` ainda não rodou.
    // Drena microtasks para garantir que a Promise interna está pendente.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.confirmation?.isPending).toBe(true);
    expect(result.current.deleting).toEqual(sampleItem);
  });

  it('isPending reflete o state da mutação', async () => {
    const { result } = makeRenderHook();
    expect(result.current.isPending).toBe(false);
    expect(result.current.confirmation).toBeNull();

    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    expect(result.current.isPending).toBe(true);
    expect(result.current.confirmation?.isPending).toBe(true);

    await act(async () => {
      harness.settleOk();
      await Promise.resolve();
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.confirmation).toBeNull();
  });

  it('pode reabrir a confirmação com outro item após o ciclo fechar', async () => {
    const { result } = makeRenderHook();

    // 1º ciclo
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    await act(async () => {
      harness.settleOk();
      await Promise.resolve();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.confirmation).toBeNull();

    // 2º ciclo com item diferente
    act(() => result.current.openDelete(otherItem));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.deleting).toEqual(otherItem);
    expect(result.current.confirmation).not.toBeNull();

    act(() => result.current.confirm());
    expect(harness.mutationFn).toHaveBeenLastCalledWith('item-2');
    await act(async () => {
      harness.settleOk();
      await Promise.resolve();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('abrir com item A e depois com item B (sem fechar) usa o item mais recente no confirm', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.openDelete(otherItem));

    expect(result.current.deleting).toEqual(otherItem);

    act(() => result.current.confirm());
    expect(harness.mutationFn).toHaveBeenLastCalledWith('item-2');
  });

  it('aceita mutation sem getTitle (confirmation é montada normalmente)', () => {
    function renderWithoutTitle() {
      return renderHook(
        () => {
          const mutation = useStubMutation();
          return useConfirmDelete<Item>({
            mutation,
            getId: (d) => d.id,
          });
        },
        { wrapper: harness.Wrapper },
      );
    }
    const { result } = renderWithoutTitle();
    act(() => result.current.openDelete(sampleItem));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.confirmation).not.toBeNull();
  });
});
