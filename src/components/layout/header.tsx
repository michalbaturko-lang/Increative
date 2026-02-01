'use client'

import { Bell, MessageSquare, Search, Plus, Command } from 'lucide-react'
import { Button } from '@/components/ui'

interface HeaderProps {
  title: string
  subtitle?: string
  onNewTask?: () => void
}

export function Header({ title, subtitle, onNewTask }: HeaderProps) {
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
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/50">
            3
          </span>
        </button>

        {/* Messages */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition-all hover:border-white/20 hover:bg-white/10 hover:text-foreground">
          <MessageSquare className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-primary to-violet-500 text-[10px] font-bold text-white shadow-lg shadow-primary/50">
            2
          </span>
        </button>

        {/* User Avatar */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white transition-transform hover:scale-105">
          JK
        </button>
      </div>
    </header>
  )
}
