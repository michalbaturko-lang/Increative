'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Badge, Button } from '@/components/ui'
import {
  FileText,
  Search,
  Users,
  Megaphone,
  Lightbulb,
  Code,
  BarChart3,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  Copy,
  Filter,
  RefreshCw,
  Instagram,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  priority: string
  client_name: string | null
  agent_type: string | null
  output: string | null
  feedback: string | null
  needs_review: boolean
  created_at: string
  completed_at: string | null
}

const taskTypeIcons: Record<string, React.ReactNode> = {
  content_creation: <FileText className="h-4 w-4 text-blue-400" />,
  seo_audit: <Search className="h-4 w-4 text-green-400" />,
  competitor_analysis: <Users className="h-4 w-4 text-purple-400" />,
  ads_campaign: <Megaphone className="h-4 w-4 text-orange-400" />,
  social_media: <Instagram className="h-4 w-4 text-pink-400" />,
  email_marketing: <Mail className="h-4 w-4 text-emerald-400" />,
  strategy_creation: <Lightbulb className="h-4 w-4 text-yellow-400" />,
  mvp_creation: <Code className="h-4 w-4 text-cyan-400" />,
  client_analysis: <BarChart3 className="h-4 w-4 text-rose-400" />,
  report_generation: <Globe className="h-4 w-4 text-indigo-400" />,
}

const taskTypeLabels: Record<string, string> = {
  content_creation: 'Tvorba obsahu',
  seo_audit: 'SEO audit',
  competitor_analysis: 'Analýza konkurence',
  ads_campaign: 'Reklamní kampaň',
  social_media: 'Social Media',
  email_marketing: 'Email Marketing',
  strategy_creation: 'Marketingová strategie',
  mvp_creation: 'MVP / Prototyp',
  client_analysis: 'Analýza klienta',
  report_generation: 'Generování reportu',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: {
    label: 'Dokončeno',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  needs_review: {
    label: 'Ke kontrole',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  needs_input: {
    label: 'Čeká na input',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Clock className="h-3 w-3" />,
  },
}

const priorityColors: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
}

export default function HistoriePage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<string>('all')

  const fetchTasks = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.set('status', filter)
      }
      const response = await fetch(`/api/tasks?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  React.useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const copyOutput = (output: string) => {
    navigator.clipboard.writeText(output)
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="Historie" subtitle="Přehled všech dokončených úkolů" />
        <main className="p-6 space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Vše' },
                  { value: 'completed', label: 'Dokončeno' },
                  { value: 'needs_review', label: 'Ke kontrole' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filter === f.value
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTasks}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Obnovit
            </Button>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {loading && tasks.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Načítám úkoly...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Zatím žádné úkoly</h3>
                <p className="text-muted-foreground">
                  Vytvořte první úkol pomocí tlačítka &quot;Nový úkol&quot; v horní části.
                </p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="fade-in rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Task Header */}
                  <button
                    onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                      {taskTypeIcons[task.type] || <FileText className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.client_name && (
                          <span className="text-xs text-muted-foreground">
                            pro {task.client_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{taskTypeLabels[task.type] || task.type}</span>
                        <span className={priorityColors[task.priority]}>
                          {task.priority === 'urgent' ? 'Urgentní' :
                           task.priority === 'high' ? 'Vysoká' :
                           task.priority === 'medium' ? 'Střední' : 'Nízká'}
                        </span>
                        <span>{formatDate(task.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          'flex items-center gap-1 border',
                          statusConfig[task.status]?.color || 'bg-white/10'
                        )}
                      >
                        {statusConfig[task.status]?.icon}
                        {statusConfig[task.status]?.label || task.status}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform',
                          expandedId === task.id && 'rotate-180'
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedId === task.id && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      {task.description && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Popis</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      )}

                      {task.output && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Výstup agenta</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyOutput(task.output!)}
                              className="gap-2 text-xs"
                            >
                              <Copy className="h-3 w-3" />
                              Kopírovat
                            </Button>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 max-h-[400px] overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap font-sans">
                              {task.output}
                            </pre>
                          </div>
                        </div>
                      )}

                      {task.feedback && (
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                          <p className="text-sm font-medium text-blue-300 mb-1">
                            Poznámka od Supervisora:
                          </p>
                          <p className="text-sm text-muted-foreground">{task.feedback}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs text-muted-foreground">
                          ID: {task.id}
                        </span>
                        {task.agent_type && (
                          <span className="text-xs text-muted-foreground">
                            Agent: {task.agent_type}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
