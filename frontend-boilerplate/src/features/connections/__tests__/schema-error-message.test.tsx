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
 *
 * Depois da migração para o Astryx o explorador virou PRESENTACIONAL (recebe
 * `error` por prop, não busca nada), então o teste monta o componente direto —
 * sem mock de hook, sem rede.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { renderWithProviders } from '@/test/render';
import { DbSchemaExplorer } from '../components/db-schema-explorer';

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

const onRetry = vi.fn();

function renderComErro(err: unknown) {
  renderWithProviders(
    <DbSchemaExplorer
      database={null}
      isLoading={false}
      error={err}
      isRefreshing={false}
      onRetry={onRetry}
      selected={null}
      onSelect={vi.fn()}
    />,
  );
}

describe('erro de introspecção de schema', () => {
  beforeEach(() => onRetry.mockReset());

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

  it('oferece a saída de recuperação no próprio banner de erro', () => {
    renderComErro(erroDaApi('connect ETIMEDOUT'));

    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeEnabled();
  });
});
