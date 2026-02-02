'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Badge } from '@/components/ui'
import { CreateTaskDialog } from '@/components/dashboard'
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Brain,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'

interface Stats {
  tasksToday: number
  tasksThisWeek: number
  averageCompletionTime: number
  activeClients: number
  knowledgeEntries: number
  tasksByType: Record<string, number>
  tasksByAgent: Record<string, number>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [stats, setStats] = React.useState<Stats>({
    tasksToday: 0,
    tasksThisWeek: 0,
    averageCompletionTime: 0,
    activeClients: 0,
    knowledgeEntries: 0,
    tasksByType: {},
    tasksByAgent: {},
  })
  const [loading, setLoading] = React.useState(true)

  // Check permission
  React.useEffect(() => {
    if (user && user.role === 'project_manager') {
      router.push('/')
    }
  }, [user, router])

  const fetchStats = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const statCards = [
    {
      title: 'Úkoly dnes',
      value: stats.tasksToday,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Úkoly tento týden',
      value: stats.tasksThisWeek,
      icon: <FileText className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Průměrný čas',
      value: stats.averageCompletionTime > 0 ? `${stats.averageCompletionTime} min` : '-',
      icon: <Clock className="h-5 w-5" />,
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Aktivní klienti',
      value: stats.activeClients,
      icon: <Users className="h-5 w-5" />,
      color: 'from-orange-500 to-red-500',
    },
  ]

  // Calculate agent performance from real data
  const agentLabels: Record<string, string> = {
    content_writer: 'Content Writer',
    seo_analyst: 'SEO Analyst',
    ads_specialist: 'Ads Specialist',
    social_media: 'Social Media',
    email_marketing: 'Email Marketing',
    analyst: 'Business Analyst',
  }

  const agentPerformance = Object.entries(stats.tasksByAgent || {}).map(([agent, count]) => ({
    name: agentLabels[agent] || agent,
    tasks: count,
    successRate: 95, // Would need more detailed tracking for real success rates
  }))

  // Calculate task distribution from real data
  const typeLabels: Record<string, string> = {
    content_creation: 'Content',
    seo_audit: 'SEO',
    ads_campaign: 'Ads',
    social_media: 'Social',
    email_marketing: 'Email',
    competitor_analysis: 'Analýza',
    strategy_creation: 'Strategie',
  }

  const typeColors: Record<string, string> = {
    content_creation: 'bg-blue-500',
    seo_audit: 'bg-green-500',
    ads_campaign: 'bg-orange-500',
    social_media: 'bg-pink-500',
    email_marketing: 'bg-emerald-500',
    competitor_analysis: 'bg-purple-500',
    strategy_creation: 'bg-yellow-500',
  }

  const totalTasks = Object.values(stats.tasksByType || {}).reduce((a, b) => a + b, 0)
  const taskDistribution = Object.entries(stats.tasksByType || {}).map(([type, count]) => ({
    label: typeLabels[type] || type,
    value: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
    count,
    color: typeColors[type] || 'bg-gray-500',
  }))

  // Knowledge base stats
  const knowledgeStats = [
    { label: 'Šablony', value: 0, icon: <FileText className="h-4 w-4" /> },
    { label: 'Best Practices', value: 0, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: 'Prompty', value: 0, icon: <Brain className="h-4 w-4" /> },
    { label: 'Příklady', value: 0, icon: <FileText className="h-4 w-4" /> },
    { label: 'Naučené', value: 0, icon: <TrendingUp className="h-4 w-4" /> },
  ]

  if (user && user.role === 'project_manager') {
    return null
  }

  return (
    <div className="relative min-h-screen bg-background">
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onSubmit={() => fetchStats()}
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header
          title="Analytics"
          subtitle="Přehled výkonu a statistik"
          onNewTask={() => setCreateTaskOpen(true)}
        />
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
                  {loading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
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
                <Badge className="bg-white/10">Celkem</Badge>
              </div>

              {agentPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Zatím žádné úkoly</p>
                </div>
              ) : (
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
              )}
            </div>

            {/* Task Distribution */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Rozdělení úkolů</h2>
                <Badge className="bg-white/10">{totalTasks} celkem</Badge>
              </div>

              {taskDistribution.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Zatím žádné úkoly</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {taskDistribution.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={cn('h-3 w-3 rounded-full', item.color)} />
                        <span className="flex-1 text-sm">{item.label}</span>
                        <span className="text-sm font-medium">{item.count}x</span>
                      </div>
                    ))}
                  </div>

                  {totalTasks > 0 && (
                    <div className="mt-6 h-4 rounded-full bg-white/10 overflow-hidden flex">
                      {taskDistribution.map((item) => (
                        <div
                          key={item.label}
                          className={cn('h-full', item.color)}
                          style={{ width: `${item.value}%` }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Knowledge Base Stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Knowledge Base</h2>
              <Badge className="bg-primary/20 text-primary">{stats.knowledgeEntries} položek</Badge>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {knowledgeStats.map((item) => (
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
