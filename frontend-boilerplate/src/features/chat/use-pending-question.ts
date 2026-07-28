/**
 * A pergunta que chegou pela URL (`/chat?q=…`) — o outro lado do "perguntar de
 * qualquer lugar" da paleta de comandos (⌘K).
 *
 * Duas regras que fazem isso não atrapalhar quem já está na tela:
 *
 * 1. **Lê UMA vez.** O valor é capturado na montagem e o parâmetro sai da URL
 *    logo em seguida (`replace`, sem entrada nova no histórico). Sem isso, um
 *    F5 — ou o botão "voltar" — reinjetaria a mesma pergunta por cima do que o
 *    usuário estivesse escrevendo.
 * 2. **Só preenche, não envia.** A pergunta chega escrita no composer e espera
 *    o Enter. Numa ferramenta de auditoria a pergunta é a premissa da
 *    evidência: quem pergunta revisa antes de gastar uma execução do agente.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Nome do parâmetro. Combinado com quem monta o link na paleta. */
export const QUESTION_PARAM = 'q';

export function usePendingQuestion(): string {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lazy init: o valor do PRIMEIRO render, antes da limpeza abaixo.
  const [question] = useState(() => searchParams.get(QUESTION_PARAM)?.trim() ?? '');

  useEffect(() => {
    if (!searchParams.has(QUESTION_PARAM)) return;
    const next = new URLSearchParams(searchParams);
    next.delete(QUESTION_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return question;
}
