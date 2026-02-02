'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, Search, Plus, Command, LogOut, Settings, User } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useAuth } from '@/components/providers/auth-provider'
import { signOut, roleLabels, roleColors } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  onNewTask?: () => void
}

export function Header({ title, subtitle, onNewTask }: HeaderProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-background/80 px-6 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="group flex h-9 w-64 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition-all hover:border-white/20 hover:bg-white/10">
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Hledat...</span>
          <kbd className="hidden items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium md:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* New Task Button */}
        <Button
          size="sm"
          onClick={onNewTask}
          className="gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nový úkol</span>
        </Button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition-all hover:border-white/20 hover:bg-white/10 hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>

        {/* Messages */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition-all hover:border-white/20 hover:bg-white/10 hover:text-foreground">
          <MessageSquare className="h-4 w-4" />
        </button>

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            {initials}
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-xl overflow-hidden">
                {/* User Info */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user?.full_name || 'Uživatel'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  {user?.role && (
                    <Badge className={cn('mt-2 text-xs border', roleColors[user.role])}>
                      {roleLabels[user.role]}
                    </Badge>
                  )}
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/settings') }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Nastavení
                  </button>
                  {user?.role === 'superadmin' && (
                    <button
                      onClick={() => { setShowUserMenu(false); router.push('/users') }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Správa uživatelů
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Odhlásit se
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
