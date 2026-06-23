# 08 — Publish & versionamento

> Status: ESQUELETO (aguardando respostas)

## O que o usuário disse
- Existe **dev** (em construção) vs **publish** (publicado/em uso).
- **Publish existe tanto para gráfico quanto para dashboard**: publica o gráfico,
  publica o dashboard.
- No publish entra o cache; no dev não.

## Decisões em aberto
- [ ] O que exatamente é "publicar" (snapshot da config? flag de estado?).
- [ ] Versionamento: guarda histórico de versões publicadas? rollback?
- [ ] Editar um dashboard publicado cria rascunho (dev) sem afetar o publicado?
- [ ] Publicar gráfico isolado vs dentro do dashboard.

## ✅ Decisões travadas (rodada 3)
- **Sem histórico de versões.** Modelo: campos `draft*` + `published*` por artefato.
- `publish` = copia draft→published + `publishedAt`. `unpublish` = zera published.
- Sem rollback (decisão do usuário por simplicidade).
