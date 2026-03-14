# Relatrio Completo: Componentes UI e Shared - Frontend Boilerplate

**Data:** 14/03/2026
**Reviso:** 12 - Componentes Compartilhados e UI

---

## Sumrio Executivo

Este relatrio documenta a arquitetura de componentes compartilhados (shared) do frontend boilerplate, incluindo componentes UI baseados no shadcn/ui, hooks customizados, utilities, design tokens e layout. O projeto adota uma arquitetura modular com foco em reutilizao, tipagem TypeScript e design system consistente.

---

## 1. shared/components/ui/ (shadcn components)

A pasta `shared/components/ui/` contm componentes baseados no shadcn/ui, uma coleo de componentes acessveis e customizveis baseados em Radix UI e Tailwind CSS.

### 1.1 Components Disponveis

| Componente | Props Principais | Recursos | Dependncias |
|------------|------------------|----------|-------------|
| Button | variant, size, asChild | 6 variants (default, destructive, outline, secondary, ghost, link), 4 tamanhos | radix-ui/react-slot, class-variance-authority |
| Card | className | Composite: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | - |
| Input | type, className | Suporte a todos os tipos de input HTML | - |
| Avatar | className | Comps: Avatar, AvatarImage, AvatarFallback | radix-ui/react-avatar |
| Label | className | Associado a inputs via htmlFor | radix-ui/react-label, cva |
| Skeleton | className | Estado de carregamento com animao pulse | - |
| Switch | checked, onCheckedChange | Toggle binrio com animao | radix-ui/react-switch |
| Select | value, onValueChange | Dropdown com busca, scroll | radix-ui/react-select |
| DropdownMenu | items, trigger | Menu contextual completo | radix-ui/react-dropdown-menu |
| Sonner | Aqui | Sistema de notificaes | sonner |

### 1.2 Padro de Implementao

Todos os componentes seguem um padro consistente:

```typescript
// 1. Importaes
import * as React from 'react'
import * as [Primitive] from '@radix-ui/react-[component]'
import { cn } from '@/shared/lib/utils'

// 2. ForwardRef com tipagem correta
export const Component = React.forwardRef<
  React.ElementRef<typeof Primitive.Root>,
  React.ComponentPropsWithoutRef<typeof Primitive.Root>
>(({ className, ...props }, ref) => (
  <Primitive.Root
    ref={ref}
    className={cn('classes base', className)}
    {...props}
  />
))
Component.displayName = Primitive.Root.displayName

// 3. Exportao
export { Component }
```

### 1.3 Componentes Detalhados

#### Button

O componente Button oferece mltiplas variaes:

- **Variants:**
  - `default`: estilo primrio azul
  - `destructive`: vermelho para aes destrutivas
  - `outline`: borda com fundo transparente
  - `secondary`: estilo secundrio (cinza claro)
  - `ghost`: sem fundo, s hover
  - `link`: estilo de link com underline

- **Sizes:** default (h-10), sm (h-8), lg (h-12), icon (h-10 w-10 quadrado)

- **Recurso asChild:** permite renderizar como outro elemento usando Radix Slot

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

#### Card

Componente composto para layout de contedo:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Ttulo</CardTitle>
    <CardDescription>Descrio</CardDescription>
  </CardHeader>
  <CardContent>Contedo</CardContent>
  <CardFooter>Rodap</CardFooter>
</Card>
```

Classes: `rounded-lg border bg-card text-card-foreground shadow-sm`

#### Avatar

Suporte a imagem com fallback:

```typescript
<Avatar>
  <AvatarImage src="url" alt="nome" />
  <AvatarFallback>IN</AvatarFallback>
</Avatar>
```

Fallback padro 40x40 com bg-muted.

#### Switch

Toggle com estados checked/unchecked:

```typescript
<Switch checked={value} onCheckedChange={setValue} />
```

Animao de thumb com `translate-x-5` quando ativo.

#### Select

Dropdown com opes selecionveis:

- Scroll buttons (up/down)
- Portal para renderizao fora do fluxo
- Suporte a grupos e separadores
- Checkmark no item selecionado

#### DropdownMenu

Componente de menu contextual completo:

**Subcomponents:**
- Root, Trigger, Content, Item, CheckboxItem, RadioItem
- Label, Separator, Shortcut
- Sub, SubTrigger, SubContent
- Group, Portal, RadioGroup

Animaes via `tailwindcss-animate`:
- `data-[state=open]:animate-in`
- `data-[state=closed]:animate-out`
- Slide directions baseados em `data-[side]`

#### Sonner

Wrapper do pacote `sonner` para notificaes:

- Tema fixo como `light` (design choice do projeto)
- Custom classes via `toastOptions.classNames`

---

## 2. shared/components/layout/ (header, sidebar)

Componentes de layout da aplicao.

### 2.1 Header

**Arquivo:** `header.tsx`

```typescript
export function Header() {
  const { user } = useAuthStore()

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.name}</span>
        <Avatar>
          <AvatarFallback>{initials || 'U'}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
```

**Caractersticas:**
- Altura fixa: `h-16`
- Borda inferior: `border-b`
- Fundo card: `bg-card`
- Padding: `px-6`
- Layout flex com justify-between
- direito so username + avatar com iniciais

### 2.2 Sidebar

**Arquivo:** `sidebar.tsx`

**Recursos:**
- Largura fixa: `w-64`
- Altura full: `h-full`
- Borda direita: `border-r`
- Fundo card: `bg-card`
- Logo com link para home
- Navegao animada com Framer Motion (`whileHover={{ x: 4 }}`)
- Active state: bg-primary com texto primary-foreground
- Inactive: text-muted-foreground hover:bg-muted
- Item de logout com handler `logout()`
- Uso de `useLocation` para active highlighting
- Menu configurvel via array `menuItems`

```typescript
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Settings, label: 'Configuracoes', href: '/settings' },
]
```

### 2.3 Exportaes

`index.ts` exporta ambos:

```typescript
export { Sidebar } from './sidebar'
export { Header } from './header'
```

---

## 3. shared/hooks/ (useDebounce, useLocalStorage)

Hooks customizados reutilizveis.

### 3.1 useDebounce

**Arquivo:** `use-debounce.ts`

```typescript
export function useDebounce<T>(value: T, delay: number = 300): T
```

**Props:**
- `value`: valor a ser debounced
- `delay` (opcional, default 300ms): tempo de debounce

**Comportamento:**
- Usa `setTimeout` + `clearTimeout` no useEffect
- Retorna `debouncedValue` que s atualiza aps `delay` da ltima mudana
- Cleanup automtico no cleanup do useEffect
- Genrico com tipo `T`

**Use cases:** inputs de busca, autocomplete, filtros.

### 3.2 useLocalStorage

**Arquivo:** `use-local-storage.ts`

```typescript
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]
```

**Props:**
- `key`: chave do localStorage
- `initialValue`: valor inicial se no houver valor salvo

**Retorno:**
- Tuple `[storedValue, setStoredValue]` (const assertion)

**Comportamento:**
- Lazy initialization no useState:
  ```typescript
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })
  ```
- Sincroniza bidirecional via useEffect
- Error handling para JSON parse/setItem
- Suporte a valores complexos via JSON

---

## 4. shared/lib/ (api-client, utils)

Utilities e lgica compartilhada.

### 4.1 Utils (`utils.ts`)

**Funcoes:**

```typescript
// Merge de classes CSS com clsx + tailwind-merge
export function cn(...inputs: ClassValue[]): string

// Date formatting - Brazilian Portuguese
export function formatDate(date: string | Date): string
// Formato: DD/MM/YYYY

export function formatDateTime(date: string | Date): string
// Formato: DD/MM/YYYY HH:MM
```

**Implementao:**
- `cn` usa `clsx` + `twMerge` para evitar conflitos de classes Tailwind
- Datas usam `Intl.DateTimeFormat('pt-BR')`

### 4.2 Constants (`constants.ts`)

```typescript
export const APP_NAME = 'App'

export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'],
  },
} as const
```

Padro de chaves para TanStack Query (ou similar). Extensvel por mdulo.

### 4.3 API Client (`api-client.ts`)

**Configurao:**

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})
```

**Interceptors:**

1. **Request** - Adiciona token JWT automaticamente:
   ```typescript
   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem('token')
     if (token) config.headers.Authorization = `Bearer ${token}`
     return config
   })
   ```

2. **Response Error** - Trata 401 (unauthorized):
   ```typescript
   if (error.response?.status === 401) {
     localStorage.removeItem('token')
     window.location.href = '/login'
   }
   ```

**Observaes:**
- Token armazenado em localStorage (considerar HttpOnly cookie para segurana)
- Redirect hardcoded para `/login`

### 4.4 Types (`types/common.ts`)

```typescript
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}
```

Padro para responses paginados e erros de API.

---

## 5. Editor Rich Text (`shared/components/editor/`)

Componente de editor de texto rico:

**Dependncias:** @tiptap/react, @tiptap/starter-kit, @tiptap/extension-placeholder, @tiptap/extension-link, @tiptap/extension-image

**Funcionalidades:**
- Bold, Italic, Bullet List, Ordered List
- Links e imagens
- Placeholder customizvel
- Modo editvel/read-only
- Controle via props `content` e `onChange`

**Toolbar:** inline com buttons simples

---

## 6. Design Tokens

### 6.1 Tailwind Config (`tailwind.config.js`)

**Dark Mode:** `darkMode: ['class']` - controlled via CSS class

**Design Tokens (CSS Variables):**

| Token | Light | Dark |
|-------|-------|------|
| --background | hsl(0 0% 100%) | hsl(222.2 84% 4.9%) |
| --foreground | hsl(222.2 84% 4.9%) | hsl(210 40% 98%) |
| --primary | hsl(221.2 83.2% 53.3%) | hsl(217.2 91.2% 59.8%) |
| --primary-foreground | hsl(210 40% 98%) | hsl(222.2 47.4% 11.2%) |
| --secondary | hsl(210 40% 96.1%) | hsl(217.2 32.6% 17.5%) |
| --muted | hsl(210 40% 96.1%) | hsl(217.2 32.6% 17.5%) |
| --accent | hsl(210 40% 96.1%) | hsl(217.2 32.6% 17.5%) |
| --destructive | hsl(0 84.2% 60.2%) | hsl(0 62.8% 30.6%) |
| --success | hsl(142.1 76.2% 36.3%) | hsl(142.1 70.6% 45.3%) |
| --warning | hsl(45.4 93.4% 47.5%) | hsl(48 96.5% 53.1%) |
| --border | hsl(214.3 31.8% 91.4%) | hsl(217.2 32.6% 17.5%) |
| --input | hsl(214.3 31.8% 91.4%) | hsl(217.2 32.6% 17.5%) |
| --ring | hsl(221.2 83.2% 53.3%) | hsl(224.3 76.3% 48%) |
| --card | hsl(0 0% 100%) | hsl(222.2 84% 4.9%) |
| --radius | 0.5rem | 0.5rem |

**Border Radius:**
- `lg`: `var(--radius)`
- `md`: `calc(var(--radius) - 2px)`
- `sm`: `calc(var(--radius) - 4px)`

### 6.2 CSS Global (`src/app/index.css`)

```css
:root {
  /* tokens light */
}

.dark {
  /* tokens dark */
}

* { @apply border-border; }
body {
  @apply bg-background text-foreground font-sans antialiased;
}

html, body, #root { height: 100%; }
body { font-family: 'Inter', system-ui, sans-serif; }
```

**Camadas:**
- `@layer base`: :root, .dark, *, body
- `@layer components`: components
- `@layer utilities`: utilitrios

### 6.3 Custom Colors

Alm dos padrões shadcn, o projeto inclui:
- `success`: verde (paraFeedback positivo)
- `warning`: ambar/alaranjado (para alertas)

Ambos com foregrounds apropriados.

### 6.4 Keyframes Custom

```javascript
'accordion-down', 'accordion-up', 'fade-in', 'slide-up'
```

### 6.5 Dark Mode Implementation

Ativado via classe CSS `.dark` no elemento root.

```typescript
// Exemplo de toggle:
document.documentElement.classList.toggle('dark')
```

Os componentes shadcn usam tokens CSS que mudam automaticamente com base na presena da classe `dark`.

---

## 7. Responsividade

### 7.1 Layout Components

**Sidebar:**
- Largura fixa `w-64` (256px)
- No responsivo (não colapsa em mobile)
- Recomendao: adicionar SidebarMobile ou Sheet para mobile

**Header:**
- Flex com espaamento px-6
- Altura fixa h-16
- No contm toggle de tema

### 7.2 Container config

```javascript
container: {
  center: true,
  padding: '2rem',
  screens: { '2xl': '1400px' }
}
```

Breakpoints padrão Tailwind + `2xl` custom.

### 7.3 Recomendações

1. **Mobile Sidebar:** Implementar Sheet ou Drawer responsivo
2. **Spacing:** Verificar se paddings usam `md`, `lg` para responsividade
3. **Typography:** Prose no editor pode precisar ajustes em mobile

---

## 8. Dependncias Principais

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "tailwindcss": "^3.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "tailwindcss-animate": "^1.x",
    "radix-ui/*": "^1.x",
    "lucide-react": "^0.4xx",
    "sonner": "^1.x",
    "axios": "^1.x",
    "@tanstack/react-query": "^5.x",
    "framer-motion": "^10.x or ^11.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x"
  }
}
```

---

## 9. Pontos de Ateno / Melhorias

### 9.1 Segurana
- [ ] Token localStorage - migrar para HttpOnly cookie quando possvel
- [ ] CSRF protection no apiClient
- [ ] Refresh token automtico no interceptor 401

### 9.2 Responsividade
- [ ] Implementar Sheet/SidebarMobile
- [ ] Testar breakpoints xs, sm, md
- [ ] Verificar overflow em telas pequenas

### 9.3 Acessibilidade
- [ ] Adicionar `aria-label` em controles sem texto
- [ ] Testar navegao por teclado
- [ ] Contraste WCAG AA em todos os componentes

### 9.4 Performance
- [ ] Lazy load de componentes pesados (Dropdown, Select)
- [ ] Code splitting por rota
- [ ] Suspense boundaries

### 9.5 Consistncia
- [ ] Sonner tema hardcoded `light` - considerar tema dinmico
- [ ] Verificar se todos os componentes suportam `className` em todas as subpartes
- [ ] Padronizar `data-[state]` usage

### 9.6 Manuteno
- [ ] Componente Accordion ausente do shadcn (estado parcial)
- [ ] Dialog/Sheet/Drawer ausentes (necessrios para modais)
- [ ] Form components: Textarea, Checkbox, Radio

---

## 10. Arquivos Referenciados

### Estrutura completa

```
frontend-boilerplate/src/shared/
 components/
   ui/
     button.tsx
     card.tsx (e subcomponents)
     input.tsx
     avatar.tsx (e subcomponents)
     label.tsx
     skeleton.tsx
     select.tsx (e subcomponents)
     switch.tsx
     dropdown-menu.tsx (completo)
     sonner.tsx
   layout/
     header.tsx
     sidebar.tsx
     index.ts
   editor/
     rich-text-editor.tsx
 hooks/
   use-debounce.ts
   use-local-storage.ts
 lib/
   utils.ts
   constants.ts
   api-client.ts
 types/
   common.ts
```

---

## 11. Concluso

O sistema de componentes compartilhados est bem estruturado, seguindo as melhores prticas do ecossistema React moderno:

**Pontos Fortes:**
- Padronizao com shadcn/ui
- Tipagem TypeScript completa
- Acessibilidade via Radix UI
- Customizao via design tokens CSS
- Dark mode nativo via CSS variables
- Hooks reutilizveis e genricos

**Recomendao Prioritria:** Implementar responsive sidebar (Sheet) e revisar componentes de formulrio faltantes para completar a suíte shadcn.

---

*Fim do relatrio*