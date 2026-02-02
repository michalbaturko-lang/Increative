'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Brain,
  Settings,
  BarChart3,
  Sparkles,
  FolderKanban,
  Zap,
  ChevronRight,
  History,
  Activity,
  CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agenti', href: '/agents', icon: Brain },
  { name: 'Úkoly', href: '/tasks', icon: ListTodo },
  { name: 'ClickUp úkoly', href: '/clickup-tasks', icon: CheckSquare },
  { name: 'Diagnostika', href: '/diagnostics', icon: Activity },
  { name: 'Historie', href: '/historie', icon: History },
  { name: 'Klienti', href: '/clients', icon: Users },
  { name: 'Knowledge Base', href: '/knowledge', icon: FolderKanban },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

const bottomNavigation = [
  { name: 'Nastavení', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass border-r border-white/5">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-primary glow">
            <Sparkles className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md -z-10" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">FSA</span>
            <span className="ml-1.5 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              BETA
            </span>
          </div>
        </div>

        {/* Quick Action */}
        <div className="px-4 py-4">
          <button className="group flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-primary/20 to-violet-500/20 p-3 text-left transition-all hover:from-primary/30 hover:to-violet-500/30 border border-primary/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Nový úkol</p>
              <p className="text-xs text-muted-foreground">Zadej agentům práci</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Hlavní menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  !isActive && 'group-hover:scale-110'
                )} />
                {item.name}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="space-y-1 px-3 pb-2">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 p-4">
          <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-4 border border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                IC
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Increative</p>
                <p className="text-xs text-muted-foreground">Full Solution Agency</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
