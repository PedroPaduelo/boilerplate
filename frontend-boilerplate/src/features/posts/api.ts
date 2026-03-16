import type { Post, PostsStats, PostFormData } from './types'

const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'Como Construir Agentes de IA com LangChain',
    content: 'Neste artigo, vamos explorar como construir agentes de IA robustos utilizando o framework LangChain. Desde a configuracao inicial ate a integracao com APIs externas, cobriremos todos os passos necessarios para criar um agente funcional.',
    excerpt: 'Aprenda a construir agentes de IA robustos com LangChain, do basico ao avancado.',
    author: 'Carlos Silva',
    category: 'Tecnologia',
    status: 'published',
    publishedAt: '2026-03-10T14:30:00Z',
    createdAt: '2026-03-08T10:00:00Z',
    updatedAt: '2026-03-10T14:30:00Z',
  },
  {
    id: 'post-2',
    title: 'Estrategias de Monetizacao para Marketplaces',
    content: 'Exploraremos as principais estrategias de monetizacao utilizadas por marketplaces de sucesso. Desde comissoes sobre transacoes ate modelos de assinatura, cada abordagem tem suas vantagens e desvantagens.',
    excerpt: 'Descubra as melhores estrategias de monetizacao para marketplaces digitais.',
    author: 'Ana Rodrigues',
    category: 'Negocios',
    status: 'published',
    publishedAt: '2026-03-09T09:15:00Z',
    createdAt: '2026-03-07T16:00:00Z',
    updatedAt: '2026-03-09T09:15:00Z',
  },
  {
    id: 'post-3',
    title: 'Design System: Criando Componentes Reutilizaveis',
    content: 'Um guia completo sobre como criar e manter um design system eficiente. Abordaremos tokens de design, componentes atomicos e como garantir consistencia visual em toda a aplicacao.',
    excerpt: 'Guia completo para criar um design system escalavel e consistente.',
    author: 'Mariana Costa',
    category: 'Design',
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-03-12T11:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
  },
  {
    id: 'post-4',
    title: 'SEO para Startups: Guia Pratico 2026',
    content: 'Aprenda as tecnicas mais atuais de SEO especificamente voltadas para startups. Desde pesquisa de palavras-chave ate link building, este guia cobre tudo o que voce precisa saber.',
    excerpt: 'Tecnicas atualizadas de SEO para impulsionar a visibilidade da sua startup.',
    author: 'Pedro Mendes',
    category: 'Marketing',
    status: 'published',
    publishedAt: '2026-03-05T08:00:00Z',
    createdAt: '2026-03-03T14:30:00Z',
    updatedAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 'post-5',
    title: 'Introducao ao React Server Components',
    content: 'React Server Components representam uma nova era no desenvolvimento frontend. Neste artigo, exploraremos como eles funcionam, quando usa-los e como migrar aplicacoes existentes.',
    excerpt: 'Entenda o que sao React Server Components e como eles mudam o jogo.',
    author: 'Lucas Ferreira',
    category: 'Tecnologia',
    status: 'published',
    publishedAt: '2026-03-01T10:00:00Z',
    createdAt: '2026-02-28T09:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'post-6',
    title: 'Como Precificar Servicos de IA',
    content: 'A precificacao de servicos baseados em IA pode ser desafiadora. Analisaremos diferentes modelos de precificacao, desde pay-per-use ate planos mensais, e como escolher o melhor para seu negocio.',
    excerpt: 'Modelos de precificacao para servicos e produtos baseados em inteligencia artificial.',
    author: 'Fernanda Lima',
    category: 'Negocios',
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-03-14T15:00:00Z',
    updatedAt: '2026-03-14T15:00:00Z',
  },
  {
    id: 'post-7',
    title: 'Acessibilidade Web: Alem do Basico',
    content: 'Ir alem do basico em acessibilidade web significa pensar em usuarios com diferentes necessidades. Este artigo aborda tecnicas avancadas de ARIA, navegacao por teclado e testes automatizados.',
    excerpt: 'Tecnicas avancadas de acessibilidade para aplicacoes web modernas.',
    author: 'Mariana Costa',
    category: 'Design',
    status: 'published',
    publishedAt: '2026-02-25T12:00:00Z',
    createdAt: '2026-02-23T10:00:00Z',
    updatedAt: '2026-02-25T12:00:00Z',
  },
  {
    id: 'post-8',
    title: 'Growth Hacking com Automacao de Marketing',
    content: 'Descubra como utilizar ferramentas de automacao para escalar suas estrategias de growth hacking. Desde email marketing automatizado ate chatbots, as possibilidades sao infinitas.',
    excerpt: 'Escale seu crescimento com automacao inteligente de marketing.',
    author: 'Pedro Mendes',
    category: 'Marketing',
    status: 'published',
    publishedAt: '2026-02-20T09:30:00Z',
    createdAt: '2026-02-18T14:00:00Z',
    updatedAt: '2026-02-20T09:30:00Z',
  },
  {
    id: 'post-9',
    title: 'Boas Praticas de Seguranca em APIs REST',
    content: 'A seguranca de APIs e fundamental para qualquer aplicacao moderna. Abordaremos autenticacao, autorizacao, rate limiting, validacao de inputs e outras praticas essenciais.',
    excerpt: 'Proteja suas APIs com as melhores praticas de seguranca do mercado.',
    author: 'Carlos Silva',
    category: 'Tecnologia',
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z',
  },
  {
    id: 'post-10',
    title: 'O Futuro dos Marketplaces de Servicos',
    content: 'Uma analise aprofundada sobre as tendencias que estao moldando o futuro dos marketplaces de servicos. IA, blockchain e economia gig sao apenas alguns dos topicos abordados.',
    excerpt: 'Tendencias e previsoes para marketplaces de servicos nos proximos anos.',
    author: 'Ana Rodrigues',
    category: 'Geral',
    status: 'published',
    publishedAt: '2026-03-11T16:00:00Z',
    createdAt: '2026-03-09T11:00:00Z',
    updatedAt: '2026-03-11T16:00:00Z',
  },
  {
    id: 'post-11',
    title: 'Micro-Frontends na Pratica',
    content: 'Implementar micro-frontends pode parecer complexo, mas este guia pratico mostra como dividir sua aplicacao em modulos independentes usando Module Federation e outras tecnicas.',
    excerpt: 'Guia pratico para implementar micro-frontends em projetos reais.',
    author: 'Lucas Ferreira',
    category: 'Tecnologia',
    status: 'published',
    publishedAt: '2026-02-15T10:00:00Z',
    createdAt: '2026-02-13T09:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'post-12',
    title: 'UX Writing: A Arte de Escrever para Interfaces',
    content: 'UX Writing vai alem de simplesmente escrever textos para botoes. E sobre criar uma experiencia coesa e intuitiva atraves das palavras. Aprenda as tecnicas fundamentais.',
    excerpt: 'Como a escrita pode transformar a experiencia do usuario em interfaces digitais.',
    author: 'Mariana Costa',
    category: 'Design',
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-03-13T14:00:00Z',
    updatedAt: '2026-03-13T14:00:00Z',
  },
  {
    id: 'post-13',
    title: 'Metricas SaaS: KPIs que Importam',
    content: 'Entenda quais metricas realmente importam para o crescimento de um SaaS. MRR, Churn Rate, LTV, CAC e muitas outras metricas explicadas com exemplos praticos.',
    excerpt: 'As metricas essenciais que todo fundador de SaaS precisa acompanhar.',
    author: 'Fernanda Lima',
    category: 'Negocios',
    status: 'published',
    publishedAt: '2026-02-28T08:00:00Z',
    createdAt: '2026-02-26T10:00:00Z',
    updatedAt: '2026-02-28T08:00:00Z',
  },
  {
    id: 'post-14',
    title: 'Content Marketing com IA Generativa',
    content: 'A IA generativa esta revolucionando o content marketing. Descubra como usar ferramentas como GPT e Midjourney para criar conteudo de alta qualidade de forma escalavel.',
    excerpt: 'Revolucione sua estrategia de conteudo com inteligencia artificial generativa.',
    author: 'Pedro Mendes',
    category: 'Marketing',
    status: 'published',
    publishedAt: '2026-03-06T11:00:00Z',
    createdAt: '2026-03-04T09:00:00Z',
    updatedAt: '2026-03-06T11:00:00Z',
  },
  {
    id: 'post-15',
    title: 'TypeScript 5.9: Novidades e Melhorias',
    content: 'TypeScript 5.9 traz diversas novidades empolgantes. Neste artigo, exploramos as principais mudancas, incluindo melhorias no sistema de tipos, performance e novas features.',
    excerpt: 'Conheca as principais novidades do TypeScript 5.9 e como aproveiTa-las.',
    author: 'Carlos Silva',
    category: 'Tecnologia',
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-03-16T09:00:00Z',
    updatedAt: '2026-03-16T09:00:00Z',
  },
  {
    id: 'post-16',
    title: 'Tendencias de Design para 2026',
    content: 'O design digital esta em constante evolucao. Exploramos as principais tendencias para 2026, desde glassmorphism ate neubrutalism, e como aplica-las em seus projetos.',
    excerpt: 'As tendencias de design que vao dominar o cenario digital em 2026.',
    author: 'Mariana Costa',
    category: 'Design',
    status: 'published',
    publishedAt: '2026-01-15T10:00:00Z',
    createdAt: '2026-01-13T08:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'post-17',
    title: 'Guia Completo de Testes Automatizados',
    content: 'Testes automatizados sao essenciais para garantir a qualidade do software. Este guia cobre unit tests, integration tests, e2e tests e muito mais, com exemplos praticos.',
    excerpt: 'Do unit test ao e2e: guia completo sobre testes automatizados.',
    author: 'Lucas Ferreira',
    category: 'Tecnologia',
    status: 'published',
    publishedAt: '2026-02-10T14:00:00Z',
    createdAt: '2026-02-08T11:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'post-18',
    title: 'Como Montar um Time de Produto',
    content: 'Montar um time de produto eficiente requer mais do que apenas contratar bons profissionais. E preciso definir papeis claros, processos e cultura de produto.',
    excerpt: 'Estrategias para montar e gerir um time de produto de alta performance.',
    author: 'Ana Rodrigues',
    category: 'Geral',
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-03-14T10:00:00Z',
    updatedAt: '2026-03-14T10:00:00Z',
  },
]

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// In-memory store for CRUD operations
let postsStore = [...MOCK_POSTS]

export const postsApi = {
  getPosts: async (): Promise<Post[]> => {
    await delay(600)
    return [...postsStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  getStats: async (): Promise<PostsStats> => {
    await delay(400)
    const posts = postsStore
    const categories = new Set(posts.map((p) => p.category))
    return {
      totalPosts: posts.length,
      publishedPosts: posts.filter((p) => p.status === 'published').length,
      draftPosts: posts.filter((p) => p.status === 'draft').length,
      categoriesCount: categories.size,
    }
  },

  createPost: async (data: PostFormData): Promise<Post> => {
    await delay(500)
    const now = new Date().toISOString()
    const newPost: Post = {
      id: `post-${Date.now()}`,
      ...data,
      publishedAt: data.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
    }
    postsStore = [newPost, ...postsStore]
    return newPost
  },

  updatePost: async (id: string, data: PostFormData): Promise<Post> => {
    await delay(500)
    const now = new Date().toISOString()
    const index = postsStore.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Post nao encontrado')

    const existing = postsStore[index]
    const updated: Post = {
      ...existing,
      ...data,
      publishedAt:
        data.status === 'published'
          ? existing.publishedAt || now
          : null,
      updatedAt: now,
    }
    postsStore[index] = updated
    return updated
  },

  deletePost: async (id: string): Promise<void> => {
    await delay(400)
    postsStore = postsStore.filter((p) => p.id !== id)
  },

  toggleStatus: async (id: string): Promise<Post> => {
    await delay(300)
    const now = new Date().toISOString()
    const index = postsStore.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Post nao encontrado')

    const post = postsStore[index]
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const updated: Post = {
      ...post,
      status: newStatus,
      publishedAt: newStatus === 'published' ? now : null,
      updatedAt: now,
    }
    postsStore[index] = updated
    return updated
  },
}
