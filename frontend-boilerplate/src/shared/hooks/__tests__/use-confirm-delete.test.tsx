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

  it('estado inicial: isOpen=false, deleting=null, isPending=false', () => {
    const { result } = makeRenderHook();
    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isPending).toBe(false);
  });

  it('openDelete(item) define deleting e abre o diálogo', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    expect(result.current.deleting).toEqual(sampleItem);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.dialogProps.itemName).toBe('Meu Item');
  });

  it('close() reseta o state sem chamar a mutação', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(harness.mutationFn).not.toHaveBeenCalled();
  });

  it('dialogProps.onOpenChange(false) também fecha', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.dialogProps.onOpenChange(false));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.deleting).toBeNull();
  });

  it('dialogProps.onOpenChange(true) é no-op', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.dialogProps.onOpenChange(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('passa o id correto para a mutação', () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    expect(harness.mutationFn).toHaveBeenCalledWith('item-1');
  });

  it('confirm é no-op quando não há item pendente', () => {
    const { result } = makeRenderHook();
    act(() => result.current.confirm());
    expect(harness.mutationFn).not.toHaveBeenCalled();
    expect(result.current.deleting).toBeNull();
  });

  it('fecha o diálogo no SUCESSO da mutação (onSettled)', async () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());

    // Antes do settled: pending + open.
    expect(result.current.isPending).toBe(true);
    expect(result.current.isOpen).toBe(true);

    await act(async () => {
      harness.settleOk();
      // Espera microtasks drenarem.
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('fecha o diálogo no ERRO da mutação (onSettled) — o teste do fix', async () => {
    const { result } = makeRenderHook();
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    expect(result.current.isOpen).toBe(true);

    // Mesmo que a mutação rejeite (ex.: 500, 404, rede), o `onSettled` é
    // chamado pelo React Query → o dialog TEM que fechar. Antes do fix, só
    // `onSuccess` resetava, então a UI travava.
    await act(async () => {
      harness.settleFail();
      await Promise.resolve();
    });

    expect(result.current.deleting).toBeNull();
    expect(result.current.isOpen).toBe(false);
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
    expect(result.current.deleting).toEqual(sampleItem);
  });

  it('isPending reflete o state da mutação', async () => {
    const { result } = makeRenderHook();
    expect(result.current.isPending).toBe(false);
    expect(result.current.dialogProps.isPending).toBe(false);

    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    expect(result.current.isPending).toBe(true);
    expect(result.current.dialogProps.isPending).toBe(true);

    await act(async () => {
      harness.settleOk();
      await Promise.resolve();
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.dialogProps.isPending).toBe(false);
  });

  it('pode reabrir o diálogo com outro item após o ciclo fechar', async () => {
    const { result } = makeRenderHook();

    // 1º ciclo
    act(() => result.current.openDelete(sampleItem));
    act(() => result.current.confirm());
    await act(async () => {
      harness.settleOk();
      await Promise.resolve();
    });
    expect(result.current.isOpen).toBe(false);

    // 2º ciclo com item diferente
    act(() => result.current.openDelete(otherItem));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.deleting).toEqual(otherItem);

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
    expect(result.current.dialogProps.itemName).toBe('Outro');

    act(() => result.current.confirm());
    expect(harness.mutationFn).toHaveBeenLastCalledWith('item-2');
  });

  it('dialogProps reflete o estado atual do hook', async () => {
    const { result } = makeRenderHook();
    // Fechado
    expect(result.current.dialogProps.open).toBe(false);
    expect(result.current.dialogProps.isPending).toBe(false);
    expect(result.current.dialogProps.itemName).toBeUndefined();
    expect(result.current.dialogProps.onConfirm).toBe(result.current.confirm);

    // Aberto
    act(() => result.current.openDelete(sampleItem));
    expect(result.current.dialogProps.open).toBe(true);
    expect(result.current.dialogProps.itemName).toBe('Meu Item');

    // Pending
    act(() => result.current.confirm());
    expect(result.current.dialogProps.isPending).toBe(true);

    // Fechado de novo
    await act(async () => {
      harness.settleOk();
      await Promise.resolve();
    });
    expect(result.current.dialogProps.open).toBe(false);
  });

  it('aceita mutation sem getTitle (itemName fica undefined)', () => {
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
    expect(result.current.dialogProps.itemName).toBeUndefined();
  });
});
