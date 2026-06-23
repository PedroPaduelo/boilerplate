# 05 — MCP Server (a IA configura tudo)

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- A IA configura props/gráficos/dashboards **via MCP**, gravando no banco.
- MCP tem **catálogo** de gráficos, composições, seções, títulos.
- Documentação muito bem definida: tools, gráficos disponíveis, dados necessários
  para gerar e renderizar cada gráfico.
- Tools previstas: executar query (conexão+query → resultado), listar conexões,
  listar catálogo, criar/atualizar config de gráfico e dashboard, etc.

## Decisões em aberto
- [ ] Runtime do MCP: serve no próprio backend Fastify ou processo separado?
- [ ] Transporte (HTTP/SSE) e autenticação do MCP.
- [ ] Lista completa de tools do MCP (CRUD config, query, catálogo, publish...).
- [ ] Como o MCP entrega a documentação do contrato de cada gráfico ao agente.
