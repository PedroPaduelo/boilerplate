# Migração da UI → Astryx (XDS)

Contrato único da migração — agora **CONCLUÍDA**. Vale como regra permanente de
UI: o que está aqui é o que continua valendo para toda tela nova.
Referência de API: [`./api-reference.md`](./api-reference.md) (74 componentes, gerado da CLI).

Verificação automática: `node scripts/audit-migration.mjs` (0 bloqueantes é a
condição de merge).

---

## 1. Objetivo — status

Substituir 100% da UI legada (shadcn/Radix/Tremor em `src/components/ui`) por
componentes do Astryx.

✅ **Cutover feito.** `src/components/` e `src/app/legacy-theme.css` foram
DELETADOS, e o bridge `@astryxdesign/core/tailwind-theme.css` está ativo. Não
existe mais nenhum import de `@/components/ui` — e nenhum pode voltar.

Foi um **redesign**, não um reskin: as features continuam idênticas, a
apresentação passou a ser a do design system.

---

## 2. Regras invioláveis

1. **Componentes > primitivos.** Nunca um `<div>`/`<span>`/`<p>`/`<h1>` cru para
   algo que o DS resolve (`Stack`, `Text`, `Heading`, `Card`, `Table`, `Item`…).
2. **Zero valor mágico.** Nenhum `#hex`, `rgb()`, `16px`, `text-gray-500`.
   Só tokens: `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`.
   Espaçamento vem das props (`gap={3}`, `padding={4}`), não de `margin`.
3. **Sem `style={{}}` para aparência.** Layout e estilo saem, nesta ordem, de:
   props do componente → utilities Tailwind com token → `style` (só nos dois
   casos abaixo).

   ⚠️ **`xstyle` não é opção neste app.** O `xstyle` exige `stylex.create()`,
   que precisa do compilador StyleX no build — e o Vite daqui **não** tem o
   plugin (só o `@tailwindcss/vite`). A própria doc do DS diz: _"For non-StyleX
   styling (Tailwind, external CSS), use className instead"_. Escrever
   `stylex.create()` no app entrega objeto não-compilado e o estilo simplesmente
   não aplica.

   `style={{}}` é aceito **apenas** nestes dois casos, cada um com comentário de
   uma linha justificando:
   - **valor computado em runtime** — geometria/animação que só existe com o
     dado na mão (`width: ${pct}%`, posição de um beam). É o que o próprio DS
     faz no `ProgressBar` (`style="width: 40%"`);
   - **pintura de SVG com token** — `stroke`/`fill`/`stopColor` precisam vir por
     CSS (`style={{stroke: 'var(--color-border)'}}`), porque atributo de
     apresentação do SVG **não resolve `var()`**.

   Fora disso — `position: relative`, `height: 100%`, cor, espaçamento,
   tipografia — é componente do DS ou utility Tailwind com token.

4. **Nunca invente props.** Consulte `api-reference.md` ou
   `npx astryx component <Nome> --dense` antes de usar.
5. **Imports por subpath:** `import {Button} from '@astryxdesign/core/Button'`.
6. **Inputs controlados:** `value` + `onChange`.
7. **Sem `any`.** Props tipadas e explícitas.
8. **UI sem regra de negócio.** Componente de apresentação recebe dados por
   prop; fetch/estado ficam em hooks (`use*.ts`).

---

## 3. Mapa legado → Astryx

| Legado (`@/components/ui/*`)                          | Astryx                                              | Observação                                                                    |
| ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `button`                                              | `Button` / `IconButton`                             | `label` é **obrigatório** (vira aria-label no icon-only). `size: sm\|md\|lg`. |
| `badge`                                               | `Badge`                                             | Só contadores/estados enumerados. Decoração → `StatusDot`/`Token`.            |
| `input`                                               | `TextInput`                                         | Envolva em `Field` para rótulo/erro.                                          |
| `label`                                               | `Field` + `FieldLabel`                              | `Field` já liga label↔input↔erro.                                             |
| `select`                                              | `Selector` / `MultiSelector`                        | Opções via `SelectorOption`.                                                  |
| `switch`                                              | `Switch`                                            |                                                                               |
| `skeleton`                                            | `Skeleton`                                          |                                                                               |
| `card`                                                | `Card` / `ClickableCard`                            | **Nunca** por item de lista.                                                  |
| `dialog`                                              | `Dialog` + `DialogHeader`                           |                                                                               |
| `alert-dialog`                                        | `AlertDialog`                                       | Confirmação destrutiva.                                                       |
| `sheet`                                               | `Dialog` / `Overlay`                                |                                                                               |
| `alert`, `callout-tremor`                             | `Banner`                                            | Mensagem persistente em contexto.                                             |
| `tabs`                                                | `TabList` + `Tab`                                   |                                                                               |
| `table`, `table-fluid`, `data-table`, `invoice-table` | `Table` + `TableRow`/`TableCell`/`TableHeaderCell`  | Sort/seleção/paginação via `useTable*`.                                       |
| `tooltip`, `tooltip-card`, `tooltip-fluid`            | `Tooltip`                                           |                                                                               |
| `hover-card`                                          | `HoverCard`                                         |                                                                               |
| `dropdown-menu`                                       | `DropdownMenu` / `MoreMenu`                         | `items` declarativos.                                                         |
| `separator`, `divider-tremor`                         | `Divider`                                           |                                                                               |
| `scroll-area`                                         | `Stack isScrollable` / `LayoutContent isScrollable` |                                                                               |
| `collapsible`, `collapsible-section`                  | `Collapsible` / `CollapsibleGroup`                  |                                                                               |
| `tree`                                                | `TreeList`                                          |                                                                               |
| `progress-bar-tremor`                                 | `ProgressBar`                                       |                                                                               |
| `sql-highlight`                                       | `CodeBlock` (+ `SyntaxTheme`)                       |                                                                               |
| `avatar`                                              | `Avatar`                                            | Iniciais automáticas via `name`.                                              |
| `section`                                             | `Section`                                           |                                                                               |
| `resizable`                                           | `Layout` + `LayoutPanel`                            |                                                                               |
| `sonner`                                              | `useAppToast()`                                     | Já migrado — ver §6.                                                          |
| `dashboard-topbar`, `dashboard-sidebar-nav`           | `TopNav` / `SideNav`                                | Já migrado no shell.                                                          |
| — estados vazios                                      | `EmptyState`                                        | Toda lista precisa de um.                                                     |
| — carregando                                          | `Skeleton` / `Spinner`                              |                                                                               |

### Sem equivalente no DS → `src/shared/ui/`

Gráficos e visualizações (`area/bar/line/donut/h-bar/scatter/spark/sparkline/
radial-gauge/progress-circle/bar-list`), `kpi-card`, `stat-tile`, e os blocos
decorativos do catálogo. **Todos devem ser reescritos sobre tokens do Astryx**
(cores de série via `useTheme()` → `--color-data-categorical-*`), nunca com hex.
Cada um precisa de um comentário no topo justificando por que é próprio.

---

## 4. Onde mora cada coisa (FSD)

```
src/
  app/            shell, providers, rotas   ← território fechado
  features/<x>/
    components/   componentes usados SÓ por esta feature
    hooks.ts      dados/estado (TanStack Query)
    api.ts        chamadas HTTP
  shared/
    ui/           primitivos de apresentação SEM equivalente Astryx
    components/   composições de negócio compartilhadas
    hooks/ lib/   hooks e helpers genéricos
```

**Regra de destino:** usado por 1 feature → mora na feature. Usado por 2+ →
`shared/ui`. Não usado → **deleta** (não comente, não desative).

Dependência só aponta para dentro: `features` → `shared`. Nunca o contrário,
nunca feature → feature.

---

## 5. Limites de tamanho (obrigatório)

| Arquivo    | Limite     |
| ---------- | ---------- |
| Página     | 300 linhas |
| Componente | 200 linhas |
| Hook       | 150 linhas |

Ao estourar, extraia na ordem: dialogs → itens de lista → hooks de dados →
constantes. Componente interno de uma página fica **no mesmo diretório** dela.

---

## 6. Padrões obrigatórios

**Toast** — `useAppToast()` (`@/shared/hooks/use-app-toast`), nunca `sonner`:

```tsx
const toast = useAppToast();
toast.success('Dashboard salvo');
toast.error('Falha ao salvar');
```

**Os 4 estados** — toda tela precisa cobrir:

```tsx
if (isLoading) return <Skeleton …/>;          // nunca tela em branco
if (error)     return <Banner …/>;            // mensagem acionável
if (!data.length) return <EmptyState …/>;     // com ação primária
// desabilitado: isDisabled + motivo via tooltip
```

**Navegação** — `href` nos componentes do DS (o `LinkProvider` do shell já
converte para client-side). Não use `<a>` cru nem `navigate()` para links.

**Ícones** — lucide continua sendo a fonte, embrulhado no `Icon` do DS:

```tsx
import { Database } from 'lucide-react';
<Icon icon={Database} />;
```

**Acessibilidade** — `label` em todo controle icon-only; foco visível (não
remova outline); `Heading level` sequencial; contraste vem dos tokens.

---

## 7. Testes

Use o helper (já monta Theme/Layer/Link/Query/Router):

```tsx
import { renderWithProviders } from '@/test/render';
renderWithProviders(<MinhaPagina />, { route: '/x' });
```

Consulte por **papel acessível** (`getByRole('button', {name: …})`), nunca por
classe CSS — os nomes são gerados pelo StyleX e mudam a cada build.

---

## 8. Definition of Done (por trilha)

- [ ] Nenhum import de `@/components/ui` nos arquivos da trilha
- [ ] Nenhum hex/px/cor hardcoded; só tokens
- [ ] Loading, vazio, erro e desabilitado cobertos
- [ ] Sem `any`; props tipadas
- [ ] Arquivos dentro do limite de linhas
- [ ] Sem código morto, componente órfão ou TODO
- [ ] `npx tsc -b --noEmit` limpo
- [ ] `npm test` verde
- [ ] `npx eslint <seus arquivos>` sem erro/warning novo

---

## 9. Comandos

```bash
npx astryx component <Nome> --dense   # API de um componente
npx astryx search "<ideia>"           # descobrir o componente certo
npx astryx template --list            # padrões de página prontos
npx tsc -b --noEmit                   # typecheck
npm test                              # suíte
node scripts/legacy-usage-map.mjs     # quem ainda usa o legado
```
