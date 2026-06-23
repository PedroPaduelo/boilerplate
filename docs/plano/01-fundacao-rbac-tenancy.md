# 01 — Fundação: Multi-tenancy + RBAC + Ownership

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- Sistema fica dentro de uma **prefeitura**, com **departamentos/repartições**.
- Hierarquia de papéis: **admin, usuário, analista, creator, viewer**.
- Vários níveis de acesso: o que cada papel pode ver/fazer (a definir caso a caso).
- **Ownership**: todo gráfico/dashboard/relatório tem um owner (created_by) = quem criou.
- Criação/edição ficam amarradas ao owner; mas o owner pode tornar **público dentro
  de um departamento**.
- Dashboards podem ser **escopados a um departamento**.

## Decisões em aberto
- [ ] Mono-prefeitura (1 org, N departamentos) ou multi-prefeitura (N orgs)?
- [ ] Definir a matriz de permissões por papel (admin/usuário/analista/creator/viewer)
      × ações (criar conexão, criar dashboard, publicar, compartilhar, ver, exportar...).
- [ ] Um usuário pertence a 1 ou N departamentos?
- [ ] "usuário" vs "viewer" — qual a diferença prática?
- [ ] Admin é por departamento ou global da prefeitura?
- [ ] Visibilidade: privado (só owner) / público no departamento / público na org?

## Esboço de modelo (provisório)
- Organization (prefeitura) → Department → User (com role) ; membership user×department.
- Ownership + visibility em cada artefato (dashboard, chart, report).

## ✅ Decisões travadas (rodada 2)
- **Mono-prefeitura**: 1 organização implícita (a própria instância) + N departamentos.
  → Sem tabela `Organization` no MVP. Visibilidade `ORG` = prefeitura inteira.
- Papéis no enum: ADMIN, ANALYST, CREATOR, VIEWER, USER (matriz de permissões ainda a definir).
- Modelo detalhado em `30-modelagem-dados.md`.

## Proposta de matriz RBAC (rodada 5 — a CONFIRMAR)
| Ação | ADMIN | ANALYST | CREATOR | VIEWER | USER |
|------|:-----:|:-------:|:-------:|:------:|:----:|
| Gerenciar usuários/departamentos | ✅ | — | — | — | — |
| Cadastrar/editar conexões | ✅ | ✅ | — | — | — |
| Rodar query / usar conexões disponíveis | ✅ | ✅ | ✅ | — | — |
| Criar/editar charts e dashboards (próprios) | ✅ | ✅ | ✅ | — | — |
| Publicar/despublicar (próprios) | ✅ | ✅ | ✅ | — | — |
| Ver dashboards/charts (conforme visibilidade) | ✅ | ✅ | ✅ | ✅ | — |
| Exportar PDF / abrir share | ✅ | ✅ | ✅ | ✅ | — |
| Criar share-link | ✅ | ✅ | ✅ | — | — |

> Sugestão: **USER** = conta autenticada sem acesso a dashboards (ou fundir com VIEWER).
> Confirmar/ajustar antes de gerar tasks.

## ✅ RBAC aprovado (rodada 6)
- Matriz proposta **aprovada** pelo usuário. 5 papéis mantidos (USER = conta autenticada
  sem acesso a dashboards). Vira a base do middleware `requirePermission`.
