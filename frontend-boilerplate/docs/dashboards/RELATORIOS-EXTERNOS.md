# Relatórios externos (legado) na lista de dashboards

Como cadastrar um relatório que foi feito **fora** desta plataforma para que ele
apareça na mesma lista dos dashboards montados aqui.

---

## O que é

Um **relatório externo** é um dashboard que não tem layout: ele só guarda um
**endereço**. Serve para o acervo anterior à plataforma (um BI antigo, um painel
de terceiro) continuar visível onde as pessoas procuram painel — sem precisar
migrar nada agora.

Na listagem ele é mais um item, com duas diferenças visíveis:

|                   | Dashboard daqui                                                    | Relatório externo                                      |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| Clique no título  | abre a tela do dashboard                                           | abre o **endereço original em nova aba**               |
| Coluna **Status** | Rascunho / Publicado                                               | **Externo**                                            |
| Sob o título      | "Meu dashboard"                                                    | o **domínio** de destino                               |
| Menu "…"          | abrir, editar, publicar, exportar, compartilhar, duplicar, excluir | **abrir relatório, editar cadastro, remover da lista** |

Busca, filtros, paginação, visibilidade (`PRIVATE`/`DEPARTMENT`/`ORG`) e RBAC
funcionam igual — é a mesma entidade `Dashboard`.

---

## Como cadastrar

1. Vá em **Dashboards**.
2. Clique em **"Relatório externo"** (ao lado de "Novo dashboard").
3. Preencha:
   - **Nome do relatório** — é o que aparece na lista;
   - **Endereço** — cole o link completo. Sem `http://`/`https://`, assumimos
     `https://`;
   - **Visibilidade** — quem enxerga o item na lista (o acesso ao relatório em
     si continua sendo controlado por quem o hospeda).
4. **Cadastrar relatório**. Ele já aparece na lista.

Para corrigir nome ou endereço depois: menu **"…" → Editar cadastro**.
Para tirar da lista: **"…" → Remover da lista** (o relatório de origem não é
tocado — some só o atalho).

---

## O que ele NÃO faz (e por quê)

Publicar, exportar em PDF, compartilhar por link público, duplicar e abrir no
editor **não existem** para um relatório externo — nem na interface, nem na API
(o backend responde `400`). Todas essas operações dependem de um layout que este
item não tem: o conteúdo é de outro sistema. Oferecer os botões seria entregar
ações que só sabem falhar.

O "link para compartilhar" de um relatório externo já existe: é a própria URL
dele.

---

## No código

| Camada            | Onde                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Modelo            | `dashboards.external_url` (`String?`), migração `20260730120000_add_dashboard_external_url`                          |
| Regra             | `modules/dashboards/service.ts` → `assertNotExternalDashboard()` + `createDashboard()`                               |
| Contrato HTTP     | `POST /dashboards` com `externalUrl` (e sem `draftLayout`); `PATCH` aceita `externalUrl` só em item que já é externo |
| Regras puras (FE) | `features/dashboards/lib/external-dashboard.ts`                                                                      |
| Formulário        | `components/external-dashboard-dialog.tsx` + `use-external-dashboard-form.ts`                                        |
| Listagem          | `components/dashboards-page.tsx` (monta a linha) e `dashboards-table.tsx` (desenha)                                  |
| Tela por ID       | `components/external-dashboard-view.tsx` (paleta ⌘K, "recentes", link direto)                                        |

### Decisões que valem lembrar

- **Externo é `externalUrl != null`** — não existe uma coluna `kind` para sair de
  sincronia com a URL.
- **Nasce `PUBLISHED` com layout vazio dos dois lados.** Um relatório legado já
  está no ar; e um `PUBLISHED` sem `publishedLayout` quebraria a invariante que
  o resto do módulo (GET `?mode=published`, export, share) assume.
- **Só `http`/`https`.** O endereço vira `href` de verdade na listagem, então
  aceitar `javascript:`/`data:` seria XSS armazenado.
- **Não dá para converter** um dashboard daqui em atalho externo (nem o
  contrário): a conversão esconderia um layout já construído. Cadastre outro.
