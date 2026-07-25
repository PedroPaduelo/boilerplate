/**
 * Regressão: a tela precisa mostrar o motivo REAL da falha de introspecção.
 *
 * O backend já devolve a causa exata no corpo da resposta — "connect
 * ECONNREFUSED 1.2.3.4:54349", "password authentication failed for user",
 * "The server does not support SSL connections". A tela lia `error.message`
 * direto do AxiosError, que é sempre "Request failed with status code 400":
 * texto que não diz NADA e não permite distinguir host errado, porta errada,
 * senha errada ou SSL.
 *
 * Isso já custou um ciclo inteiro de diagnóstico às cegas — uma conexão
 * apontando para o host errado parecia, na tela, o mesmo erro de uma com
 * problema de SSL.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { ConnectionSchemaDialog } from '../components/connection-schema-explorer';
import type { Connection } from '../types';

const { useConnectionSchemaMock } = vi.hoisted(() => ({
  useConnectionSchemaMock: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useConnectionSchema: (...args: unknown[]) => useConnectionSchemaMock(...args),
}));

const connection = { id: 'conn-1', name: 'Banco WhatsApp' } as Connection;

/** Erro como o axios entrega: message genérica + causa real no corpo. */
function erroDaApi(mensagemDoBackend: string) {
  const err = new AxiosError('Request failed with status code 400');
  err.response = {
    data: { message: mensagemDoBackend },
    status: 400,
    statusText: 'Bad Request',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

function renderComErro(err: unknown) {
  useConnectionSchemaMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error: err,
    refetch: vi.fn(),
    isFetching: false,
  });
  render(<ConnectionSchemaDialog connection={connection} open onOpenChange={vi.fn()} />);
}

describe('erro de introspecção de schema', () => {
  beforeEach(() => useConnectionSchemaMock.mockReset());

  it.each([
    ['connect ECONNREFUSED 176.126.87.167:54349'],
    ['password authentication failed for user "postgres"'],
    ['The server does not support SSL connections'],
  ])('mostra a causa real da API: %s', (mensagem) => {
    renderComErro(erroDaApi(mensagem));

    expect(screen.getByText(mensagem)).toBeInTheDocument();
    // E não pode exibir o texto genérico do axios.
    expect(screen.queryByText(/Request failed with status code/i)).toBeNull();
  });

  it('cai num texto prestativo quando a API não manda mensagem', () => {
    renderComErro(new Error('boom'));

    expect(
      screen.getByText(/Verifique a conectividade da conexão e tente novamente/i),
    ).toBeInTheDocument();
  });
});
