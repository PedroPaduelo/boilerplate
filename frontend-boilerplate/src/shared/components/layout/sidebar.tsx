import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { Users, LogOut } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'

const menuItems = [
  { icon: Users, label: 'Usuarios', href: '/users' },
]

export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuthStore()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="text-xl font-bold text-primary">
          App
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link key={item.href} to={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
