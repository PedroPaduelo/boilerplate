export type PostStatus = 'published' | 'draft'

export type PostCategory = 'Tecnologia' | 'Negocios' | 'Design' | 'Marketing' | 'Geral'

export interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  category: PostCategory
  status: PostStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PostsStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  categoriesCount: number
}

export interface PostsFilters {
  search: string
  author: string
  category: PostCategory | 'all'
  status: PostStatus | 'all'
}

export interface PostFormData {
  title: string
  content: string
  excerpt: string
  author: string
  category: PostCategory
  status: PostStatus
}
