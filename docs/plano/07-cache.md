# 07 — Cache (FE + BE)

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- Cache no front com **TanStack Query**; no back com camada **Redis**.
- A decisão da camada de cache é feita **no chat com o agente**: ele pergunta a
  frequência de atualização do dado. Ex.: "atualiza 1x/dia" → cacheia por 1 dia.
- **TTL é por gráfico** (cada gráfico com seu TTL; tem gráfico tempo-real).
- **Ambiente dev (em construção no chat): NÃO cacheia** — sempre busca fresco,
  senão atrapalha o teste.
- **Ambiente publish (em uso): usa o cache** definido com o usuário.

## Decisões em aberto
- [ ] Chave de cache (conexão+query+filtros?) e invalidação.
- [ ] Como o backend diferencia requisição "dev" de "publish".
- [ ] Cache compartilhado entre usuários ou por usuário (cuidado com filtros/permissões)?
- [ ] Interação fila × cache: fila popula cache e socket notifica?
