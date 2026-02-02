'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Badge } from '@/components/ui'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  Brain,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'

interface StatCard {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  color: string
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = React.useState({
    tasksToday: 0,
    tasksThisWeek: 0,
    tasksThisMonth: 0,
    avgCompletionTime: 0,
    successRate: 0,
    activeClients: 0,
    knowledgeEntries: 0,
  })
  const [loading, setLoading] = React.useState(true)

  // Check permission
  React.useEffect(() => {
    if (user && user.role === 'project_manager') {
      router.push('/')
    }
  }, [user, router])

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        if (data.success) {
          setStats({
            tasksToday: data.stats.tasksToday,
            tasksThisWeek: data.stats.tasksThisWeek,
            tasksThisMonth: data.stats.tasksThisWeek * 4, // Approximation
            avgCompletionTime: data.stats.averageCompletionTime,
            successRate: 95, // Placeholder
            activeClients: data.stats.activeClients,
            knowledgeEntries: data.stats.knowledgeEntries,
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards: StatCard[] = [
    {
      title: 'Úkoly dnes',
      value: stats.tasksToday,
      change: 12,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Úkoly tento týden',
      value: stats.tasksThisWeek,
      change: 8,
      icon: <FileText className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Průměrný čas',
      value: `${stats.avgCompletionTime || '-'} min`,
      change: -5,
      icon: <Clock className="h-5 w-5" />,
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Aktivní klienti',
      value: stats.activeClients,
      change: 3,
      icon: <Users className="h-5 w-5" />,
      color: 'from-orange-500 to-red-500',
    },
  ]

  const agentPerformance = [
    { name: 'Content Writer', tasks: 45, avgTime: '18 min', successRate: 94 },
    { name: 'SEO Analyst', tasks: 32, avgTime: '25 min', successRate: 91 },
    { name: 'Ads Specialist', tasks: 28, avgTime: '30 min', successRate: 88 },
    { name: 'Social Media', tasks: 52, avgTime: '12 min', successRate: 96 },
    { name: 'Email Marketing', tasks: 19, avgTime: '22 min', successRate: 92 },
  ]

  if (user && user.role === 'project_manager') {
    return null
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="Analytics" subtitle="Přehled výkonu a statistik" />
        <main className="p-6 space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <div
                key={stat.title}
                className="fade-in rounded-2xl border border-white/10 bg-white/5 p-6"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                    {stat.icon}
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    stat.change > 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {stat.change > 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Agent Performance */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Výkon agentů</h2>
                <Badge className="bg-white/10">Tento měsíc</Badge>
              </div>

              <div className="space-y-4">
                {agentPerformance.map((agent) => (
                  <div key={agent.name} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-sm text-muted-foreground">{agent.tasks} úkolů</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all"
                          style={{ width: `${agent.successRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-emerald-400 w-12 text-right">
                      {agent.successRate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Distribution */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Rozdělení úkolů</h2>
                <Badge className="bg-white/10">Tento týden</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Content', value: 35, color: 'bg-blue-500' },
                  { label: 'SEO', value: 25, color: 'bg-green-500' },
                  { label: 'Ads', value: 20, color: 'bg-orange-500' },
                  { label: 'Social', value: 15, color: 'bg-pink-500' },
                  { label: 'Email', value: 5, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={cn('h-3 w-3 rounded-full', item.color)} />
                    <span className="flex-1 text-sm">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 h-4 rounded-full bg-white/10 overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: '35%' }} />
                <div className="h-full bg-green-500" style={{ width: '25%' }} />
                <div className="h-full bg-orange-500" style={{ width: '20%' }} />
                <div className="h-full bg-pink-500" style={{ width: '15%' }} />
                <div className="h-full bg-emerald-500" style={{ width: '5%' }} />
              </div>
            </div>
          </div>

          {/* Knowledge Base Stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Knowledge Base</h2>
              <Badge className="bg-primary/20 text-primary">{stats.knowledgeEntries} položek</Badge>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[
                { label: 'Šablony', value: 6, icon: <FileText className="h-4 w-4" /> },
                { label: 'Best Practices', value: 12, icon: <CheckCircle2 className="h-4 w-4" /> },
                { label: 'Prompty', value: 8, icon: <Brain className="h-4 w-4" /> },
                { label: 'Příklady', value: 15, icon: <FileText className="h-4 w-4" /> },
                { label: 'Naučené', value: 4, icon: <TrendingUp className="h-4 w-4" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="flex justify-center mb-2 text-muted-foreground">
                    {item.icon}
                  </div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
