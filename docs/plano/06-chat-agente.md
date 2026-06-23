# 06 — Chat / Agente (fluxo de criação)

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- Chat onde o usuário pede o relatório ("quero relatório sobre dívida ativa").
- Agente pergunta **qual conexão**, depois **o que** quer (expectativa/gráfico).
- Executa query na conexão, **analisa** o resultado e **escolhe a visualização**
  (ou o usuário pede do catálogo).
- Mostra o **gráfico no próprio chat**, com botão **"adicionar a um dashboard"**.
- Agente pergunta a **frequência de atualização** → define TTL/cache.
- Vai usar um **agente que lê skills/rules** (transcrição cortou aqui).

## Decisões em aberto
- [ ] Onde roda o loop do agente (provider de LLM, runtime, custo)?
- [ ] Persistência das conversas (histórico, threads por dashboard?).
- [ ] Como o chat envia perguntas estruturadas ao usuário (escolha de conexão etc.).
- [ ] Renderização do gráfico no chat reusa o motor de render do dashboard?
- [ ] Skills/rules do agente: onde ficam, formato.

## ✅ Decisões travadas (rodada 4)
- Chat **embutido no nosso FE**; gestão do agente é **externa** (API fornecida pelo usuário).
- Agente externo cria via **nosso MCP** → retorna `chartId` → FE renderiza inline com o
  **render engine** compartilhado + botão "adicionar ao dashboard".
- Sem persistência de chat no nosso banco (histórico vive na ferramenta externa).
- **Bloqueado por**: spec da API externa do agente (endpoints/auth/streaming).

## ✅ Decisão (rodada 7) — Chat MOCKADO primeiro, integração por último
- O chat embutido é construído **mockado** (respostas/streaming/gráfico-inline simulados)
  para validar a **experiência visual** — único componente do projeto feito com mock.
- É a **última coisa** do desenvolvimento (depois de todo o resto pronto).
- **Integração real** com a API externa do agente fica para o fim, quando o usuário
  entregar a spec/credenciais. Será uma task separada (trocar a camada de mock pela API real).
- Contrato do mock = o mesmo formato que a API real deverá seguir (mensagens, streaming,
  e payload com `chartId` p/ render inline + "adicionar ao dashboard").
