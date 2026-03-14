# Modulo de Search - Analise Completa

**Data da Analise:** 2026-03-14
**Projeto:** Backend Boilerplate
**Motor de Busca:** OpenSearch (via @opensearch-project/opensearch)

---

## Indice

1. [Visao Geral](#visao-geral)
2. [query-service.ts](#query-servicets)
3. [Engine de Search](#engine-de-search)
4. [Indexacao de Documentos](#indexacao-de-documentos)
5. [Endpoints de Search](#endpoints-de-search)
6. [Geo-Search](#geo-search)
7. [Autocomplete](#autocomplete)
8. [Analytics e Aggregations](#analytics-e-aggregations)
9. [Admin Endpoints](#admin-endpoints)
10. [Configuracoes e Environment](#configuracoes-e-environment)

---

## Visao Geral

O modulo de search implementa um sistema de busca full-text robusto utilizando **OpenSearch** como motor de busca. A arquitetura eh dividida em:

```
src/lib/search/
├── index.ts           # cliente OpenSearch singleton
├── config.ts          # schemas e mapping do indice
├── query-service.ts   # logica de consulta (search, geo, autocomplete, aggs)
└── indexing-service.ts # operacoes de indexacao (CRUD, bulk, reindex)

src/http/routes/search/
├── index.ts           # roteador principal
├── search.ts          # endpoint de busca full-text
├── geo-search.ts      # busca geografica
├── autocomplete.ts    # autocomplete/sugestoes
├── analytics.ts       # agregacoes/estatisticas
├── index-document.ts  # indexar documento unico (POST)
├── bulk-index.ts      # indexacao em lote (POST)
├── delete-document.ts # deletar documento (DELETE)
└── admin-index.ts     # admin: reindex, ensure-index
```

---

## query-service.ts

**Arquivo:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/lib/search/query-service.ts`

### Classe: `SearchQueryService`

Responsavel por toda a logica de consulta ao OpenSearch.

### Schemas de Validacao (Zod)

#### `searchQuerySchema`
```typescript
{
  query?: string,           // texto de busca (opcional)
  type?: 'project'|'task'|'user'|'document'|'comment',
  status?: 'active'|'archived'|'draft',
  tags?: string[],
  category?: string,
  authorId?: string,
  dateFrom?: string,       // ISO date
  dateTo?: string,         // ISO date
  fuzzy?: boolean,         // default: true
  fuzziness?: number,      // 0-2, default: 1
  page?: number,           // default: 1, min: 1
  size?: number,           // default: 20, max: 100
  sort?: 'relevance'|'date_desc'|'date_asc', // default: 'relevance'
}
```

#### `geoSearchSchema`
```typescript
{
  query?: string,
  lat: number,             // -90 a 90
  lon: number,             // -180 a 180
  radius?: number,         // default: 50
  unit?: 'km'|'miles',     // default: 'km'
  page?: number,
  size?: number,
}
```

#### `autocompleteSchema`
```typescript
{
  prefix: string,          // min: 1 char
  field?: 'title'|'content'|'tags', // default: 'title'
  size?: number,           // default: 10, max: 20
}
```

### Tipos Principais

#### `SearchHit`
```typescript
interface SearchHit {
  id: string;
  title: string;
  content: string;
  description?: string;
  type: string;
  status?: string;
  tags: string[];
  category?: string;
  author: { id: string; name?: string; email: string };
  location?: { lat: number; lon: number; address?: string };
  score: number;
  createdAt: string;
  updatedAt: string;
  highlighted?: { [field: string]: string[] }; // highlighting
  sortValues?: any; // para geo-search
}
```

#### `SearchResult`
```typescript
interface SearchResult {
  hits: SearchHit[];
  total: number;
  page: number;
  size: number;
  took: number; // ms
}
```

#### `AggregationResult`
```typescript
interface AggregationResult {
  types: { key: string; count: number }[];
  statuses: { key: string; count: number }[];
  tags: { key: string; count: number }[];
  categories: { key: string; count: number }[];
  authors: { key: string; count: number }[];
  dateHistogram: { date: string; count: number }[];
}
```

#### `GeoSearchResult` e `AutocompleteResult`
```typescript
interface GeoSearchResult {
  hits: SearchHit[];
  total: number;
  took: number;
}

interface AutocompleteResult {
  suggestions: { text: string; score: number }[];
}
```

### Metodos do Servico

#### `search(params: SearchQuery): Promise<SearchResult>`

Implementa busca full-text com:

- **multi_match query** com boosting:
  - `title^3` (3x peso)
  - `description^2` (2x peso)
  - `tags^2` (2x peso)
  - `content` (peso normal)

- **Fuzzy matching** opcional (Levenshtein distance):
  - `fuzziness`: 0-2 (default: 1)
  - `prefix_length`: 1
  - `operator: 'or'`

- **Filtros** (terms/range):
  - type, status, tags, category, authorId
  - dateFrom/dateTo no campo `createdAt`

- **Sorting**:
  - `relevance`: _score + createdAt como tiebreaker
  - `date_desc` / `date_asc`: ordenacao por data

- **Highlighting**:
  - Campos: title, content (fragment_size: 150, 3 fragments), description
  - Tags: `<mark>` e `</mark>`

---

#### `aggregate(): Promise<AggregationResult>`

Gera agregacoes/estatisticas do indice:

- `types`: contagem por tipo de documento
- `statuses`: contagem por status
- `tags`: top 50 tags
- `categories`: top 30 categorias
- `authors`: top 20 autores (por author.id)
- `dateHistogram`: distribuicao diaria (calendar_interval: 'day')

Tamanho de resposta limitado (`size: 0`).

---

#### `geoSearch(params: GeoSearchQuery): Promise<GeoSearchResult>`

Busca geografica (geo-distance):

- **geo_distance filter** com `location` (lat/lon)
- Radius: suporta `km` ou `miles` (converte para `mi` se miles)
- Query texto opcional com multi_match (title, content, description)
- **Sort por distancia**: `_geo_distance` ascending

---

#### `autocomplete(params: AutocompleteQuery): Promise<AutocompleteResult>`

Sugestoes de autocomplete:

- **match_phrase_prefix** (boost: 3) -匹配 com prefixo exato
- **match + fuzziness AUTO** (boost: 1) - fallback fuzzy
- Suporta campos: title, content, tags
- Para `tags`: processa array de valores
- Deduplica e ordena por score maximo

---

## Engine de Search

### Tecnologia

**OpenSearch** (fork do Elasticsearch)

```typescript
import { Client } from '@opensearch-project/opensearch';
```

### Configuracao do Cliente

**Arquivo:** `src/lib/search/index.ts`

```typescript
const client = new Client({
  node: env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD
    ? { username, password }
    : undefined,
  ssl: env.OPENSEARCH_SSL ? { rejectUnauthorized: false } : undefined,
});
```

Singleton pattern com lazy initialization.

### Health Check

```typescript
async function isSearchAvailable(): Promise<boolean> {
  const health = await searchClient.cluster.health();
  return health.status !== 'red';
}
```

---

## Indexacao de Documentos

### Classe: `SearchIndexingService`

**Arquivo:** `/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate/backend-boilerplate/src/lib/search/indexing-service.ts`

### Metodos

#### `ensureIndex(): Promise<void>`
Cria o indice se nao existir.

#### `indexDocument(document: SearchDocument): Promise<void>`
Indexa documento unico com `refresh: true` (disponivel imediatamente).

#### `bulkIndex(documents: SearchDocument[]): Promise<void>`
Indexacao em lote via API bulk. Reporta erros por posicao.

#### `updateDocument(id: string, partial: Partial<SearchDocument>): Promise<void>`
Atualizacao parcial. Adiciona `updatedAt` automaticamente.

#### `deleteDocument(id: string): Promise<void>`
Remocao por ID.

#### `bulkDelete(ids: string[]): Promise<void>`
Remocao em lote via API bulk.

#### `reindex(): Promise<void>`
Deleta e recria o indice (usado em manutencoes).

---

## Mapping e Analise

**Arquivo:** `src/lib/search/config.ts`

### Settings

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "document_analyzer": {
          "type": "standard",
          "stopwords": "_portuguese_"
        },
        "autocomplete_analyzer": {
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  }
}
```

**Notas:**
- Analizador em portugues (`_portuguese_` stopwords)
- `autocomplete_analyzer` para sugestoes (lowercase + ascii folding)

### Mappings

| Campo | Tipo | Observacoes |
|-------|------|-------------|
| `id` | keyword | ID do documento |
| `title` | text + `keyword` + `search_as_you_type` | Boosting para busca |
| `content` | text | Analizador portugues |
| `description` | text | Analizador portugues |
| `type` | keyword | Filter |
| `status` | keyword | Filter |
| `tags` | keyword | Array, filter |
| `category` | keyword | Filter |
| `author.id` | keyword | Filter |
| `author.name` | keyword | |
| `author.email` | keyword | |
| `location.lat` | float | Geo |
| `location.lon` | float | Geo |
| `location.address` | text | |
| `metadata` | object | `enabled: false` |
| `createdAt` | date | |
| `updatedAt` | date | |

**Index:** `documents`

---

## Endpoints de Search

### Registro no Server

**Arquivo:** `src/server.ts` (linhas 289-299)

```typescript
// Search routes (public read access)
app.register(search);
app.register(geoSearch);
app.register(autocomplete);
app.register(analytics);

// Admin search routes (protected)
app.register(indexDocument);
app.register(bulkIndex);
app.register(deleteDocument);
app.register(adminIndex);
```

### Routing Principal

**Arquivo:** `src/http/routes/search/index.ts`

Exporta todos os handlers de search.

---

## Endpoints Publicos (Read-Only)

### 1. GET `/search`

**Summary:** Full-text search com fuzzy matching e filtros

**Query Params:** `searchQuerySchema`

**Response 200:**
```json
{
  "results": {
    "hits": [ /* SearchHit[] */ ],
    "total": 150,
    "page": 1,
    "size": 20,
    "took": 45
  }
}
```

**Exemplo:**
```
GET /search?query=projeto&type=task&status=active&page=1&size=20
```

---

### 2. GET `/search/geo`

**Summary:** Geo-spatial search com query texto opcional

**Query Params:** `geoSearchSchema`

**Response 200:**
```json
{
  "results": {
    "hits": [ /* SearchHit[] com sortValues */ ],
    "total": 25,
    "took": 32
  }
}
```

**Exemplo:**
```
GET /search/geo?lat=-23.55&lon=-46.63&radius=50&unit=km
```

---

### 3. GET `/search/autocomplete`

**Summary:** Sugestoes de autocomplete

**Query Params:** `autocompleteSchema`

**Response 200:**
```json
{
  "suggestions": [
    { "text": "Projeto XYZ", "score": 12.5 },
    { "text": "Projeto ABC", "score": 10.0 }
  ]
}
```

**Exemplo:**
```
GET /search/autocomplete?prefix=proj&field=title&size=10
```

---

### 4. GET `/search/analytics`

**Summary:** Aggregations / analytics dos documentos indexados

**Query Params:** nenhum

**Response 200:**
```json
{
  "types": [ { "key": "task", "count": 150 }, ... ],
  "statuses": [ { "key": "active", "count": 120 }, ... ],
  "tags": [ { "key": "urgente", "count": 45 }, ... ],
  "categories": [ { "key": "dev", "count": 80 }, ... ],
  "authors": [ { "key": "user-123", "count": 50 }, ... ],
  "dateHistogram": [ { "date": "2025-03-01", "count": 10 }, ... ]
}
```

---

## Admin Endpoints (Protegidos)

Todos requerem autenticacao (`auth` middleware).

### 5. POST `/search/index`

**Summary:** Indexar documento unico

**Body:** `documentIndexSchema`

**Response 201:**
```json
{
  "success": true,
  "id": "doc-12345"
}
```

---

### 6. POST `/search/bulk`

**Summary:** Indexacao em lote

**Body:**
```json
{
  "documents": [ /* SearchDocument[] */ ]
}
```

**Response 201:**
```json
{
  "success": true,
  "indexed": 150
}
```

---

### 7. DELETE `/search/:id`

**Summary:** Deletar documento do indice

**Params:** `{ id: string }`

**Response 200:**
```json
{
  "success": true,
  "deleted": 1
}
```

---

### 8. POST `/search/reindex`

**Summary:** Recriar indice (drop + create)

**Response 200:**
```json
{
  "success": true,
  "message": "Index recreated"
}
```

---

### 9. POST `/search/ensure-index`

**Summary:** Garantir que indice existe

**Response 200:**
```json
{
  "success": true,
  "message": "Index is ready"
}
```

---

## Geo-Search e Analytics

### Geo-Search

Implementado em:
- `query-service.ts`: metodo `geoSearch()`
- `http/routes/search/geo-search.ts`: endpoint `/search/geo`

**Caracteristicas:**
- `geo_distance` filter com `location` (lat/lon)
- Sort por distancia real (`_geo_distance`)
- Suporte a query texto combinada (filtro AND)

---

### Analytics

Implementado em:
- `query-service.ts`: metodo `aggregate()`
- `http/routes/search/analytics.ts`: endpoint `/search/analytics`

**Aggregations disponiveis:**
- `terms` por: type, status, tags, categories, authors
- `date_histogram` por: createdAt (intervalo diario)

---

## Configuracoes e Environment

### Variaveis de Ambiente

**Arquivo:** `src/lib/env.ts`

```bash
# OpenSearch
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_USERNAME=
OPENSEARCH_PASSWORD=
OPENSEARCH_SSL=false
```

### Dependencias

```json
{
  "@opensearch-project/opensearch": "^3.5.1",
  "zod": "^3.25.76"
}
```

---

## Consideracoes

### Pontos Fortes

1. **Arquitetura limpa**: separacao clara entre services (query/index) e routes
2. **Schema validation**: Zod em todos os endpoints
3. **Full-text robusto**: fuzzy, boosting, highlighting
4. **Geo-search nativo**: OpenSearch suporta geo-ops eficientemente
5. **Bulk operations**: suporte a indexacao/delecao em lote
6. **Analytics integrado**: aggregations sem custo extra de consulta
7. **Autocomplete inteligente**: hibrido (phrase prefix + fuzzy)

### Observacoes

1. **Sem fallback para PostgreSQL**: Nao ha implementacao de busca full-text via PostgreSQL (tsvector).
   Se OpenSearch estiver indisponivel, queries de busca ficam inoperantes.

2. **Indice unico**: Todos os tipos de documento (project, task, user, document, comment) compartilham o mesmo indice `documents`.
   Isso simplifica a busca mas pode impactar performance se volumes forem muito desbalanceados.

3. **Analise portuguesa**: Stopwords portuguesas mas nao stemmer. Considerar adicionar `stemmer` filter.

4. **Replicacao zero**: `number_of_replicas: 0`. Apropriado para dev; em producao deve ser >=1.

5. **Refresh: true**: Indexacao sincrona. Para alta volumetria, considerar `refresh: wait_for` ou desabilitar refresh.

6. **Auth simplificado**: Admin endpoints usam middleware `auth` existente - garantir que roles/permissions estejam adequados.

7. **Paginacao limitada**: `size` max 100. Para deep pagination, considerar `search_after` ao inves de `from/size`.

---

## Arquivos Referenciados

| Arquivo | Descricao |
|---------|-----------|
| `/backend-boilerplate/src/lib/search/query-service.ts` | Servico de consulta (search, geo, autocomplete, aggregations) |
| `/backend-boilerplate/src/lib/search/indexing-service.ts` | Servico de indexacao (CRUD, bulk) |
| `/backend-boilerplate/src/lib/search/config.ts` | Schemas Zod e mapping OpenSearch |
| `/backend-boilerplate/src/lib/search/index.ts` | Cliente OpenSearch singleton |
| `/backend-boilerplate/src/http/routes/search/index.ts` | Roteador principal (export) |
| `/backend-boilerplate/src/http/routes/search/search.ts` | Endpoint GET /search |
| `/backend-boilerplate/src/http/routes/search/geo-search.ts` | Endpoint GET /search/geo |
| `/backend-boilerplate/src/http/routes/search/autocomplete.ts` | Endpoint GET /search/autocomplete |
| `/backend-boilerplate/src/http/routes/search/analytics.ts` | Endpoint GET /search/analytics |
| `/backend-boilerplate/src/http/routes/search/index-document.ts` | POST /search/index |
| `/backend-boilerplate/src/http/routes/search/bulk-index.ts` | POST /search/bulk |
| `/backend-boilerplate/src/http/routes/search/delete-document.ts` | DELETE /search/:id |
| `/backend-boilerplate/src/http/routes/search/admin-index.ts` | POST /search/reindex, /search/ensure-index |
| `/backend-boilerplate/src/lib/env.ts` | Variaveis de ambiente (OPENSEARCH_*) |
| `/backend-boilerplate/src/server.ts` | Registro dos routes (linhas 289-299) |
| `/backend-boilerplate/package.json` | Dependencias (@opensearch-project/opensearch) |

---

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    HTTP Request                      │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│            Fastify Routes (/http/routes/search)     │
│  search.ts | geo-search.ts | autocomplete.ts       │
│  analytics.ts | index-document.ts | bulk-index.ts  │
│  delete-document.ts | admin-index.ts               │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│              SearchQueryService                     │
│  search() | geoSearch() | autocomplete()           │
│  aggregate()                                        │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│         SearchIndexingService                       │
│  indexDocument() | bulkIndex() | updateDocument()  │
│  deleteDocument() | bulkDelete() | reindex()       │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│           OpenSearch Client Singleton               │
│         (@opensearch-project/opensearch)           │
│         Index: 'documents'                          │
└─────────────────────────────────────────────────────┘
```

---
