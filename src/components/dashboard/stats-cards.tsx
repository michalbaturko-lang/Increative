'use client'

import {
  CheckCircle2,
  Clock,
  Users,
  Lightbulb,
  TrendingUp,
  Brain,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Úkoly dnes',
      value: stats.tasksToday,
      change: '+3',
      changeType: 'positive' as const,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Tento týden',
      value: stats.tasksThisWeek,
      change: '+12%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Aktivní klienti',
      value: stats.activeClients,
      change: '+2',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      title: 'Příležitosti',
      value: stats.opportunitiesDetected,
      change: 'nové',
      changeType: 'neutral' as const,
      icon: Lightbulb,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      title: 'Knowledge Base',
      value: stats.knowledgeEntries,
      change: '+8',
      changeType: 'positive' as const,
      icon: Brain,
      gradient: 'from-pink-500 to-rose-600',
      iconBg: 'bg-pink-500/20',
      iconColor: 'text-pink-400',
    },
    {
      title: 'Průměrný čas',
      value: `${Math.round(stats.averageCompletionTime)}m`,
      change: '-2m',
      changeType: 'positive' as const,
      icon: Clock,
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card p-4 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/10 card-hover fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Gradient background on hover */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5',
            card.gradient
          )} />

          {/* Icon */}
          <div className={cn(
            'mb-3 inline-flex rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110',
            card.iconBg
          )}>
            <card.icon className={cn('h-5 w-5', card.iconColor)} />
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
            {card.change && (
              <span className={cn(
                'flex items-center text-xs font-medium',
                card.changeType === 'positive' && 'text-emerald-400',
                card.changeType === 'neutral' && 'text-amber-400'
              )}>
                {card.changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                {card.change}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="mt-1 text-sm text-muted-foreground">{card.title}</p>

          {/* Decorative gradient line */}
          <div className={cn(
            'absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r transition-all duration-300 group-hover:w-full',
            card.gradient
          )} />
        </div>
      ))}
    </div>
  )
}
