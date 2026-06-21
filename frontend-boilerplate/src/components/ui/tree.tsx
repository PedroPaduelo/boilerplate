import * as React from "react"
import { FileTree as FileTreeModel } from "@pierre/trees"
import { FileTree as FileTreeReact } from "@pierre/trees/react"
import { useTheme } from "@/components/theme/use-theme"
import { cn } from "@/shared/lib/utils"
import { treeVariants } from "@/components/ui/tree-variants"
import { toNativeDensity, type TreeProps } from "@/components/ui/tree-types"

export type { TreeDensity, TreeGitStatus, TreeProps } from "@/components/ui/tree-types"

/** Tipo do primeiro parâmetro do `new FileTreeModel(...)`. */
type FileTreeModelOptions = ConstructorParameters<typeof FileTreeModel>[0]

function Tree({
  data,
  header,
  initialExpansion = "open",
  initialExpandedPaths,
  initialSelectedPaths,
  search,
  initialSearchQuery,
  fileTreeSearchMode,
  searchBlurBehavior,
  sort = "default",
  dragAndDrop,
  renaming,
  icons,
  gitStatus,
  renderRowDecoration,
  itemHeight,
  overscan,
  stickyFolders,
  flattenEmptyDirectories,
  id,
  composition,
  renderContextMenu,
  onSelectionChange,
  onSearchChange,
  density,
  variant,
  className,
  ...hostProps
}: TreeProps) {
  const { resolvedTheme } = useTheme()

  // O modelo FileTree é criado uma vez, quando data ou config mudam.
  // A lib tem uma união discriminada `paths` XOR `preparedInput` em
  // `FileTreeOptions`, então construímos `paths` + outros campos opcionais.
  // O tipo `FileTreeModelOptions` é tipado pelo constructor.
  const model = React.useMemo(() => {
    const options: FileTreeModelOptions = {
      paths: data,
      ...(flattenEmptyDirectories !== undefined
        ? { flattenEmptyDirectories }
        : {}),
      initialExpansion,
      initialExpandedPaths: initialExpandedPaths as string[] | undefined,
      ...(initialSelectedPaths
        ? { initialSelectedPaths: initialSelectedPaths as string[] }
        : {}),
      // ─── Densidade: repassada para o modelo para que o itemHeight
      // interno (FILE_TREE_DENSITY_PRESETS: 24/30/36) bata com o
      // `--trees-item-height` injetado pelo cva.
      density: toNativeDensity(density ?? "default"),
      ...(itemHeight !== undefined ? { itemHeight } : {}),
      ...(overscan !== undefined ? { overscan } : {}),
      ...(stickyFolders !== undefined ? { stickyFolders } : {}),
      // ─── Busca ───────────────────────────────────────────────
      search: search === true,
      ...(initialSearchQuery !== undefined ? { initialSearchQuery } : {}),
      ...(fileTreeSearchMode ? { fileTreeSearchMode } : {}),
      ...(searchBlurBehavior ? { searchBlurBehavior } : {}),
      // ─── Ordenação ──────────────────────────────────────────
      ...(sort === "default" || sort === undefined
        ? { sort: "default" as const }
        : sort === false
          ? {}
          : { sort }),
      // ─── Mutação / interação ─────────────────────────────────
      ...(dragAndDrop !== undefined ? { dragAndDrop } : {}),
      ...(renaming !== undefined ? { renaming } : {}),
      // ─── Customização visual ─────────────────────────────────
      ...(icons !== undefined ? { icons } : {}),
      ...(gitStatus ? { gitStatus } : {}),
      ...(renderRowDecoration ? { renderRowDecoration } : {}),
      // ─── Identidade / composição ─────────────────────────────
      ...(id ? { id } : {}),
      ...(composition ? { composition } : {}),
      // ─── Callbacks ──────────────────────────────────────────
      ...(onSelectionChange ? { onSelectionChange } : {}),
      ...(onSearchChange ? { onSearchChange } : {}),
    }

    return new FileTreeModel(options)
  }, [
    data,
    flattenEmptyDirectories,
    initialExpansion,
    initialExpandedPaths,
    initialSelectedPaths,
    density,
    itemHeight,
    overscan,
    stickyFolders,
    search,
    initialSearchQuery,
    fileTreeSearchMode,
    searchBlurBehavior,
    sort,
    dragAndDrop,
    renaming,
    icons,
    gitStatus,
    renderRowDecoration,
    id,
    composition,
    onSelectionChange,
    onSearchChange,
  ])

  // Limpeza ao desmontar
  React.useEffect(() => {
    return () => {
      model.cleanUp()
    }
  }, [model])

  // Sincroniza a seleção externa
  React.useEffect(() => {
    if (!onSelectionChange) return
    const unsub = model.subscribe(() => {
      onSelectionChange(model.getSelectedPaths())
    })
    return unsub
  }, [model, onSelectionChange])

  return (
    <div
      data-slot="tree"
      data-density={density ?? "default"}
      data-theme={resolvedTheme}
      style={{ colorScheme: resolvedTheme }}
      className={cn(treeVariants({ density, variant, className }))}
      {...hostProps}
    >
      <FileTreeReact
        model={model}
        {...(header !== undefined ? { header } : {})}
        {...(renderContextMenu ? { renderContextMenu } : {})}
      />
    </div>
  )
}

export { Tree }
