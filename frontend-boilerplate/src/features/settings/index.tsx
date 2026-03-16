import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Monitor,
  Moon,
  Sun,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Separator } from '@/shared/components/ui/separator'
import { Slider } from '@/shared/components/ui/slider'
import { Badge } from '@/shared/components/ui/badge'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const generalSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  language: z.string().min(1, 'Selecione um idioma'),
  timezone: z.string().min(1, 'Selecione um fuso horario'),
})

const securitySchema = z
  .object({
    currentPassword: z.string().min(6, 'Minimo de 6 caracteres'),
    newPassword: z.string().min(8, 'Minimo de 8 caracteres'),
    confirmPassword: z.string().min(8, 'Minimo de 8 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas nao coincidem',
    path: ['confirmPassword'],
  })

type GeneralFormData = z.infer<typeof generalSchema>
type SecurityFormData = z.infer<typeof securitySchema>

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { value: 'pt-BR', label: 'Portugues (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Espanol' },
  { value: 'fr-FR', label: 'Francais' },
  { value: 'de-DE', label: 'Deutsch' },
]

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasilia (GMT-3)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Berlin', label: 'Berlin (GMT+1)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (GMT+11)' },
]

const ACCENT_COLORS = [
  { value: 'indigo', label: 'Indigo', color: '#6366f1' },
  { value: 'blue', label: 'Azul', color: '#3b82f6' },
  { value: 'emerald', label: 'Esmeralda', color: '#10b981' },
  { value: 'rose', label: 'Rosa', color: '#f43f5e' },
  { value: 'amber', label: 'Ambar', color: '#f59e0b' },
  { value: 'violet', label: 'Violeta', color: '#8b5cf6' },
  { value: 'cyan', label: 'Ciano', color: '#06b6d4' },
  { value: 'orange', label: 'Laranja', color: '#f97316' },
]

interface Session {
  id: string
  device: string
  browser: string
  location: string
  ip: string
  lastActive: string
  isCurrent: boolean
  icon: LucideIcon
}

const ACTIVE_SESSIONS: Session[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome 120',
    location: 'Sao Paulo, BR',
    ip: '189.40.xxx.xxx',
    lastActive: 'Agora',
    isCurrent: true,
    icon: Laptop,
  },
  {
    id: '2',
    device: 'iPhone 15',
    browser: 'Safari 17',
    location: 'Sao Paulo, BR',
    ip: '189.40.xxx.xxx',
    lastActive: '2 horas atras',
    isCurrent: false,
    icon: Smartphone,
  },
  {
    id: '3',
    device: 'Windows PC',
    browser: 'Firefox 121',
    location: 'Rio de Janeiro, BR',
    ip: '177.22.xxx.xxx',
    lastActive: '3 dias atras',
    isCurrent: false,
    icon: Monitor,
  },
]

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

// ---------------------------------------------------------------------------
// Tab: General
// ---------------------------------------------------------------------------

function GeneralTab() {
  const [language, setLanguage] = useState('pt-BR')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GeneralFormData>({
    defaultValues: {
      name: 'Pedro Padilha',
      email: 'pedro@example.com',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
    },
  })

  const onSubmit = async (_data: GeneralFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Informacoes Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informacoes basicas de perfil.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email', {
                      required: 'Email obrigatorio',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalido' },
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Idioma
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Fuso horario
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fuso" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2 text-sm text-emerald-500"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Alteracoes salvas com sucesso
                  </motion.div>
                )}
              </AnimatePresence>
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar alteracoes'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Security
// ---------------------------------------------------------------------------

function SecurityTab() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions, setSessions] = useState(ACTIVE_SESSIONS)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SecurityFormData>()

  const onSubmit = async (_data: SecurityFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSaved(true)
    reset()
    setTimeout(() => setSaved(false), 3000)
  }

  const revokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Change password */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Atualize sua senha para manter sua conta segura.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha atual"
                    {...register('currentPassword', {
                      required: 'Senha atual obrigatoria',
                      minLength: { value: 6, message: 'Minimo 6 caracteres' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Digite a nova senha"
                      {...register('newPassword', {
                        required: 'Nova senha obrigatoria',
                        minLength: { value: 8, message: 'Minimo 8 caracteres' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme a nova senha"
                    {...register('confirmPassword', {
                      required: 'Confirmacao obrigatoria',
                      minLength: { value: 8, message: 'Minimo 8 caracteres' },
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2 text-sm text-emerald-500"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Senha alterada com sucesso
                  </motion.div>
                )}
              </AnimatePresence>
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      {/* Two-factor auth */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Autenticacao de Dois Fatores
                </CardTitle>
                <CardDescription className="mt-1">
                  Adicione uma camada extra de seguranca a sua conta.
                </CardDescription>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {twoFactorEnabled ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-500">2FA esta ativado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sua conta esta protegida com autenticacao de dois fatores via aplicativo autenticador.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-500">2FA esta desativado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recomendamos ativar a autenticacao de dois fatores para proteger sua conta.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active sessions */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="h-5 w-5 text-primary" />
              Sessoes Ativas
            </CardTitle>
            <CardDescription>
              Gerencie os dispositivos conectados a sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <session.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.browser} - {session.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IP: {session.ip} - {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                      Revogar
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Notifications
// ---------------------------------------------------------------------------

interface NotificationSetting {
  id: string
  title: string
  description: string
  enabled: boolean
}

function NotificationsTab() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'email',
      title: 'Notificacoes por Email',
      description: 'Receba atualizacoes importantes sobre sua conta por email.',
      enabled: true,
    },
    {
      id: 'push',
      title: 'Notificacoes Push',
      description: 'Receba notificacoes em tempo real no seu navegador.',
      enabled: true,
    },
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Receba noticias sobre novos recursos e atualizacoes.',
      enabled: false,
    },
    {
      id: 'marketing',
      title: 'Emails de Marketing',
      description: 'Receba ofertas especiais e promocoes.',
      enabled: false,
    },
    {
      id: 'security',
      title: 'Alertas de Seguranca',
      description: 'Receba alertas sobre atividades suspeitas na sua conta.',
      enabled: true,
    },
    {
      id: 'updates',
      title: 'Atualizacoes do Sistema',
      description: 'Receba notificacoes sobre manutencao e atualizacoes.',
      enabled: true,
    },
  ])

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const handleSave = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Preferencias de Notificacao
            </CardTitle>
            <CardDescription>
              Escolha quais notificacoes deseja receber e como.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {settings.map((setting, index) => (
              <motion.div
                key={setting.id}
                variants={fadeInUp}
                custom={index}
              >
                <div className="flex items-center justify-between rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <p className="text-sm font-medium">{setting.title}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(setting.id)}
                  />
                </div>
                {index < settings.length - 1 && <Separator />}
              </motion.div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 text-sm text-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Preferencias salvas
                </motion.div>
              )}
            </AnimatePresence>
            <Button onClick={handleSave} className="ml-auto">
              <Save className="h-4 w-4" />
              Salvar preferencias
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Appearance
// ---------------------------------------------------------------------------

function AppearanceTab() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return 'system'
  })
  const [accentColor, setAccentColor] = useState('indigo')
  const [fontSize, setFontSize] = useState([16])
  const [saved, setSaved] = useState(false)

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    const root = document.documentElement

    if (newTheme === 'system') {
      localStorage.removeItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      localStorage.setItem('theme', newTheme)
      root.classList.toggle('dark', newTheme === 'dark')
    }
  }

  const handleSave = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const themeOptions = [
    { value: 'light' as const, label: 'Claro', icon: Sun, desc: 'Tema claro para uso diurno' },
    { value: 'dark' as const, label: 'Escuro', icon: Moon, desc: 'Tema escuro para uso noturno' },
    { value: 'system' as const, label: 'Sistema', icon: Monitor, desc: 'Segue a preferencia do SO' },
  ]

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Theme selector */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Tema
            </CardTitle>
            <CardDescription>
              Personalize a aparencia da interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyTheme(option.value)}
                  className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                    theme === option.value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                  }`}
                >
                  {theme === option.value && (
                    <motion.div
                      layoutId="theme-indicator"
                      className="absolute right-2 top-2"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </motion.div>
                  )}
                  <div className={`rounded-xl p-3 ${theme === option.value ? 'bg-primary/10' : 'bg-muted'}`}>
                    <option.icon className={`h-6 w-6 ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Accent color */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cor de destaque</CardTitle>
            <CardDescription>Escolha a cor principal da interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {ACCENT_COLORS.map((color) => (
                <motion.button
                  key={color.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAccentColor(color.value)}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`h-10 w-10 rounded-full border-2 transition-all ${
                      accentColor === color.value
                        ? 'border-foreground scale-110 shadow-lg'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                    style={{ backgroundColor: color.color }}
                  >
                    {accentColor === color.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{color.label}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Font size */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tamanho da Fonte</CardTitle>
            <CardDescription>Ajuste o tamanho base da fonte da interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground w-6">12</span>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                min={12}
                max={22}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-6">22</span>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-muted-foreground" style={{ fontSize: `${fontSize[0]}px` }}>
                Texto de exemplo com tamanho {fontSize[0]}px. Ajuste o slider para ver a diferenca.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 text-sm text-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aparencia atualizada
                </motion.div>
              )}
            </AnimatePresence>
            <Button onClick={handleSave} className="ml-auto">
              <Save className="h-4 w-4" />
              Salvar aparencia
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main: SettingsPage
// ---------------------------------------------------------------------------

export function SettingsPage() {
  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      <div className="space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Configuracoes</h1>
              <p className="text-muted-foreground">
                Gerencie suas preferencias e configuracoes de conta.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="general" className="gap-2">
                <User className="h-4 w-4 hidden sm:block" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4 hidden sm:block" />
                Seguranca
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4 hidden sm:block" />
                Notificacoes
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="h-4 w-4 hidden sm:block" />
                Aparencia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralTab />
            </TabsContent>

            <TabsContent value="security">
              <SecurityTab />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationsTab />
            </TabsContent>

            <TabsContent value="appearance">
              <AppearanceTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
