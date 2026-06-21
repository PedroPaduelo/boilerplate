import type { VariantProps } from "class-variance-authority"
import type {
  ContextMenuItem,
  ContextMenuOpenContext,
  FileTreeCompositionOptions,
  FileTreeDragAndDropConfig,
  FileTreeIcons,
  FileTreeInitialExpansion,
  FileTreeRenamingConfig,
  FileTreeRowDecoration,
  FileTreeRowDecorationRenderer,
  FileTreeSearchBlurBehavior,
  FileTreeSearchMode,
  FileTreeSortComparator,
  FileTreeDensity as FileTreeDensityNative,
  GitStatusEntry,
} from "@pierre/trees"
import type * as React from "react"
import type { treeVariants } from "./tree-variants"

/** Densidade dos rows: `compact` (24px), `default` (30px), `relaxed` (36px). */
export type TreeDensity = "compact" | "default" | "relaxed"

/**
 * `gitStatus` aceita um array de entradas (`GitStatusEntry[]`). Para
 * desabilitar, basta omitir o campo. `undefined` usa o default da lib.
 */
export type TreeGitStatus = readonly GitStatusEntry[]

/**
 * Props do componente `Tree` — wrapper padronizado shadcn sobre
 * `@pierre/trees`. Aceita toda a API pública relevante da lib.
 */
export type TreeProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> &
  VariantProps<typeof treeVariants> & {
    /**
     * Lista de paths que formam a árvore.
     * Ex.: `["src/index.ts", "src/lib/utils.ts"]`
     */
    data: readonly string[]

    // ─── Apresentação ─────────────────────────────────────────────

    /**
     * Cabeçalho opcional renderizado acima da árvore (slot React). Para
     * injetar HTML ou um elemento imperativo, use `composition.header`
     * com `html` ou `render`.
     */
    header?: React.ReactNode

    // ─── Estado inicial ───────────────────────────────────────────

    /**
     * Nível de expansão inicial.
     * - `"closed"`: tudo fechado
     * - `"open"`: tudo aberto
     * - `number`: expande até N níveis de profundidade
     * @default "open"
     */
    initialExpansion?: FileTreeInitialExpansion

    /** Paths a expandir inicialmente (mesmo com `initialExpansion: "closed"`). */
    initialExpandedPaths?: readonly string[]

    /**
     * Paths inicialmente selecionados (a partir do `FileTreeController`).
     * Aceita tanto paths canônicos (`src/`) quanto paths "input" (`src`).
     */
    initialSelectedPaths?: readonly string[]

    // ─── Busca ────────────────────────────────────────────────────

    /** Habilita busca na árvore (campo de busca embutido). */
    search?: boolean

    /** Query inicial do campo de busca. */
    initialSearchQuery?: string | null

    /**
     * Modo de busca: `"expand-matches" | "collapse-non-matches" | "hide-non-matches"`.
     * Só tem efeito com `search: true`.
     */
    fileTreeSearchMode?: FileTreeSearchMode

    /**
     * Comportamento ao perder o foco do campo de busca.
     * - `"close"`: fecha a sessão
     * - `"retain"`: mantém o termo
     */
    searchBlurBehavior?: FileTreeSearchBlurBehavior

    // ─── Ordenação ────────────────────────────────────────────────

    /**
     * Estratégia de ordenação.
     * - `"default"`: ordem padrão (pastas antes, alfabético)
     * - `false`: sem ordenação (preserva ordem do `data`)
     * - função `FileTreeSortComparator`: comparador custom
     * @default "default"
     */
    sort?: "default" | false | FileTreeSortComparator

    // ─── Mutação / interação ─────────────────────────────────────

    /** Habilita drag & drop. Aceita boolean simples ou config avançada. */
    dragAndDrop?: boolean | FileTreeDragAndDropConfig

    /** Habilita renomeação in-place. Aceita boolean ou config avançada. */
    renaming?: boolean | FileTreeRenamingConfig

    // ─── Customização visual ──────────────────────────────────────

    /**
     * Set de ícones embutido (`"minimal" | "standard" | "complete"`) ou
     * config completa (ver `FileTreeIconConfig` da lib).
     * - `undefined` (default) → `"standard"` interno da lib
     * - `"complete"` set rico com mais ícones por extensão
     * - `{ set, colored, spriteSheet, remap, byFileName, byFileExtension, ... }` para customizar
     */
    icons?: FileTreeIcons

    /** Status do Git (bolinhas coloridas à esquerda dos itens). `false` desabilita. */
    gitStatus?: TreeGitStatus

    /**
     * Renderer opcional para decoração por row (badge/texto à direita).
     * Recebe `{ item, row }` e retorna uma decoração no formato da lib
     * (`{ text, title? }` ou `{ icon, title? }`) ou `null` para nada.
     */
    renderRowDecoration?: FileTreeRowDecorationRenderer

    // ─── Virtualização / layout ───────────────────────────────────

    /**
     * Altura de cada row em px. Sobrescreve o cálculo baseado em `density`.
     * Default = `FILE_TREE_DEFAULT_ITEM_HEIGHT` (30).
     */
    itemHeight?: number

    /**
     * Quantidade de rows extras a renderizar acima/abaixo do viewport
     * (virtualização). Default = 10.
     */
    overscan?: number

    /** Faz com que folders "stick" no topo ao rolar. */
    stickyFolders?: boolean

    // ─── Entrada de dados ─────────────────────────────────────────

    /**
     * Se `true`, "achata" cadeias de pastas single-child em um único item
     * (ex.: `src/utils/deep/index.ts` vira uma linha `src/utils/deep/index.ts`
     * em vez de 4 níveis aninhados).
     */
    flattenEmptyDirectories?: boolean

    // ─── Identidade / composição ──────────────────────────────────

    /** ID opcional do `FileTreeController` interno (útil para testes/SSR). */
    id?: string

    /**
     * Composição avançada: header HTML/imperativo e context menu.
     * Quando `composition.header` é definido, sobrescreve `header` React.
     */
    composition?: FileTreeCompositionOptions

    /**
     * Renderer React para o context menu (sobrescreve o `composition.contextMenu.render`).
     * Recebe `{ item, context }` da lib.
     */
    renderContextMenu?: (
      item: ContextMenuItem,
      context: ContextMenuOpenContext,
    ) => React.ReactNode

    // ─── Callbacks ────────────────────────────────────────────────

    /** Disparado quando a seleção muda. */
    onSelectionChange?: (paths: readonly string[]) => void

    /** Disparado quando a query de busca muda. */
    onSearchChange?: (value: string | null) => void

    /** Disparado quando um drop é concluído (drag & drop). */
    onDropComplete?: (event: { draggedPaths: readonly string[] }) => void

    /** Disparado quando uma renomeação é confirmada. */
    onRename?: (event: { sourcePath: string; destinationPath: string }) => void

    /** Disparado quando a lib reporta um erro (ex.: drop inválido, rename inválido). */
    onError?: (message: string) => void
  }

/**
 * Helper: dado uma `TreeDensity` shadcn, retorna o `FileTreeDensity` nativo
 * que deve ser passado para o `FileTreeModel`. Mantém CSS e modelo em
 * sincronia (valores 24/30/36 dos presets oficiais).
 */
export function toNativeDensity(
  density: TreeDensity | undefined,
): FileTreeDensityNative {
  return density ?? "default"
}

/** Re-exporta `FileTreeRowDecoration` para ergonomia do consumidor. */
export type { FileTreeRowDecoration }
