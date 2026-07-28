# `catalog` — a superfície HTTP do catálogo vivo

O catálogo é a lista dos tipos de bloco que existem para montar um relatório.
Ele é **gerado em build-time** por `npm run build:catalog`, que varre as pastas
de bloco do front e emite `src/catalog/catalog.manifests.json`. Este módulo
apenas o **serve** — não é a fonte da verdade nem a duplica.

| Rota | O que faz | Permissão |
| --- | --- | --- |
| `GET /catalog` | Lista os tipos. Filtros: `kind`, `shape`, `search`, `includeSchemas`. | `artifacts:view` |
| `GET /catalog/:type` | Manifesto completo de um tipo (`propsSchema` + `dataContract`). | `artifacts:view` |
| `POST /catalog/validate` | Ensaio a seco: o tipo existe? props e dado conformam? | `artifacts:view` |

## Por que estas rotas existem

Antes daqui havia só `/catalog/_status` devolvendo `{"status":"scaffolded"}`.
Na prática existiam **duas listas** do mesmo catálogo sem ponto de comparação: o
front lia o registry do próprio bundle (glob do Vite) e o agente lia o JSON
gerado no build. Uma divergência entre elas não tinha como ser detectada — ela
aparecia lá na frente, como "bloco não implementado" na tela do usuário.

`catalogVersion` acompanha toda resposta: é o número que permite a um layout
salvo dizer sob qual catálogo ele foi escrito, e é onde uma futura migração de
specs antigos se ancora.

## `POST /catalog/validate` — o contrato antes da gravação

```http
POST /catalog/validate
{ "catalogType": "bar_chart",
  "props": { "orientation": "diagonal" },
  "data": { "points": [{ "x": "Jan", "y": 1 }] } }
```

```json
{
  "valid": false,
  "catalogVersion": 1,
  "shape": "series",
  "issues": [
    { "scope": "props", "path": "/orientation",
      "message": "must be equal to one of the allowed values",
      "hint": "Ajuste a prop citada conforme o propsSchema de \"bar_chart\" …" },
    { "scope": "data", "path": "(root)", "message": "must be array",
      "hint": "O resultado precisa estar no shape \"series\". … Formato esperado: [{\"x\":\"Jan\",\"y\":120,\"series\":\"Receita\"}, …]" }
  ]
}
```

Três decisões deliberadas:

1. **200 mesmo quando inválido.** A resposta é o resultado de uma análise
   pedida, não a rejeição de uma requisição malformada. Quem chama quer LER os
   problemas e reescrever o spec; um 4xx transformaria isso em exceção.
2. **Uma issue por problema, com `path`.** Quem corrige — quase sempre um
   modelo — precisa saber onde mexer, não que "as props estão inválidas".
3. **A dica carrega o exemplo do `dataContract`.** Sem ele o erro do validador
   no shape errado é "must be array": verdadeiro e inútil. Com ele, quem lê vê
   a forma certa e acerta na primeira tentativa.

## Tipos internos

`__example` é o bloco-modelo usado como referência de código. Tem manifesto
válido, mas não representa nada de negócio — oferecê-lo ao agente é convidar a
escolha errada. A galeria já o escondia; a listagem pública (REST e MCP) passou
a esconder também, para que **as duas listas sejam a mesma lista**.

> **Pendência conhecida:** `create_chart` ainda ACEITA um tipo interno em
> `catalogType`, porque a checagem vive em `lib/catalog` (`hasCatalogType`) e é
> compartilhada com o módulo `charts`. Fechar isso exige mexer no service de
> charts e trocar a fixture de `tests/mcp.test.ts`.
