'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  Search,
  Check,
  X,
  Calendar,
  User,
  Tag,
  FileTextIcon,
} from 'lucide-react'
import { postsApi } from './api'
import type { Post, PostsFilters, PostCategory, PostStatus } from './types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatDate } from '@/shared/lib/utils'

const CATEGORIES: Array<PostCategory | 'all'> = [
  'all',
  'Tecnologia',
  'Negocios',
  'Design',
  'Marketing',
  'Geral',
]

const STATUSES: Array<PostStatus | 'all'> = ['all', 'published', 'draft']

const postFormSchema = z.object({
  title: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  content: z.string().min(10, 'Conteudo deve ter pelo menos 10 caracteres'),
  excerpt: z.string().min(10, 'Resumo deve ter pelo menos 10 caracteres'),
  author: z.string().min(2, 'Autor deve ter pelo menos 2 caracteres'),
  category: z.enum(['Tecnologia', 'Negocios', 'Design', 'Marketing', 'Geral']),
  status: z.enum(['published', 'draft']),
})

type PostFormValues = z.infer<typeof postFormSchema>

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  delay: number
}

const StatCard = ({ title, value, icon: Icon, color, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: color }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const StatusBadge = ({ status }: { status: PostStatus }) => {
  const styles = {
    published: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    draft: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  }

  const labels = {
    published: 'Publicado',
    draft: 'Rascunho',
  }

  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  )
}

const CategoryBadge = ({ category }: { category: PostCategory }) => {
  const colors: Record<PostCategory, string> = {
    Tecnologia: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Negocios: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    Design: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    Marketing: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    Geral: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  }

  return (
    <Badge variant="outline" className={colors[category]}>
      {category}
    </Badge>
  )
}

export function PostsPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<PostsFilters>({
    search: '',
    author: '',
    category: 'all',
    status: 'all',
  })
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const pageSize = 10

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postsApi.getPosts(),
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['posts-stats'],
    queryFn: () => postsApi.getStats(),
  })

  const createMutation = useMutation({
    mutationFn: postsApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts-stats'] })
      setDialogOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PostFormValues }) =>
      postsApi.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts-stats'] })
      setDialogOpen(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: postsApi.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts-stats'] })
      setDeleteDialogOpen(false)
      setDeletingPostId(null)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: postsApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts-stats'] })
    },
  })

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      author: '',
      category: 'Geral',
      status: 'draft',
    },
  })

  const resetForm = () => {
    form.reset()
    setEditingPost(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (post: Post) => {
    setEditingPost(post)
    form.reset({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      category: post.category,
      status: post.status,
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (id: string) => {
    setDeletingPostId(id)
    setDeleteDialogOpen(true)
  }

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id)
  }

  const onSubmit = (data: PostFormValues) => {
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const filteredPosts = useMemo(() => {
    if (!posts) return []

    return posts.filter((post) => {
      const matchesSearch =
        filters.search === '' ||
        post.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        post.content.toLowerCase().includes(filters.search.toLowerCase())

      const matchesAuthor =
        filters.author === '' ||
        post.author.toLowerCase().includes(filters.author.toLowerCase())

      const matchesCategory = filters.category === 'all' || post.category === filters.category

      const matchesStatus = filters.status === 'all' || post.status === filters.status

      return matchesSearch && matchesAuthor && matchesCategory && matchesStatus
    })
  }, [posts, filters])

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredPosts.slice(start, start + pageSize)
  }, [filteredPosts, page])

  const totalPages = Math.ceil(filteredPosts.length / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Gerenciamento de Posts
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie, edite e gerencie todos os posts do blog
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Post
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <StatCard
              title="Total de Posts"
              value={stats.totalPosts}
              icon={FileTextIcon}
              color="#6366f1"
              delay={0}
            />
            <StatCard
              title="Publicados"
              value={stats.publishedPosts}
              icon={Check}
              color="#10b981"
              delay={0.1}
            />
            <StatCard
              title="Rascunhos"
              value={stats.draftPosts}
              icon={FileText}
              color="#f59e0b"
              delay={0.2}
            />
            <StatCard
              title="Categorias"
              value={stats.categoriesCount}
              icon={Tag}
              color="#8b5cf6"
              delay={0.3}
            />
          </>
        ) : null}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por titulo ou conteudo..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por autor..."
                    value={filters.author}
                    onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
                    className="pl-9 w-[180px]"
                  />
                </div>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, category: value as typeof filters.category }))
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'Todas' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value as typeof filters.status }))
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'all'
                          ? 'Todos'
                          : status === 'published'
                            ? 'Publicado'
                            : 'Rascunho'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filters.search !== '' ||
                  filters.author !== '' ||
                  filters.category !== 'all' ||
                  filters.status !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters({ search: '', author: '', category: 'all', status: 'all' })
                    }
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Posts Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lista de Posts
            </CardTitle>
            <CardDescription>
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} encontrado
              {filteredPosts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titulo</TableHead>
                        <TableHead>Autor</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Criacao</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPosts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum post encontrado com os filtros aplicados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium line-clamp-1">{post.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {post.excerpt}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm">{post.author}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <CategoryBadge category={post.category} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={post.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {formatDate(post.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(post)}
                                    className="gap-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(post.id)}
                                    disabled={toggleStatusMutation.isPending}
                                    className="gap-2"
                                  >
                                    {post.status === 'published' ? (
                                      <>
                                        <Eye className="h-4 w-4" />
                                        Mover para Rascunho
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4" />
                                        Publicar
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(post.id)}
                                    className="gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {paginatedPosts.length} de {filteredPosts.length} resultados
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm px-2">
                        {page} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Proximo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Editar Post' : 'Criar Novo Post'}</DialogTitle>
            <DialogDescription>
              {editingPost
                ? 'Edite as informacoes do post abaixo.'
                : 'Preencha as informacoes para criar um novo post.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Titulo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Como construir aplicacoes modernas"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">
                  Autor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="author"
                  placeholder="Nome do autor"
                  {...form.register('author')}
                />
                {form.formState.errors.author && (
                  <p className="text-sm text-destructive">{form.formState.errors.author.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value) => form.setValue('category', value as PostCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="Negocios">Negocios</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Geral">Geral</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">
                Resumo <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="excerpt"
                placeholder="Breve descricao do post..."
                rows={2}
                {...form.register('excerpt')}
              />
              {form.formState.errors.excerpt && (
                <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Conteudo <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Conteudo completo do post..."
                rows={6}
                {...form.register('content')}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as PostStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Salvando...'
                  : editingPost
                    ? 'Atualizar Post'
                    : 'Criar Post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este post? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPostId) {
                  deleteMutation.mutate(deletingPostId)
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
