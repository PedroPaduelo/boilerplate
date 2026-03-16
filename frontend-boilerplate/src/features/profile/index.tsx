import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Edit,
  Camera,
  Save,
  Clock,
  Shield,
  FileText,
  LogIn,
  Key,
  Settings,
  UserCheck,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/shared/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { Textarea } from '@/shared/components/ui/textarea'

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const _profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  bio: z.string().max(300, 'Maximo de 300 caracteres').optional(),
})

type ProfileFormData = z.infer<typeof _profileSchema>

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USER = {
  name: 'Pedro Padilha',
  email: 'pedro@example.com',
  role: 'Admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro',
  bio: 'Desenvolvedor fullstack apaixonado por IA e automacao. Construindo o futuro dos agentes inteligentes.',
  location: 'Sao Paulo, Brasil',
  joinedAt: '2024-03-15T10:00:00Z',
  lastLoginAt: '2026-03-16T09:30:00Z',
  stats: {
    postsCount: 47,
    agentsCreated: 12,
    totalConversations: 1284,
  },
}

interface ActivityItem {
  id: string
  action: string
  description: string
  timestamp: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    action: 'Perfil atualizado',
    description: 'Alterou foto de perfil e biografia.',
    timestamp: '2026-03-16T09:15:00Z',
    icon: UserCheck,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: '2',
    action: 'Senha alterada',
    description: 'Atualizou a senha da conta com sucesso.',
    timestamp: '2026-03-15T14:30:00Z',
    icon: Key,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
  {
    id: '3',
    action: 'Login realizado',
    description: 'Login via Chrome em MacBook Pro - Sao Paulo, BR.',
    timestamp: '2026-03-16T09:30:00Z',
    icon: LogIn,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
  },
  {
    id: '4',
    action: 'Agente criado',
    description: 'Criou o agente "Assistente de Vendas v2".',
    timestamp: '2026-03-14T16:45:00Z',
    icon: Settings,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
  },
  {
    id: '5',
    action: '2FA ativado',
    description: 'Ativou autenticacao de dois fatores.',
    timestamp: '2026-03-13T11:20:00Z',
    icon: Shield,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: '6',
    action: 'Relatorio exportado',
    description: 'Exportou relatorio de metricas em CSV.',
    timestamp: '2026-03-12T10:00:00Z',
    icon: FileText,
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/10',
  },
]

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin}min atras`
  if (diffHours < 24) return `${diffHours}h atras`
  if (diffDays < 7) return `${diffDays}d atras`
  return date.toLocaleDateString('pt-BR')
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState(MOCK_USER)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name,
      email: user.email,
      bio: user.bio,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setUser((prev) => ({
      ...prev,
      name: data.name,
      email: data.email,
      bio: data.bio ?? prev.bio,
    }))
    setSaved(true)
    setIsEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const cancelEdit = () => {
    reset({ name: user.name, email: user.email, bio: user.bio })
    setIsEditing(false)
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ----------------------------------------------------------------
            Profile Header
        ---------------------------------------------------------------- */}
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden">
            {/* Banner */}
            <div className="relative h-32 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTAgMzR2LTJoMnYyem0wLTR2LTJoNHYyem0wLTR2LTJoNnYyem0wLTR2LTJoOHYyem0wLTR2LTJoMTB2MnptMC00di0yaDEydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            </div>

            <CardContent className="relative px-6 pb-6">
              {/* Avatar positioned on the banner edge */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 gap-4">
                <div className="flex items-end gap-4">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-1 right-1 rounded-full bg-primary p-2 text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-4 w-4" />
                    </motion.button>
                  </div>
                  <div className="pb-1">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                      <Badge className="text-xs">{user.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {user.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:pb-1">
                  <AnimatePresence>
                    {saved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 text-sm text-emerald-500"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Salvo
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4" />
                      Editar perfil
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {!isEditing && user.bio && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-muted-foreground max-w-2xl"
                >
                  {user.bio}
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ----------------------------------------------------------------
            Content Grid
        ---------------------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Edit form + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Profile Form */}
            <AnimatePresence mode="wait">
              {isEditing && (
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Edit className="h-5 w-5 text-primary" />
                        Editar Perfil
                      </CardTitle>
                      <CardDescription>
                        Atualize suas informacoes pessoais.
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="profile-name">Nome completo</Label>
                            <Input
                              id="profile-name"
                              placeholder="Seu nome"
                              {...register('name', {
                                required: 'Nome obrigatorio',
                                minLength: { value: 2, message: 'Minimo 2 caracteres' },
                              })}
                            />
                            {errors.name && (
                              <p className="text-xs text-destructive">{errors.name.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="profile-email">Email</Label>
                            <Input
                              id="profile-email"
                              type="email"
                              placeholder="seu@email.com"
                              {...register('email', {
                                required: 'Email obrigatorio',
                                pattern: {
                                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                  message: 'Email invalido',
                                },
                              })}
                            />
                            {errors.email && (
                              <p className="text-xs text-destructive">{errors.email.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-bio">Biografia</Label>
                          <Textarea
                            id="profile-bio"
                            placeholder="Conte um pouco sobre voce..."
                            rows={4}
                            {...register('bio', {
                              maxLength: { value: 300, message: 'Maximo de 300 caracteres' },
                            })}
                          />
                          {errors.bio && (
                            <p className="text-xs text-destructive">{errors.bio.message}</p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          <Save className="h-4 w-4" />
                          {isSubmitting ? 'Salvando...' : 'Salvar alteracoes'}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activity Log */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Atividade Recente
                  </CardTitle>
                  <CardDescription>
                    Historico de acoes realizadas na sua conta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-1">
                      {MOCK_ACTIVITIES.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08, duration: 0.3 }}
                          className="relative flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {/* Timeline dot */}
                          <div
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activity.iconBg}`}
                          >
                            <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">{activity.action}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {activity.description}
                                </p>
                              </div>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                {formatRelativeDate(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Stats & Info */}
          <div className="space-y-6">
            {/* Statistics */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estatisticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Posts publicados</span>
                    </div>
                    <span className="text-lg font-bold">{user.stats.postsCount}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-violet-500/10 p-2">
                        <Settings className="h-4 w-4 text-violet-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Agentes criados</span>
                    </div>
                    <span className="text-lg font-bold">{user.stats.agentsCreated}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-500/10 p-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Conversas totais</span>
                    </div>
                    <span className="text-lg font-bold">
                      {user.stats.totalConversations.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Info */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informacoes da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Funcao</p>
                      <p className="text-sm font-medium">{user.role}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Membro desde</p>
                      <p className="text-sm font-medium">{formatFullDate(user.joinedAt)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ultimo login</p>
                      <p className="text-sm font-medium">{formatRelativeDate(user.lastLoginAt)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Seguranca</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">2FA Ativo</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-500 border-0">
                          Protegido
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick actions */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acoes Rapidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <a href="/settings">
                      <Settings className="h-4 w-4" />
                      Configuracoes da conta
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Key className="h-4 w-4" />
                    Alterar senha
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Exportar dados
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
