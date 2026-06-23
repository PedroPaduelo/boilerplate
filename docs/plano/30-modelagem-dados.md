# 30 — Fase 1: Modelagem de dados (Prisma/Postgres da aplicação)

> Status: PROPOSTA v2. Premissas travadas: mono-prefeitura; só PostgreSQL nas
> conexões; **role global**; **sem histórico de versões** (só draft + published);
> **agente roda EXTERNO** → não há tabelas de chat no nosso banco. Catálogo vive em
> código; cache de dados/layout e introspecção vivem no Redis.

## Entidades

```
Department ──< DepartmentMembership >── User
User ──owns──> Connection / Chart / Dashboard / ShareLink
Chart      (draft + published embutidos como JSON; reusável)
Dashboard  (draftLayout + publishedLayout; layout referencia Chart.id)
ShareLink ──> (Dashboard | Chart)   (TTL conta a partir da 1ª abertura)
```
> Sem `ChartVersion`/`DashboardVersion` (decisão: sem histórico).
> Sem `ChatThread`/`ChatMessage` (decisão: runtime do agente é externo).

## Schema Prisma proposto

```prisma
// ===================== RBAC & TENANCY (mono-prefeitura, role global) =====================
enum UserRole { ADMIN ANALYST CREATOR VIEWER USER }
enum Visibility { PRIVATE DEPARTMENT ORG }
enum ArtifactStatus { DRAFT PUBLISHED }   // status corrente do artefato

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  password    String
  role        UserRole @default(VIEWER)
  isActive    Boolean  @default(true) @map("is_active")
  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  memberships DepartmentMembership[]
  connections Connection[]
  charts      Chart[]
  dashboards  Dashboard[]
  shareLinks  ShareLink[]
  @@map("users")
}

model Department {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  memberships DepartmentMembership[]
  connections Connection[]
  charts      Chart[]
  dashboards  Dashboard[]
  @@map("departments")
}

model DepartmentMembership {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  departmentId String   @map("department_id")
  createdAt    DateTime @default(now()) @map("created_at")
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  department Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  @@unique([userId, departmentId])
  @@map("department_memberships")
}

// ===================== CONEXÕES (Postgres externo, read-only) =====================
enum ConnectionType { POSTGRES }

model Connection {
  id             String         @id @default(cuid())
  name           String
  description    String?
  type           ConnectionType @default(POSTGRES)
  host           String
  port           Int            @default(5432)
  database       String
  username       String
  passwordCipher String         @map("password_cipher")   // AES-256-GCM
  sslMode        String         @default("require") @map("ssl_mode")
  options        Json?
  ownerId        String         @map("owner_id")
  departmentId   String?        @map("department_id")
  visibility     Visibility     @default(DEPARTMENT)
  isActive       Boolean        @default(true) @map("is_active")
  status         String         @default("unknown")        // unknown|ok|error
  lastTestedAt   DateTime?      @map("last_tested_at")
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  owner      User        @relation(fields: [ownerId], references: [id])
  department Department? @relation(fields: [departmentId], references: [id])
  @@map("connections")
}

// ===================== GRÁFICO (entidade 1ª classe, reusável; draft+published) =====================
model Chart {
  id           String     @id @default(cuid())
  title        String
  catalogType  String     @map("catalog_type")   // tipo do bloco no catálogo (código)
  ownerId      String     @map("owner_id")
  departmentId String?    @map("department_id")
  visibility   Visibility @default(PRIVATE)
  status       ArtifactStatus @default(DRAFT)

  // cópia de trabalho (sempre editável; usada no modo dev/sem cache)
  draftProps        Json   @map("draft_props")          // props visuais
  draftDataBinding  Json   @map("draft_data_binding")   // { connectionId, query, params[], transform, ttlSeconds }

  // cópia publicada (null até o 1º publish; usada no modo published/com cache)
  publishedProps        Json?  @map("published_props")
  publishedDataBinding  Json?  @map("published_data_binding")
  publishedAt           DateTime? @map("published_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  owner      User        @relation(fields: [ownerId], references: [id])
  department Department? @relation(fields: [departmentId], references: [id])
  @@map("charts")
}

// ===================== DASHBOARD (layout referencia charts; draft+published) =====================
model Dashboard {
  id           String     @id @default(cuid())
  title        String
  ownerId      String     @map("owner_id")
  departmentId String?    @map("department_id")
  visibility   Visibility @default(PRIVATE)
  status       ArtifactStatus @default(DRAFT)

  draftLayout      Json      @map("draft_layout")       // { filters[], rows[] } (ver contrato 20)
  publishedLayout  Json?     @map("published_layout")
  publishedAt      DateTime? @map("published_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  owner      User        @relation(fields: [ownerId], references: [id])
  department Department? @relation(fields: [departmentId], references: [id])
  @@map("dashboards")
}

// ===================== SHARE LINK (TTL a partir da 1ª abertura) =====================
enum ShareTargetType { DASHBOARD CHART }

model ShareLink {
  id              String          @id @default(cuid())
  token           String          @unique
  targetType      ShareTargetType @map("target_type")
  targetId        String          @map("target_id")
  createdById     String          @map("created_by_id")
  durationSeconds Int             @map("duration_seconds")
  firstAccessedAt DateTime?       @map("first_accessed_at")  // null até abrir
  expiresAt       DateTime?       @map("expires_at")         // = firstAccessedAt + duration (na 1ª abertura)
  revokedAt       DateTime?       @map("revoked_at")
  createdAt       DateTime        @default(now()) @map("created_at")
  createdBy User @relation(fields: [createdById], references: [id])
  @@map("share_links")
}
```

## Notas
- **Publish sem histórico**: `publish` copia draft→published e seta `publishedAt`.
  `unpublish` zera os campos published. `status` reflete o estado corrente.
- **dev vs published**: modo dev usa os campos `draft*` e **NÃO** cacheia; modo
  published usa os campos `published*` e usa cache.
- **Reuso**: bloco do dashboard referencia `chartId` (add-to-dashboard + listagem de gráficos).
- **Catálogo**: só `catalogType` (string) no banco; manifesto/Component no código.
- **Redis**: cache de dados, cache de layout publicado, introspecção de schema.

## Decisões em aberto (modelagem) — restantes
- [ ] `AuditLog` (quem fez o quê) — recomendável em prefeitura? (sugiro sim, leve)
- [ ] `Department` plano vs hierárquico (sub-departamentos)? (sugiro plano no MVP)
- [ ] Fundir papéis USER e VIEWER? (parecem redundantes)
- [ ] Um Chart pode estar em vários dashboards (reuso) — confirmar OK.

## ✅ Decisões travadas (rodada 4)
- **Sem `AuditLog`** no MVP.
- `Department` plano (sem hierarquia) no MVP.
- Cache de dados compartilhado (não há tabela; é Redis) — não afeta schema.
