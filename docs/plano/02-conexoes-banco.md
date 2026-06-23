# 02 — Conexões de banco

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- Cadastrar uma conexão de banco e deixá-la **disponível para uso**.
- Listar conexões.
- Visualização do banco de dados e das **tabelas**.
- A conexão é usada pela **IA**: gerar query, testar, mandar pro gráfico.
- Função central: **executar query** recebendo (conexão + query) e devolvendo o resultado.
- Tudo cadastrado num banco de dados (o banco da aplicação).

## Decisões em aberto
- [ ] Quais SGBDs suportar (Postgres, MySQL, SQL Server, Oracle, ...)? Read-only?
- [ ] Como armazenar credenciais com segurança (cripto at-rest)?
- [ ] Segurança da execução: bloquear DDL/DML destrutivo, timeout, limite de linhas,
      usuário de banco read-only obrigatório?
- [ ] Quem pode cadastrar conexão (qual papel)?
- [ ] Introspecção de schema (listar tabelas/colunas) — sob demanda ou cacheada?
- [ ] Conexão é escopada por departamento/org?

## ✅ Decisões travadas (rodada 2)
- **Só PostgreSQL** no MVP (driver `pg`). Conexões **read-only** (usuário de banco read-only + guarda de SQL).
- Credenciais **cifradas at-rest** (AES-256-GCM com chave do `.env`).
- Introspecção de schema (tabelas/colunas) cacheada no **Redis** (não vira tabela).
- Modelo detalhado em `30-modelagem-dados.md`.

## ✅ Reuso de UI (Vitrine) p/ "visualização do banco/tabelas"
- `db-schema-explorer` (tabelas/colunas), `database-tab-bar`, `db-overview-grid`,
  `query-history-list`, `slow-query-list`. Reduz muito a F3 deste módulo.
